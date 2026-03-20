import { NextRequest, NextResponse } from "next/server";
import { createStripePortalSession } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1),
  returnUrl: z.string().url(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { token, returnUrl } = parsed.data;

    const founder = await prisma.founder.findUnique({
      where: { updateToken: token },
      include: {
        payments: {
          where: { active: true, provider: "STRIPE" },
          take: 1,
        },
      },
    });

    if (!founder) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    const activePayment = founder.payments[0];
    if (!activePayment) {
      return NextResponse.json(
        { error: "No active Stripe subscription found" },
        { status: 404 }
      );
    }

    const url = await createStripePortalSession(activePayment.externalId, returnUrl);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[stripe/portal]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
