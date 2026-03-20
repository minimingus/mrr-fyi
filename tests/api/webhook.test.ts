import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/webhook/route";
import { prisma } from "@/lib/prisma";
import {
  createRawRequest,
  createTestFounder,
  cleanDatabase,
  signWebhookBody,
} from "../helpers";

const WEBHOOK_SECRET = "test-webhook-secret";

function webhookPayload(eventName: string, customData: Record<string, unknown>, subscriptionId = "sub_123") {
  return JSON.stringify({
    meta: { event_name: eventName, custom_data: customData },
    data: { id: subscriptionId },
  });
}

describe("POST /api/webhook", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("rejects requests with missing signature", async () => {
    const body = webhookPayload("subscription_created", {});
    const req = createRawRequest("/api/webhook", body);
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/signature/i);
  });

  it("rejects requests with invalid signature", async () => {
    const body = webhookPayload("subscription_created", {});
    const req = createRawRequest("/api/webhook", body, {
      "x-signature": "invalid-signature",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/signature/i);
  });

  it("sets verified flag on subscription_created with VERIFIED plan", async () => {
    const founder = await createTestFounder({ verified: false, featured: false });

    const body = webhookPayload(
      "subscription_created",
      { founderId: founder.id, plan: "VERIFIED" },
      "sub_verified_1"
    );
    const signature = signWebhookBody(body, WEBHOOK_SECRET);
    const req = createRawRequest("/api/webhook", body, {
      "x-signature": signature,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const updated = await prisma.founder.findUnique({
      where: { id: founder.id },
    });
    expect(updated!.verified).toBe(true);
    expect(updated!.featured).toBe(false);

    const payment = await prisma.payment.findUnique({
      where: { externalId: "sub_verified_1" },
    });
    expect(payment).not.toBeNull();
    expect(payment!.type).toBe("VERIFIED");
    expect(payment!.active).toBe(true);
  });

  it("sets featured flag on subscription_created with FEATURED plan", async () => {
    const founder = await createTestFounder({ verified: false, featured: false });

    const body = webhookPayload(
      "subscription_created",
      { founderId: founder.id, plan: "FEATURED" },
      "sub_featured_1"
    );
    const signature = signWebhookBody(body, WEBHOOK_SECRET);
    const req = createRawRequest("/api/webhook", body, {
      "x-signature": signature,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const updated = await prisma.founder.findUnique({
      where: { id: founder.id },
    });
    expect(updated!.featured).toBe(true);
  });

  it("clears verified flag on subscription_cancelled", async () => {
    const founder = await createTestFounder({ verified: true });

    // Create the payment record first
    await prisma.payment.create({
      data: {
        founderId: founder.id,
        type: "VERIFIED",
        externalId: "sub_cancel_1",
        active: true,
      },
    });

    const body = webhookPayload(
      "subscription_cancelled",
      {},
      "sub_cancel_1"
    );
    const signature = signWebhookBody(body, WEBHOOK_SECRET);
    const req = createRawRequest("/api/webhook", body, {
      "x-signature": signature,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const updated = await prisma.founder.findUnique({
      where: { id: founder.id },
    });
    expect(updated!.verified).toBe(false);

    const payment = await prisma.payment.findUnique({
      where: { externalId: "sub_cancel_1" },
    });
    expect(payment!.active).toBe(false);
  });

  it("clears featured flag on subscription_expired", async () => {
    const founder = await createTestFounder({ featured: true });

    await prisma.payment.create({
      data: {
        founderId: founder.id,
        type: "FEATURED",
        externalId: "sub_expire_1",
        active: true,
      },
    });

    const body = webhookPayload(
      "subscription_expired",
      {},
      "sub_expire_1"
    );
    const signature = signWebhookBody(body, WEBHOOK_SECRET);
    const req = createRawRequest("/api/webhook", body, {
      "x-signature": signature,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const updated = await prisma.founder.findUnique({
      where: { id: founder.id },
    });
    expect(updated!.featured).toBe(false);
  });

  it("handles unknown event gracefully", async () => {
    const body = webhookPayload("order_completed", {});
    const signature = signWebhookBody(body, WEBHOOK_SECRET);
    const req = createRawRequest("/api/webhook", body, {
      "x-signature": signature,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
  });
});
