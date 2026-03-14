import { z } from "zod";
import { ROLES } from "@/lib/constants/roles";
import { REGULATIONS } from "@/lib/constants/regulations";

export const UpdateUserRoleSchema = z.object({
  role: z.enum(ROLES),
});

export const BulkAssignModuleSchema = z.object({
  moduleId: z.string().uuid(),
  userIds: z.array(z.string().uuid()).min(1),
});

const AudienceRoles = ["all", ...ROLES] as const;

export const CreateAdminModuleSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(4000),
  regulation: z.enum(REGULATIONS),
  audienceRole: z.enum(AudienceRoles),
  estimatedMinutes: z.number().int().min(1).max(600),
  contentUrl: z.string().url().optional(),
  contentMarkdown: z.string().trim().max(20000).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateAdminModuleSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(4000),
  regulation: z.enum(REGULATIONS),
  audienceRole: z.enum(AudienceRoles),
  estimatedMinutes: z.number().int().min(1).max(600),
  contentUrl: z.string().url().optional(),
  contentMarkdown: z.string().trim().max(20000).optional(),
  isActive: z.boolean(),
});
