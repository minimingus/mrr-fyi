import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { submitSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = submitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, twitter, productName, productUrl, description, mrr, currency } =
      parsed.data;

    // Generate unique slug
    const baseSlug = slugify(productName);
    let slug = baseSlug;
    let attempt = 0;
    while (await prisma.founder.findUnique({ where: { slug } })) {
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    const mrrCents = Math.round(mrr * 100);

    const founder = await prisma.founder.create({
      data: {
        slug,
        name,
        twitter: twitter || null,
        productName,
        productUrl,
        description: description || null,
        mrr: mrrCents,
        currency,
        snapshots: {
          create: { mrr: mrrCents },
        },
      },
    });

    return NextResponse.json({ slug: founder.slug }, { status: 201 });
  } catch (err) {
    console.error("[submit]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
