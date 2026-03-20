import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/submit/route";
import { prisma } from "@/lib/prisma";
import { sendUpdateLink } from "@/lib/email";
import { createRequest, cleanDatabase } from "../helpers";

describe("POST /api/submit", () => {
  beforeEach(async () => {
    await cleanDatabase();
    vi.clearAllMocks();
  });

  const validBody = {
    name: "Jane Doe",
    email: "jane@example.com",
    productName: "Acme SaaS",
    productUrl: "https://acme.com",
    mrr: 500,
    currency: "USD",
  };

  it("creates a founder, snapshot, and sends email", async () => {
    const req = createRequest("/api/submit", { body: validBody });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.slug).toBe("acme-saas");

    const founder = await prisma.founder.findUnique({
      where: { slug: "acme-saas" },
      include: { snapshots: true },
    });

    expect(founder).not.toBeNull();
    expect(founder!.name).toBe("Jane Doe");
    expect(founder!.mrr).toBe(50000); // 500 * 100
    expect(founder!.snapshots).toHaveLength(1);
    expect(founder!.snapshots[0].mrr).toBe(50000);

    expect(sendUpdateLink).toHaveBeenCalledWith(
      "jane@example.com",
      "Acme SaaS",
      expect.any(String)
    );
  });

  it("returns 400 for missing required fields", async () => {
    const req = createRequest("/api/submit", {
      body: { name: "Jane" },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("returns 400 for negative MRR", async () => {
    const req = createRequest("/api/submit", {
      body: { ...validBody, mrr: -100 },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/negative/i);
  });

  it("returns 400 for invalid email", async () => {
    const req = createRequest("/api/submit", {
      body: { ...validBody, email: "not-an-email" },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("handles duplicate slug by appending a number", async () => {
    // Create first founder with same product name
    const req1 = createRequest("/api/submit", { body: validBody });
    const res1 = await POST(req1);
    expect(res1.status).toBe(201);
    const data1 = await res1.json();
    expect(data1.slug).toBe("acme-saas");

    // Create second founder with same product name
    const req2 = createRequest("/api/submit", {
      body: { ...validBody, email: "jane2@example.com" },
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(201);
    const data2 = await res2.json();
    expect(data2.slug).toBe("acme-saas-1");
  });

  it("strips @ from twitter handle", async () => {
    const req = createRequest("/api/submit", {
      body: { ...validBody, twitter: "@janedoe" },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    const founder = await prisma.founder.findUnique({
      where: { slug: data.slug },
    });
    expect(founder!.twitter).toBe("janedoe");
  });
});
