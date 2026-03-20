import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendUpdateLink } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { key: "verify", limit: 10, windowSec: 60 });
  if (limited) return limited;

  try {
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const founder = await prisma.founder.findUnique({
      where: { emailVerifyToken: token },
    });

    if (!founder) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
    }

    if (founder.emailVerified) {
      return NextResponse.json({ slug: founder.slug, alreadyVerified: true });
    }

    await prisma.founder.update({
      where: { id: founder.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
      },
    });

    // Send the update link now that they're verified
    if (founder.email && founder.updateToken) {
      try {
        await sendUpdateLink(founder.email, founder.productName, founder.updateToken);
      } catch (err) {
        console.error("[verify] failed to send update link:", err);
      }
    }

    return NextResponse.json({ slug: founder.slug });
  } catch (err) {
    console.error("[verify]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
