import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  slug: z.string().min(1).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { slug } = parsed.data;
    const founder = await prisma.founder.findUnique({
      where: { slug, emailVerified: true },
      select: { id: true, isPro: true },
    });

    if (!founder || !founder.isPro) {
      return NextResponse.json({ ok: true }); // silently ignore non-Pro
    }

    const referrer = req.headers.get("referer") ?? null;

    await prisma.profileEvent.create({
      data: {
        founderId: founder.id,
        type: "LINK_CLICK",
        referrer: referrer ? new URL(referrer).hostname : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // never error to client
  }
}
