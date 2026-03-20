import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/update/route";
import { prisma } from "@/lib/prisma";
import { sendUpdateConfirmation, sendMilestoneReached } from "@/lib/email";
import { createRequest, createTestFounder, cleanDatabase } from "../helpers";

describe("POST /api/update", () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
  });

  it("updates MRR and creates a snapshot", async () => {
    const founder = await createTestFounder({ mrr: 10000 }); // $100

    const req = createRequest("/api/update", {
      body: { token: founder.updateToken, mrr: 200 },
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.slug).toBe(founder.slug);

    const updated = await prisma.founder.findUnique({
      where: { id: founder.id },
      include: { snapshots: true },
    });

    expect(updated!.mrr).toBe(20000); // $200 in cents
    expect(updated!.snapshots).toHaveLength(1);
    expect(updated!.snapshots[0].mrr).toBe(20000);

    expect(sendUpdateConfirmation).toHaveBeenCalledWith(
      founder.email,
      founder.productName,
      20000,
      10000,
      expect.any(Number),
      "USD"
    );
  });

  it("returns 404 for invalid token", async () => {
    const req = createRequest("/api/update", {
      body: { token: "invalid-token", mrr: 100 },
    });
    const res = await POST(req);

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toMatch(/invalid/i);
  });

  it("returns 400 for missing token", async () => {
    const req = createRequest("/api/update", {
      body: { mrr: 100 },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 400 for negative MRR", async () => {
    const founder = await createTestFounder();
    const req = createRequest("/api/update", {
      body: { token: founder.updateToken, mrr: -50 },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("detects milestone crossing and sends email", async () => {
    const founder = await createTestFounder({
      mrr: 90000, // $900 — just below $1,000 milestone
      email: "milestone@example.com",
    });

    const req = createRequest("/api/update", {
      body: { token: founder.updateToken, mrr: 1100 }, // $1,100
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    // Check milestone was created
    const milestones = await prisma.mRRMilestone.findMany({
      where: { founderId: founder.id },
    });
    expect(milestones).toHaveLength(1);
    expect(milestones[0].amount).toBe(100000); // $1,000 in cents

    expect(sendMilestoneReached).toHaveBeenCalledWith(
      "milestone@example.com",
      founder.productName,
      100000,
      "USD",
      founder.slug
    );
  });

  it("does not create duplicate milestones", async () => {
    const founder = await createTestFounder({ mrr: 90000 });

    // First update crosses $1K
    const req1 = createRequest("/api/update", {
      body: { token: founder.updateToken, mrr: 1100 },
    });
    await POST(req1);

    // Second update stays above $1K
    vi.clearAllMocks();
    const req2 = createRequest("/api/update", {
      body: { token: founder.updateToken, mrr: 1200 },
    });
    await POST(req2);

    const milestones = await prisma.mRRMilestone.findMany({
      where: { founderId: founder.id },
    });
    expect(milestones).toHaveLength(1);

    // Should NOT send milestone email again
    expect(sendMilestoneReached).not.toHaveBeenCalled();
  });
});
