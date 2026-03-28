import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const { count } = await prisma.profileEvent.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  console.log(`[cron/prune-events] deleted ${count} events older than 90 days`);

  return NextResponse.json({ ok: true, deleted: count });
}
