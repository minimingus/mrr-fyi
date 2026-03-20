import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Create a NextRequest for testing API routes.
 */
export function createRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = "POST", body, headers = {} } = options;
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json", ...headers },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

/**
 * Create a NextRequest with raw text body (for webhook signature testing).
 */
export function createRawRequest(
  url: string,
  rawBody: string,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:3000"), {
    method: "POST",
    body: rawBody,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/**
 * Generate a valid HMAC signature for webhook testing.
 */
export function signWebhookBody(body: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

/**
 * Create a test founder directly in the database.
 */
export async function createTestFounder(overrides: Record<string, unknown> = {}) {
  return prisma.founder.create({
    data: {
      slug: `test-product-${crypto.randomUUID().slice(0, 8)}`,
      name: "Test User",
      email: "test@example.com",
      productName: "Test Product",
      productUrl: "https://test.com",
      mrr: 10000,
      currency: "USD",
      updateToken: crypto.randomUUID(),
      ...overrides,
    },
  });
}

/**
 * Clean all test data from the database.
 */
export async function cleanDatabase() {
  await prisma.$transaction([
    prisma.mRRMilestone.deleteMany(),
    prisma.mRRSnapshot.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.founder.deleteMany(),
  ]);
}
