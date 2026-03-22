import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  token: z.string().min(1),
  name: z.string().min(2, "Name must be at least 2 characters"),
  productName: z.string().min(2, "Product name must be at least 2 characters"),
  productUrl: z.string().url("Must be a valid URL").refine(
    (url) => !url.toLowerCase().startsWith('javascript:'),
    { message: 'Invalid URL scheme' }
  ),
  description: z.string().max(280, "Max 280 characters").optional(),
  category: z.enum(["SAAS", "ECOMMERCE", "AGENCY", "CREATOR", "MARKETPLACE", "DEV_TOOLS", "OTHER"]).optional().nullable(),
  twitter: z
    .string()
    .optional()
    .transform((v) => (v ? v.replace(/^@/, "") : v)),
  bio: z.string().max(280, "Bio must be max 280 characters").optional(),
  websiteUrl: z
    .string()
    .url("Must be a valid URL")
    .refine((url) => !url.toLowerCase().startsWith("javascript:"), { message: "Invalid URL scheme" })
    .optional()
    .or(z.literal("")),
  avatarUrl: z
    .string()
    .url("Must be a valid URL")
    .refine((url) => !url.toLowerCase().startsWith("javascript:"), { message: "Invalid URL scheme" })
    .optional()
    .or(z.literal("")),
});

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const founder = await prisma.founder.findUnique({
      where: { updateToken: token },
      select: {
        name: true,
        productName: true,
        productUrl: true,
        description: true,
        category: true,
        twitter: true,
        bio: true,
        websiteUrl: true,
        avatarUrl: true,
        verified: true,
        featured: true,
        slug: true,
        referralCode: true,
        stripeAccountId: true,
        stripeMrr: true,
        payments: {
          where: { active: true },
          select: { trialEndsAt: true, type: true },
          take: 1,
        },
        _count: { select: { referralsMade: true } },
      },
    });

    if (!founder) {
      return NextResponse.json(
        { error: "Invalid or expired link" },
        { status: 404 }
      );
    }

    const activePayment = founder.payments[0] ?? null;
    const trialExpired = activePayment?.trialEndsAt
      ? new Date(activePayment.trialEndsAt) < new Date()
      : false;

    return NextResponse.json({
      name: founder.name,
      productName: founder.productName,
      productUrl: founder.productUrl,
      description: founder.description,
      category: founder.category,
      twitter: founder.twitter,
      bio: founder.bio,
      websiteUrl: founder.websiteUrl,
      avatarUrl: founder.avatarUrl,
      verified: founder.verified,
      featured: founder.featured,
      slug: founder.slug,
      referralCode: founder.referralCode,
      referralCount: founder._count.referralsMade,
      trialExpired,
      trialEndsAt: activePayment?.trialEndsAt ?? null,
      planType: activePayment?.type ?? null,
      stripeConnected: !!founder.stripeAccountId,
      stripeMrr: founder.stripeMrr,
    });
  } catch (err) {
    console.error("[update-profile:get]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const limited = rateLimit(req, {
    key: "update-profile",
    limit: 10,
    windowSec: 60,
  });
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

    const { token, name, productName, productUrl, description, category, twitter, bio, websiteUrl, avatarUrl } =
      parsed.data;

    const founder = await prisma.founder.findUnique({
      where: { updateToken: token },
    });

    if (!founder) {
      return NextResponse.json(
        { error: "Invalid or expired link" },
        { status: 404 }
      );
    }

    await prisma.founder.update({
      where: { id: founder.id },
      data: {
        name,
        productName,
        productUrl,
        description: description ?? null,
        category: category ?? null,
        twitter: twitter ?? null,
        bio: bio ?? null,
        websiteUrl: websiteUrl || null,
        avatarUrl: avatarUrl || null,
      },
    });

    return NextResponse.json({ slug: founder.slug });
  } catch (err) {
    console.error("[update-profile]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
