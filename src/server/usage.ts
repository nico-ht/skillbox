import { z } from "zod";

export const usageContext = z.object({
  harness: z.string().max(160).optional(),
  model: z.string().max(160).optional(),
  task: z.string().max(300).optional(),
  purpose: z.string().max(500).optional(),
}).optional();

export const usageInput = z.object({
  id: z.string().min(1).max(200),
  revision: z.string().min(1).max(160),
  outcome: z.enum(["applied", "succeeded", "failed"]),
  context: usageContext,
});
