import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { submitSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { key: "submit", limit: 5, windowSec: 60 });
  if (limited) return limited;

  try {
    const body = await req.json();
    const parsed = submitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, twitter, productName, productUrl, description, mrr, currency } =
      parsed.data;

    const baseSlug = slugify(productName);
    let slug = baseSlug;
    let attempt = 0;
    while (await prisma.founder.findUnique({ where: { slug } })) {
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    const mrrCents = Math.round(mrr * 100);
    const updateToken = crypto.randomUUID();
    const emailVerifyToken = crypto.randomUUID();

    const founder = await prisma.founder.create({
      data: {
        slug,
        name,
        email,
        twitter: twitter || null,
        productName,
        productUrl,
        description: description || null,
        mrr: mrrCents,
        currency,
        updateToken,
        emailVerifyToken,
        snapshots: {
          create: { mrr: mrrCents },
        },
      },
    });

    try {
      await sendVerificationEmail(email, productName, emailVerifyToken);
    } catch (err) {
      console.error("[email] failed to send verification email:", err);
    }

    return NextResponse.json({ slug: founder.slug }, { status: 201 });
  } catch (err) {
    console.error("[submit]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
