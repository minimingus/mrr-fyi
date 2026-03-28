import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET as authorizeGET } from "@/app/api/stripe/connect/authorize/route";
import { GET as callbackGET } from "@/app/api/stripe/connect/callback/route";
import { GET as mrrSyncGET } from "@/app/api/cron/stripe-mrr-sync/route";
import { prisma } from "@/lib/prisma";
import { createTestFounder, cleanDatabase } from "../helpers";
import { NextRequest } from "next/server";

// Mock stripe lib — no real Stripe calls in tests
vi.mock("@/lib/stripe", async () => {
  const actual = await vi.importActual<typeof import("@/lib/stripe")>("@/lib/stripe");
  return {
    ...actual,
    buildStripeConnectUrl: vi.fn(
      (state: string, redirectUri: string) =>
        `https://connect.stripe.com/oauth/authorize?state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`
    ),
    exchangeStripeConnectCode: vi.fn().mockResolvedValue({
      stripeUserId: "acct_test_123",
    }),
    calculateMRRFromStripe: vi.fn().mockResolvedValue(500000), // $5,000 in cents
  };
});

function makeRequest(url: string, headers?: Record<string, string>): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), { headers });
}

describe("GET /api/stripe/connect/authorize", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("redirects to error when token is missing", async () => {
    const req = makeRequest("http://localhost:3000/api/stripe/connect/authorize");
    const res = await authorizeGET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=missing_token");
  });

  it("redirects to error when token is invalid", async () => {
    const req = makeRequest(
      "http://localhost:3000/api/stripe/connect/authorize?token=bad-token"
    );
    const res = await authorizeGET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=invalid_token");
  });

  it("redirects to Stripe OAuth URL when token is valid", async () => {
    const founder = await createTestFounder();
    const req = makeRequest(
      `http://localhost:3000/api/stripe/connect/authorize?token=${founder.updateToken}`
    );
    const res = await authorizeGET(req);
    expect(res.status).toBe(307);
    const location = res.headers.get("location")!;
    expect(location).toContain("connect.stripe.com");
    expect(location).toContain(`state=${founder.updateToken}`);
  });
});

describe("GET /api/stripe/connect/callback", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("redirects to error when Stripe returns an error param", async () => {
    const req = makeRequest(
      "http://localhost:3000/api/stripe/connect/callback?error=access_denied"
    );
    const res = await callbackGET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=stripe_connect_denied");
  });

  it("redirects to error when code or state is missing", async () => {
    const req = makeRequest(
      "http://localhost:3000/api/stripe/connect/callback?code=auth_code"
      // no state
    );
    const res = await callbackGET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=stripe_connect_failed");
  });

  it("redirects to error when state token does not match a founder", async () => {
    const req = makeRequest(
      "http://localhost:3000/api/stripe/connect/callback?code=auth_code&state=unknown-token"
    );
    const res = await callbackGET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=invalid_state");
  });

  it("saves stripeAccountId and stripeMrr on successful connect", async () => {
    const founder = await createTestFounder();
    const req = makeRequest(
      `http://localhost:3000/api/stripe/connect/callback?code=auth_code&state=${founder.updateToken}`
    );
    const res = await callbackGET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("stripe=connected");

    const updated = await prisma.founder.findUnique({ where: { id: founder.id } });
    expect(updated!.stripeAccountId).toBe("acct_test_123");
    expect(updated!.stripeMrr).toBe(500000);
  });

  it("saves stripeAccountId even when MRR calculation fails", async () => {
    const { calculateMRRFromStripe } = await import("@/lib/stripe");
    vi.mocked(calculateMRRFromStripe).mockRejectedValueOnce(new Error("Stripe error"));

    const founder = await createTestFounder();
    const req = makeRequest(
      `http://localhost:3000/api/stripe/connect/callback?code=auth_code&state=${founder.updateToken}`
    );
    const res = await callbackGET(req);
    // Should still succeed — MRR calc is best-effort
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("stripe=connected");

    const updated = await prisma.founder.findUnique({ where: { id: founder.id } });
    expect(updated!.stripeAccountId).toBe("acct_test_123");
    expect(updated!.stripeMrr).toBeNull();
  });
});

describe("GET /api/cron/stripe-mrr-sync", () => {
  beforeEach(async () => {
    await cleanDatabase();
    process.env.CRON_SECRET = "test-cron-secret";
  });

  it("returns 401 when authorization is missing", async () => {
    const req = makeRequest("http://localhost:3000/api/cron/stripe-mrr-sync");
    const res = await mrrSyncGET(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 when authorization is wrong", async () => {
    const req = makeRequest("http://localhost:3000/api/cron/stripe-mrr-sync", {
      authorization: "Bearer wrong-secret",
    });
    const res = await mrrSyncGET(req);
    expect(res.status).toBe(401);
  });

  it("syncs stripeMrr for all founders with a connected Stripe account", async () => {
    const connected = await createTestFounder({ stripeAccountId: "acct_test_abc" });
    const unconnected = await createTestFounder({ stripeAccountId: null });

    const req = makeRequest("http://localhost:3000/api/cron/stripe-mrr-sync", {
      authorization: "Bearer test-cron-secret",
    });
    const res = await mrrSyncGET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.updated).toBe(1);
    expect(body.failed).toBe(0);
    expect(body.total).toBe(1);

    const updatedConnected = await prisma.founder.findUnique({ where: { id: connected.id } });
    expect(updatedConnected!.stripeMrr).toBe(500000);

    const updatedUnconnected = await prisma.founder.findUnique({ where: { id: unconnected.id } });
    expect(updatedUnconnected!.stripeMrr).toBeNull();
  });

  it("counts failures when MRR calculation throws", async () => {
    const { calculateMRRFromStripe } = await import("@/lib/stripe");
    vi.mocked(calculateMRRFromStripe).mockRejectedValueOnce(new Error("API error"));

    await createTestFounder({ stripeAccountId: "acct_fail_1" });

    const req = makeRequest("http://localhost:3000/api/cron/stripe-mrr-sync", {
      authorization: "Bearer test-cron-secret",
    });
    const res = await mrrSyncGET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.failed).toBe(1);
    expect(body.updated).toBe(0);
  });
});
