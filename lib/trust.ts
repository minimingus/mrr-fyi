import { VerificationStatus } from "@prisma/client";

interface TrustScoreInput {
  emailVerified: boolean;
  stripeAccountId: string | null;
  updatedAt: Date;
  productUrl: string;
}

/**
 * Compute a trust score for a founder.
 *
 * Points:
 *   +1  email verified
 *   +2  productUrl is reachable (HTTP 2xx/3xx)
 *   +5  Stripe account connected
 *   +2  updated within the last 14 days
 */
export async function computeTrustScore(founder: TrustScoreInput): Promise<number> {
  let score = 0;

  if (founder.emailVerified) score += 1;

  if (founder.stripeAccountId) score += 5;

  const daysSinceUpdate =
    (Date.now() - new Date(founder.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate <= 14) score += 2;

  try {
    const res = await fetch(founder.productUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
    });
    if (res.ok || (res.status >= 300 && res.status < 400)) score += 2;
  } catch {
    // URL not reachable or timed out — no points
  }

  return score;
}

/**
 * Derive verificationStatus from current founder state.
 *
 *  VERIFIED      — paid Verified badge active
 *  CONNECTED     — Stripe account linked (MRR verified via OAuth)
 *  SELF_REPORTED — neither of the above
 */
export function computeVerificationStatus(founder: {
  verified: boolean;
  stripeAccountId: string | null;
}): VerificationStatus {
  if (founder.verified) return VerificationStatus.VERIFIED;
  if (founder.stripeAccountId) return VerificationStatus.CONNECTED;
  return VerificationStatus.SELF_REPORTED;
}

/**
 * Ranking formula for the non-verified leaderboard sort.
 *
 * rank_score = log(mrr + 1) * 0.6 + trustScore * 0.3 + recencyScore * 0.1
 * where recencyScore = max(0, 1 - daysSinceUpdate / 60)
 */
export function computeRankScore(
  mrr: number,
  trustScore: number,
  updatedAt: Date
): number {
  const daysSinceUpdate =
    (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 1 - daysSinceUpdate / 60);
  return Math.log(mrr + 1) * 0.6 + trustScore * 0.3 + recencyScore * 0.1;
}
