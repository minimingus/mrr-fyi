import { z } from "zod";

export const submitSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  twitter: z
    .string()
    .optional()
    .transform((v) => (v ? v.replace(/^@/, "") : v)),
  productName: z.string().min(2, "Product name must be at least 2 characters"),
  productUrl: z.string().url("Must be a valid URL"),
  description: z.string().max(280, "Max 280 characters").optional(),
  mrr: z
    .number({ error: "MRR must be a number" })
    .min(0, "MRR cannot be negative"),
  currency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD"]).default("USD"),
});

export type SubmitInput = z.input<typeof submitSchema>;
export type SubmitOutput = z.infer<typeof submitSchema>;
