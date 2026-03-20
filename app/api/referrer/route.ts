import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const founder = await prisma.founder.findUnique({
    where: { referralCode: code },
    select: { name: true, twitter: true, productName: true },
  });

  if (!founder) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    name: founder.name,
    twitter: founder.twitter,
    productName: founder.productName,
  });
}
