"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { generateCertificateNumber } from "@/lib/utils/certificates";
import { canRoleAccessAudience } from "@/lib/training/role-access";

const DASHBOARD_PATH = "/dashboard";

function asString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getReturnPath(formData: FormData): string {
  const returnTo = asString(formData, "return_to");
  if (!returnTo.startsWith("/")) {
    return DASHBOARD_PATH;
  }
  return returnTo;
}

function redirectWithMessage(path: string, key: "success" | "error", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

function revalidatePaths(path: string) {
  revalidatePath(DASHBOARD_PATH);
  if (path !== DASHBOARD_PATH) {
    revalidatePath(path);
  }
}

export async function createModuleAction(formData: FormData) {
  const returnPath = getReturnPath(formData);
  const user = await requireUserContext();

  if (user.role !== "org_admin") {
    redirectWithMessage(returnPath, "error", "Only organization admins can create modules.");
  }

  const title = asString(formData, "title");
  const regulation = asString(formData, "regulation");
  const audienceRole = asString(formData, "audience_role");

  if (!title || !regulation || !audienceRole) {
    redirectWithMessage(returnPath, "error", "Title, regulation, and audience role are required.");
  }

  const supabase = await createClient();

  const { data: moduleRow, error } = await supabase
    .from("training_modules")
    .insert({
      organization_id: user.organizationId,
      title,
      regulation,
      audience_role: audienceRole,
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !moduleRow) {
    redirectWithMessage(returnPath, "error", error?.message ?? "Could not create module.");
  }

  await supabase.from("audit_logs").insert({
    organization_id: user.organizationId,
    actor_user_id: user.userId,
    action: "module_created",
    entity_type: "training_modules",
    entity_id: moduleRow.id,
    metadata: {
      title,
      regulation,
      audience_role: audienceRole,
    },
  });

  revalidatePaths(returnPath);
  redirectWithMessage(returnPath, "success", "Module created");
}

export async function assignModuleToSelfAction(formData: FormData) {
  const returnPath = getReturnPath(formData);
  const user = await requireUserContext();
  const moduleId = asString(formData, "module_id");

  if (!moduleId) {
    redirectWithMessage(returnPath, "error", "Invalid module selected.");
  }

  const supabase = await createClient();
  const { data: module, error: moduleError } = await supabase
    .from("training_modules")
    .select("id, audience_role")
    .eq("organization_id", user.organizationId)
    .eq("id", moduleId)
    .eq("is_active", true)
    .maybeSingle();

  if (moduleError || !module) {
    redirectWithMessage(returnPath, "error", moduleError?.message ?? "Module not found.");
  }

  if (!canRoleAccessAudience(user.role, module.audience_role)) {
    redirectWithMessage(returnPath, "error", "This training module is not available for your role.");
  }

  const { data: existingAssignment } = await supabase
    .from("module_assignments")
    .select("id")
    .eq("organization_id", user.organizationId)
    .eq("user_id", user.userId)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (!existingAssignment) {
    const { data: createdAssignment, error: assignError } = await supabase
      .from("module_assignments")
      .insert({
        organization_id: user.organizationId,
        user_id: user.userId,
        module_id: moduleId,
        status: "assigned",
      })
      .select("id")
      .single();

    if (assignError || !createdAssignment) {
      redirectWithMessage(returnPath, "error", assignError?.message ?? "Could not assign module.");
    }

    await supabase.from("notifications").insert({
      organization_id: user.organizationId,
      user_id: user.userId,
      kind: "assignment",
      title: "New Module Assigned",
      message: "A new compliance module was assigned to you.",
    });

    await supabase.from("audit_logs").insert({
      organization_id: user.organizationId,
      actor_user_id: user.userId,
      action: "module_assigned_self",
      entity_type: "module_assignments",
      entity_id: createdAssignment.id,
      metadata: {
        module_id: moduleId,
      },
    });
  }

  revalidatePaths(returnPath);
  redirectWithMessage(returnPath, "success", "Module assigned");
}

export async function markAssignmentCompleteAction(formData: FormData) {
  const returnPath = getReturnPath(formData);
  const user = await requireUserContext();
  const assignmentId = asString(formData, "assignment_id");
  const rawScore = asString(formData, "score");
  const parsedScore = Number(rawScore || "100");
  const score = Number.isFinite(parsedScore)
    ? Math.max(0, Math.min(100, parsedScore))
    : 100;

  if (!assignmentId) {
    redirectWithMessage(returnPath, "error", "Invalid assignment selected.");
  }

  const supabase = await createClient();
  const { data: assignment, error: assignmentError } = await supabase
    .from("module_assignments")
    .select("id, module_id, status")
    .eq("id", assignmentId)
    .eq("organization_id", user.organizationId)
    .eq("user_id", user.userId)
    .maybeSingle();

  if (assignmentError || !assignment) {
    redirectWithMessage(returnPath, "error", "Assignment not found.");
  }

  const { error: updateError } = await supabase
    .from("module_assignments")
    .update({
      status: "completed",
      score,
      completed_at: new Date().toISOString(),
    })
    .eq("id", assignment.id)
    .eq("organization_id", user.organizationId)
    .eq("user_id", user.userId);

  if (updateError) {
    redirectWithMessage(returnPath, "error", updateError.message);
  }

  const { data: existingCertification } = await supabase
    .from("certifications")
    .select("id")
    .eq("organization_id", user.organizationId)
    .eq("user_id", user.userId)
    .eq("module_id", assignment.module_id)
    .maybeSingle();

  if (!existingCertification) {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    const { error: certError } = await supabase.from("certifications").insert({
      organization_id: user.organizationId,
      user_id: user.userId,
      module_id: assignment.module_id,
      certificate_no: generateCertificateNumber(user.userId, assignment.module_id),
      issued_at: new Date().toISOString(),
      expires_at: nextYear.toISOString(),
    });

    if (certError) {
      redirectWithMessage(returnPath, "error", certError.message);
    }
  }

  await supabase.from("notifications").insert({
    organization_id: user.organizationId,
    user_id: user.userId,
    kind: "renewal",
    title: "Certificate Issued",
    message: "Certification issued. Renewal reminder will be scheduled automatically.",
  });

  await supabase.from("audit_logs").insert({
    organization_id: user.organizationId,
    actor_user_id: user.userId,
    action: "assignment_completed",
    entity_type: "module_assignments",
    entity_id: assignment.id,
    metadata: {
      score,
      module_id: assignment.module_id,
    },
  });

  revalidatePaths(returnPath);
  redirectWithMessage(returnPath, "success", "Assignment marked as completed");
}

export async function markNotificationReadAction(formData: FormData) {
  const returnPath = getReturnPath(formData);
  const user = await requireUserContext();
  const notificationId = asString(formData, "notification_id");

  if (!notificationId) {
    redirectWithMessage(returnPath, "error", "Invalid notification selected.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("organization_id", user.organizationId)
    .eq("user_id", user.userId);

  if (error) {
    redirectWithMessage(returnPath, "error", error.message);
  }

  revalidatePaths(returnPath);
  redirectWithMessage(returnPath, "success", "Notification updated");
}

export async function markAllNotificationsReadAction(formData: FormData) {
  const returnPath = getReturnPath(formData);
  const user = await requireUserContext();
  const supabase = await createClient();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("organization_id", user.organizationId)
    .eq("user_id", user.userId)
    .is("read_at", null);

  if (error) {
    redirectWithMessage(returnPath, "error", error.message);
  }

  await supabase.from("audit_logs").insert({
    organization_id: user.organizationId,
    actor_user_id: user.userId,
    action: "notifications_marked_all_read",
    entity_type: "notifications",
    entity_id: user.userId,
    metadata: {},
  });

  revalidatePaths(returnPath);
  redirectWithMessage(returnPath, "success", "All notifications marked as read");
}
