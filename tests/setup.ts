import { config } from "dotenv";
import { vi } from "vitest";

// Load test-specific env vars (overrides .env)
config({ path: ".env.test", override: true });

// Mock email module — do NOT send real emails in tests
vi.mock("@/lib/email", () => ({
  sendUpdateLink: vi.fn().mockResolvedValue(undefined),
  sendUpdateConfirmation: vi.fn().mockResolvedValue(undefined),
  sendMilestoneReached: vi.fn().mockResolvedValue(undefined),
  sendMonthlyDigest: vi.fn().mockResolvedValue(undefined),
}));

// Disable rate limiting in tests
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue(null),
}));

// Set test env vars
process.env.LS_WEBHOOK_SECRET = "test-webhook-secret";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
