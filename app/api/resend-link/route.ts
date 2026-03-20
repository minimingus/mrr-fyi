import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendUpdateLink, sendVerificationEmail } from "@/lib/email";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email("Must be a valid email"),
});

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { key: "resend-link", limit: 3, windowSec: 60 });
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

    const { email } = parsed.data;

    const founders = await prisma.founder.findMany({
      where: { email },
      select: { productName: true, updateToken: true, emailVerified: true, emailVerifyToken: true },
    });

    // Always return 200 — don't reveal whether email exists
    if (founders.length === 0) {
      return NextResponse.json({ ok: true });
    }

    for (const founder of founders) {
      try {
        if (!founder.emailVerified && founder.emailVerifyToken) {
          // Re-send verification email for unverified founders
          await sendVerificationEmail(email, founder.productName, founder.emailVerifyToken);
        } else if (founder.updateToken) {
          await sendUpdateLink(email, founder.productName, founder.updateToken);
        }
      } catch (err) {
        console.error("[resend-link] failed to send:", err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[resend-link]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
