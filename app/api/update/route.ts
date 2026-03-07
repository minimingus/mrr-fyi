import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1),
  mrr: z.number().min(0, "MRR cannot be negative"),
});

export async function POST(req: NextRequest) {
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

    await prisma.$transaction([
      prisma.founder.update({
        where: { id: founder.id },
        data: { mrr: mrrCents },
      }),
      prisma.mRRSnapshot.create({
        data: { founderId: founder.id, mrr: mrrCents },
      }),
    ]);

    return NextResponse.json({ slug: founder.slug });
  } catch (err) {
    console.error("[update]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
