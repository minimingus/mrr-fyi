import { prisma } from "@/lib/prisma";
import { PricingContent } from "./PricingContent";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const verifiedCount = await prisma.founder.count({
    where: { stripeAccountId: { not: null }, verified: true },
  });

  return <PricingContent verifiedCount={verifiedCount} />;
}
