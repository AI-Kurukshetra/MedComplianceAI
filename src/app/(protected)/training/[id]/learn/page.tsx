import { notFound } from "next/navigation";
import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { ModulePlayer } from "@/components/training/module-player";
import { canRoleAccessAudience } from "@/lib/training/role-access";

export default async function TrainingLearnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUserContext();
  const supabase = await createClient();

  const { data: module } = await supabase
    .from("training_modules")
    .select("id, title, description, content_markdown, content_url, audience_role, estimated_minutes")
    .eq("organization_id", user.organizationId)
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (!module) notFound();
  if (!canRoleAccessAudience(user.role, module.audience_role)) notFound();

  /* Transition assignment from 'assigned' → 'in_progress' (idempotent) */
  await supabase
    .from("module_assignments")
    .update({ status: "in_progress" })
    .eq("organization_id", user.organizationId)
    .eq("user_id", user.userId)
    .eq("module_id", id)
    .eq("status", "assigned"); // only update if still in 'assigned' state

  return (
    <ModulePlayer
      moduleId={module.id}
      title={module.title}
      description={module.description}
      contentMarkdown={module.content_markdown}
      contentUrl={module.content_url}
      estimatedMinutes={module.estimated_minutes}
    />
  );
}
