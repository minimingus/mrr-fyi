import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const founder = await prisma.founder.findUnique({
    where: { updateToken: token },
    select: { id: true, digestUnsubscribedAt: true },
  });

  if (!founder) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  if (!founder.digestUnsubscribedAt) {
    await prisma.founder.update({
      where: { id: founder.id },
      data: { digestUnsubscribedAt: new Date() },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return NextResponse.redirect(`${appUrl}/?unsubscribed=1`);
}
