import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const referrer = await prisma.founder.findUnique({
    where: { referralCode: code },
    select: { id: true, slug: true },
  });

  if (!referrer) {
    // Invalid referral code — just redirect to submit without cookie
    return NextResponse.redirect(new URL("/submit", req.url));
  }

  const response = NextResponse.redirect(new URL("/submit", req.url));
  response.cookies.set("ref", code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  return response;
}
