import { z } from "zod";
import { REGULATIONS } from "@/lib/constants/regulations";

const RegulationSchema = z.enum(REGULATIONS);

export const TrainingFilterSchema = z.object({
  regulation: RegulationSchema.optional(),
  status: z.enum(["assigned", "in_progress", "completed", "overdue"]).optional(),
  audience_role: z.string().trim().min(1).max(64).optional(),
});

export const StartModuleSchema = z.object({
  dueDate: z.string().datetime().optional(),
});

export const CompleteModuleSchema = z.object({
  score: z.number().min(0).max(100),
});

export const CreateModuleSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(4000).optional(),
  regulation: RegulationSchema,
  audienceRole: z.string().trim().min(1).max(64),
  estimatedMinutes: z.number().int().min(1).max(600).optional(),
});
