import { ProgressUserSchema } from "@/lib/validators/progress";
import { fail, ok } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth";
import { isManagerRole } from "@/lib/constants/roles";

type AssignmentProgressRow = {
  id: string;
  module_id: string;
  status: "assigned" | "in_progress" | "completed" | "overdue";
  score: number | null;
  due_date: string | null;
  completed_at: string | null;
  assigned_at: string;
  time_spent_minutes: number;
  training_modules:
    | {
        title: string;
        regulation: string;
        estimated_minutes: number;
      }[]
    | null;
};

export async function GET(
  _: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const routeParams = await params;
  const parsedParams = ProgressUserSchema.safeParse(routeParams);

  if (!parsedParams.success) {
    return fail("Validation failed", 400, "INVALID_INPUT");
  }

  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

  if (!isManagerRole(user.role as "org_admin" | "compliance_manager" | "learner")) {
    return fail("Forbidden", 403);
  }

  const userId = parsedParams.data.userId;
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("organization_id", user.organizationId)
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    return fail(profileError.message, 400, "FETCH_FAILED");
  }

  if (!profile) {
    return fail("User not found", 404, "NOT_FOUND");
  }

  const { data, error } = await supabase
    .from("module_assignments")
    .select(
      "id, module_id, status, score, due_date, completed_at, assigned_at, time_spent_minutes, training_modules(title, regulation, estimated_minutes)",
    )
    .eq("organization_id", user.organizationId)
    .eq("user_id", userId)
    .order("assigned_at", { ascending: false });

  if (error) {
    return fail(error.message, 400, "FETCH_FAILED");
  }

  const items = (data ?? []) as unknown as AssignmentProgressRow[];
  const scoredItems = items.filter((item) => typeof item.score === "number");
  const totalTimeSpentMinutes = items.reduce((sum, item) => sum + (item.time_spent_minutes ?? 0), 0);
  const completedAssignments = items.filter((item) => item.status === "completed").length;

  return ok({
    profile: {
      id: profile.id,
      fullName: profile.full_name ?? "Unknown User",
      email: profile.email ?? null,
      role: profile.role,
    },
    summary: {
      totalAssignments: items.length,
      completedAssignments,
      inProgressAssignments: items.filter((item) => item.status === "in_progress").length,
      overdueAssignments: items.filter((item) => item.status === "overdue").length,
      completionPct: items.length > 0 ? Math.round((completedAssignments / items.length) * 100) : 0,
      avgScore: scoredItems.length > 0
        ? Number(
            (
              scoredItems.reduce((sum, item) => sum + Number(item.score ?? 0), 0) / scoredItems.length
            ).toFixed(2),
          )
        : null,
      totalTimeSpentMinutes,
    },
    items: items.map((item) => ({
      id: item.id,
      moduleId: item.module_id,
      moduleTitle: item.training_modules?.[0]?.title ?? "Untitled Module",
      regulation: item.training_modules?.[0]?.regulation ?? "HIPAA",
      estimatedMinutes: item.training_modules?.[0]?.estimated_minutes ?? 0,
      status: item.status,
      score: item.score,
      dueDate: item.due_date,
      completedAt: item.completed_at,
      assignedAt: item.assigned_at,
      timeSpentMinutes: item.time_spent_minutes ?? 0,
    })),
  });
}
