import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendUpdateLink } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Must be a valid email"),
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

    const { email } = parsed.data;

    const founders = await prisma.founder.findMany({
      where: { email },
      select: { productName: true, updateToken: true },
    });

    // Always return 200 — don't reveal whether email exists
    if (founders.length === 0) {
      return NextResponse.json({ ok: true });
    }

    for (const founder of founders) {
      if (!founder.updateToken) continue;
      try {
        await sendUpdateLink(email, founder.productName, founder.updateToken);
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
