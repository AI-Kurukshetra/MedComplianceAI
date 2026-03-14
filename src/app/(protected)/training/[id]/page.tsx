import { notFound, redirect } from "next/navigation";
import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { canRoleAccessAudience } from "@/lib/training/role-access";
import { ModuleDetailView } from "@/components/training/module-detail-view";

export default async function TrainingModuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUserContext();
  const supabase = await createClient();

  const [{ data: module }, { data: assignment }] = await Promise.all([
    supabase
      .from("training_modules")
      .select("id, title, description, regulation, audience_role, estimated_minutes, created_at")
      .eq("organization_id", user.organizationId)
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("module_assignments")
      .select("id, status, score, due_date, completed_at")
      .eq("organization_id", user.organizationId)
      .eq("user_id", user.userId)
      .eq("module_id", id)
      .maybeSingle(),
  ]);

  if (!module) notFound();
  if (!canRoleAccessAudience(user.role, module.audience_role)) {
    redirect("/training?error=This%20module%20is%20not%20available%20for%20your%20role");
  }

  return <ModuleDetailView module={module} assignment={assignment} />;
}
