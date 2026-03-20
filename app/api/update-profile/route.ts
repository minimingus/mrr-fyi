import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  token: z.string().min(1),
  name: z.string().min(2, "Name must be at least 2 characters"),
  productName: z.string().min(2, "Product name must be at least 2 characters"),
  productUrl: z.string().url("Must be a valid URL"),
  description: z.string().max(280, "Max 280 characters").optional(),
  twitter: z
    .string()
    .optional()
    .transform((v) => (v ? v.replace(/^@/, "") : v)),
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
        twitter: true,
      },
    });

    if (!founder) {
      return NextResponse.json(
        { error: "Invalid or expired link" },
        { status: 404 }
      );
    }

    return NextResponse.json(founder);
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

    const { token, name, productName, productUrl, description, twitter } =
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
        twitter: twitter ?? null,
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
