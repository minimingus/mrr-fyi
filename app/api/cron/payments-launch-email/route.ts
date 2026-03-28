import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPaymentsLaunchEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const EVENT_KEY = "payments_launch_email_sent";

export async function POST(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Idempotency guard — only send once
  const existing = await prisma.systemEvent.findUnique({
    where: { key: EVENT_KEY },
  });
  if (existing) {
    return NextResponse.json({ skipped: true, reason: "already sent" });
  }

  // Mark as sent before sending to prevent double-fire on concurrent calls
  await prisma.systemEvent.create({ data: { key: EVENT_KEY } });

  const signups = await prisma.emailSignup.findMany({
    where: { unsubscribedAt: null },
    select: { email: true },
  });

  let sent = 0;
  let failed = 0;

  for (const signup of signups) {
    const token = Buffer.from(signup.email).toString("base64url");
    try {
      await sendPaymentsLaunchEmail(signup.email, token);
      sent++;
    } catch (err) {
      console.error(`[payments-launch-email] Failed to send to ${signup.email}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ sent, failed });
}
