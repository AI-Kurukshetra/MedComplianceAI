import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { REGULATIONS, type Regulation } from "@/lib/constants/regulations";
import { audienceFilterForRole } from "@/lib/training/role-access";
import { TrainingView } from "@/components/training/training-view";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type ModuleRow = {
  id: string;
  title: string;
  description: string;
  regulation: Regulation;
  audience_role: string;
  estimated_minutes: number;
};

type AssignmentRow = {
  module_id: string;
  status: "assigned" | "in_progress" | "completed" | "overdue";
};

function pickValue(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return null;
}

export default async function TrainingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUserContext();
  const params = await searchParams;
  const error = pickValue(params.error);
  const success = pickValue(params.success);
  const regulation = pickValue(params.regulation);
  const canCreateModule = user.role === "org_admin";

  const supabase = await createClient();
  const modulesQuery = supabase
    .from("training_modules")
    .select("id, title, description, regulation, audience_role, estimated_minutes")
    .eq("organization_id", user.organizationId)
    .eq("is_active", true)
    .or(audienceFilterForRole(user.role))
    .order("created_at", { ascending: false });

  const { data: modulesData } = regulation
    ? await modulesQuery.eq("regulation", regulation)
    : await modulesQuery;

  const [{ data: assignmentsData }, { count: inProgressCount }] = await Promise.all([
    supabase
      .from("module_assignments")
      .select("module_id, status")
      .eq("organization_id", user.organizationId)
      .eq("user_id", user.userId),
    supabase
      .from("module_assignments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", user.organizationId)
      .eq("user_id", user.userId)
      .eq("status", "in_progress"),
  ]);

  const modules = (modulesData ?? []) as ModuleRow[];
  const assignments = (assignmentsData ?? []) as AssignmentRow[];

  return (
    <TrainingView
      modules={modules}
      assignments={assignments}
      inProgressCount={inProgressCount ?? 0}
      currentRegulation={regulation}
      canCreateModule={canCreateModule}
      error={error}
      success={success}
      regulations={REGULATIONS as unknown as string[]}
    />
  );
}
