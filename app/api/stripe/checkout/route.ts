import { NextRequest, NextResponse } from "next/server";
import { createStripeCheckoutSession } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  slug: z.string(),
  plan: z.enum(["FEATURED", "VERIFIED"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { slug, plan } = parsed.data;

    const founder = await prisma.founder.findUnique({ where: { slug } });
    if (!founder) {
      return NextResponse.json({ error: "Founder not found" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const url = await createStripeCheckoutSession(
      plan,
      founder.id,
      `${appUrl}/${slug}?payment=success`
    );

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
