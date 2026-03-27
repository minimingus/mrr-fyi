import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  let email: string;
  try {
    email = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const signup = await prisma.emailSignup.findUnique({ where: { email } });
  if (!signup) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!signup.unsubscribedAt) {
    await prisma.emailSignup.update({
      where: { email },
      data: { unsubscribedAt: new Date() },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return NextResponse.redirect(`${appUrl}/?unsubscribed=1`);
}
