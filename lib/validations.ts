import { z } from "zod";

const BLOCKED_HOSTNAME_RE =
  /^(localhost|.*\.local|.*\.test|.*\.example)$/i;
const IP_ADDRESS_RE =
  /^(\d{1,3}\.){3}\d{1,3}$|^\[.*\]$/;

function isBlockedUrl(raw: string): boolean {
  try {
    const { hostname } = new URL(raw);
    return BLOCKED_HOSTNAME_RE.test(hostname) || IP_ADDRESS_RE.test(hostname);
  } catch {
    return false;
  }
}

export const submitSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Must be a valid email"),
  twitter: z
    .string()
    .optional()
    .transform((v) => (v ? v.replace(/^@/, "") : v)),
  bio: z.string().max(280, "Bio must be max 280 characters").optional(),
  websiteUrl: z
    .string()
    .url("Must be a valid URL")
    .refine((url) => !url.toLowerCase().startsWith("javascript:"), { message: "Invalid URL scheme" })
    .optional()
    .or(z.literal("")),
  avatarUrl: z
    .string()
    .url("Must be a valid URL")
    .refine((url) => !url.toLowerCase().startsWith("javascript:"), { message: "Invalid URL scheme" })
    .optional()
    .or(z.literal("")),
  productName: z.string().min(2, "Product name must be at least 2 characters"),
  productUrl: z
    .string()
    .url("Must be a valid URL")
    .refine((url) => !isBlockedUrl(url), {
      message: "Product URL must be a publicly reachable domain",
    }),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(280, "Max 280 characters")
    .optional()
    .or(z.literal("")),
  category: z.enum(["SAAS", "ECOMMERCE", "AGENCY", "CREATOR", "MARKETPLACE", "DEV_TOOLS", "OTHER"]).optional(),
  mrr: z
    .number({ error: "MRR must be a number" })
    .min(0, "MRR cannot be negative"),
  currency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD"]).default("USD"),
  mrrRangeMin: z.number().int().min(0).optional(),
  mrrRangeMax: z.number().int().min(0).optional(),
});

export type SubmitInput = z.input<typeof submitSchema>;
export type SubmitOutput = z.infer<typeof submitSchema>;
