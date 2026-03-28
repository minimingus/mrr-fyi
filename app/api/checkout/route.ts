import { NextRequest, NextResponse } from "next/server";
import { createCheckoutUrl, PLANS } from "@/lib/lemonsqueezy";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  slug: z.string(),
  plan: z.enum(["PRO", "FEATURED"]),
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

    const planConfig = PLANS[plan as keyof typeof PLANS];
    if (!planConfig) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const url = await createCheckoutUrl(
      planConfig.variantId,
      founder.id,
      plan,
      `${appUrl}/${slug}?payment=success`
    );

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
