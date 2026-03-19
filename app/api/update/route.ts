import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { sendUpdateConfirmation, sendMilestoneReached } from "@/lib/email";

const MRR_MILESTONES = [1_000, 5_000, 10_000, 50_000, 100_000].map(
  (d) => d * 100
);

const schema = z.object({
  token: z.string().min(1),
  mrr: z.number().min(0, "MRR cannot be negative"),
});

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { key: "update", limit: 10, windowSec: 60 });
  if (limited) return limited;

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { token, mrr } = parsed.data;

    const founder = await prisma.founder.findUnique({
      where: { updateToken: token },
    });

    if (!founder) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
    }

    const mrrCents = Math.round(mrr * 100);
    const oldMrrCents = founder.mrr;

    await prisma.$transaction([
      prisma.founder.update({
        where: { id: founder.id },
        data: { mrr: mrrCents },
      }),
      prisma.mRRSnapshot.create({
        data: { founderId: founder.id, mrr: mrrCents },
      }),
    ]);

    const rank = await prisma.founder.count({
      where: { mrr: { gt: mrrCents } },
    }).then((above) => above + 1);

    // Detect newly crossed milestones
    const newMilestones = MRR_MILESTONES.filter(
      (m) => mrrCents >= m && oldMrrCents < m
    );

    if (newMilestones.length > 0) {
      const existing = await prisma.mRRMilestone.findMany({
        where: { founderId: founder.id, amount: { in: newMilestones } },
        select: { amount: true },
      });
      const existingSet = new Set(existing.map((e) => e.amount));
      const toCreate = newMilestones.filter((m) => !existingSet.has(m));

      if (toCreate.length > 0) {
        await prisma.mRRMilestone.createMany({
          data: toCreate.map((amount) => ({
            founderId: founder.id,
            amount,
          })),
        });

        // Send celebration email for the highest new milestone
        if (founder.email) {
          const highest = Math.max(...toCreate);
          try {
            await sendMilestoneReached(
              founder.email,
              founder.productName,
              highest,
              founder.currency,
              founder.slug
            );
          } catch (err) {
            console.error("[email] failed to send milestone email:", err);
          }
        }
      }
    }

    if (founder.email) {
      try {
        await sendUpdateConfirmation(
          founder.email,
          founder.productName,
          mrrCents,
          oldMrrCents,
          rank,
          founder.currency
        );
      } catch (err) {
        console.error("[email] failed to send update confirmation:", err);
      }
    }

    return NextResponse.json({ slug: founder.slug });
  } catch (err) {
    console.error("[update]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
