import { z } from "zod";

export const RecommendationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(12).default(6),
});

export const ThreatTrainingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).default(4),
});

export const PredictiveQuerySchema = z.object({
  horizonDays: z.coerce.number().int().min(7).max(90).default(30),
});
