import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendUpdateLink, sendReferralNotification, sendOnboardingWelcome } from "@/lib/email";
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

      // Send onboarding welcome email (step 1) and mark step
      try {
        await sendOnboardingWelcome(
          founder.email,
          founder.productName,
          founder.slug,
          founder.updateToken,
          founder.referralCode
        );
        await prisma.founder.update({
          where: { id: founder.id },
          data: { onboardingStep: 1 },
        });
      } catch (err) {
        console.error("[verify] failed to send onboarding welcome:", err);
      }
    }

    // Handle referral: create Referral record and notify referrer
    if (founder.referredBy) {
      try {
        const referrer = await prisma.founder.findUnique({
          where: { referralCode: founder.referredBy },
          select: { id: true, email: true, productName: true, updateToken: true },
        });

        if (referrer && referrer.id !== founder.id) {
          await prisma.referral.create({
            data: {
              referrerId: referrer.id,
              referredId: founder.id,
            },
          });

          if (referrer.email && referrer.updateToken) {
            const totalReferrals = await prisma.referral.count({
              where: { referrerId: referrer.id },
            });
            await sendReferralNotification(
              referrer.email,
              referrer.productName,
              founder.productName,
              founder.slug,
              totalReferrals,
              referrer.updateToken
            );
          }
        }
      } catch (err) {
        console.error("[verify] referral processing error:", err);
      }
    }

    return NextResponse.json({ slug: founder.slug });
  } catch (err) {
    console.error("[verify]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
