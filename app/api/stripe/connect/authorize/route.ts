import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildStripeConnectUrl } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/?error=missing_token", req.url));
  }

  const founder = await prisma.founder.findUnique({ where: { updateToken: token } });
  if (!founder) {
    return NextResponse.redirect(new URL("/?error=invalid_token", req.url));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const redirectUri = `${appUrl}/api/stripe/connect/callback`;

  let connectUrl: string;
  try {
    connectUrl = buildStripeConnectUrl(token, redirectUri);
  } catch {
    return NextResponse.redirect(new URL("/?error=stripe_connect_unavailable", req.url));
  }

  return NextResponse.redirect(connectUrl);
}
