import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  source: z.string().default("homepage"),
});

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { key: "email-signup", limit: 5, windowSec: 60 });
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

    const { email, source } = parsed.data;

    const existing = await prisma.emailSignup.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ ok: true }, { status: 409 });
    }

    await prisma.emailSignup.create({ data: { email, source } });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[email-signup]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
