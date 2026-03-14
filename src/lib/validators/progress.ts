import { z } from "zod";

export const ProgressUserSchema = z.object({
  userId: z.string().uuid(),
});

export const TrackLearningTimeSchema = z.object({
  moduleId: z.string().uuid(),
  minutes: z.number().int().min(1).max(240),
});
