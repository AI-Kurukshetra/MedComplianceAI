"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CreateAdminModuleSchema,
  UpdateAdminModuleSchema,
} from "@/lib/validators/admin";
import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

function asString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function toBoolean(value: string): boolean {
  return value === "true" || value === "on" || value === "1";
}

function normalizeReturnTo(formData: FormData, fallback: string): string {
  const returnTo = asString(formData, "return_to");
  if (!returnTo || !returnTo.startsWith("/")) {
    return fallback;
  }
  return returnTo;
}

function redirectWith(path: string, key: "success" | "error", message: string): never {
  const url = new URL(path, "http://localhost");
  url.searchParams.set(key, message);
  redirect(`${url.pathname}${url.search}`);
}

function parseModuleForm(formData: FormData) {
  const estimatedMinutes = Number(asString(formData, "estimated_minutes"));
  const contentUrl = asString(formData, "content_url");

  return {
    title: asString(formData, "title"),
    description: asString(formData, "description"),
    regulation: asString(formData, "regulation"),
    audienceRole: asString(formData, "audience_role"),
    estimatedMinutes: Number.isFinite(estimatedMinutes) ? estimatedMinutes : 0,
    contentUrl: contentUrl || undefined,
    contentMarkdown: asString(formData, "content_markdown") || undefined,
    isActive: toBoolean(asString(formData, "is_active")),
  };
}

function commonRevalidate(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}

export async function createAdminModuleAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData, "/admin/modules");
  const user = await requireUserContext();

  if (user.role !== "org_admin") {
    redirectWith(returnTo, "error", "Only organization admins can create custom modules.");
  }

  const payload = parseModuleForm(formData);
  const parsed = CreateAdminModuleSchema.safeParse(payload);

  if (!parsed.success) {
    redirectWith(returnTo, "error", "Please provide valid module details.");
  }

  const supabase = await createClient();
  const { data: moduleRow, error } = await supabase
    .from("training_modules")
    .insert({
      organization_id: user.organizationId,
      title: parsed.data.title,
      description: parsed.data.description,
      content_markdown: parsed.data.contentMarkdown ?? "",
      regulation: parsed.data.regulation,
      audience_role: parsed.data.audienceRole,
      estimated_minutes: parsed.data.estimatedMinutes,
      content_url: parsed.data.contentUrl ?? null,
      is_active: parsed.data.isActive ?? true,
      updated_at: new Date().toISOString(),
    })
    .select("id, title, regulation")
    .single();

  if (error || !moduleRow) {
    redirectWith(returnTo, "error", error?.message ?? "Unable to create module.");
  }

  await supabase.from("audit_logs").insert({
    organization_id: user.organizationId,
    actor_user_id: user.userId,
    action: "admin_module_created",
    entity_type: "training_modules",
    entity_id: moduleRow.id,
    metadata: {
      title: moduleRow.title,
      regulation: moduleRow.regulation,
    },
  });

  commonRevalidate(["/admin/modules", "/training", `/training/${moduleRow.id}`]);
  redirectWith("/admin/modules", "success", "Custom training module created.");
}

export async function updateAdminModuleAction(formData: FormData) {
  const moduleId = asString(formData, "module_id");
  const returnTo = normalizeReturnTo(formData, `/admin/modules/${moduleId}`);
  const user = await requireUserContext();

  if (user.role !== "org_admin") {
    redirectWith(returnTo, "error", "Only organization admins can edit custom modules.");
  }

  if (!moduleId) {
    redirectWith(returnTo, "error", "Invalid module selected.");
  }

  const payload = parseModuleForm(formData);
  const parsed = UpdateAdminModuleSchema.safeParse(payload);

  if (!parsed.success) {
    redirectWith(returnTo, "error", "Please provide valid module details.");
  }

  const supabase = await createClient();
  const { data: moduleRow, error } = await supabase
    .from("training_modules")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      content_markdown: parsed.data.contentMarkdown ?? "",
      regulation: parsed.data.regulation,
      audience_role: parsed.data.audienceRole,
      estimated_minutes: parsed.data.estimatedMinutes,
      content_url: parsed.data.contentUrl ?? null,
      is_active: parsed.data.isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", user.organizationId)
    .eq("id", moduleId)
    .select("id, title, regulation")
    .maybeSingle();

  if (error) {
    redirectWith(returnTo, "error", error.message);
  }

  if (!moduleRow) {
    redirectWith(returnTo, "error", "Module not found.");
  }

  await supabase.from("audit_logs").insert({
    organization_id: user.organizationId,
    actor_user_id: user.userId,
    action: "admin_module_updated",
    entity_type: "training_modules",
    entity_id: moduleRow.id,
    metadata: {
      title: moduleRow.title,
      regulation: moduleRow.regulation,
    },
  });

  commonRevalidate(["/admin/modules", `/admin/modules/${moduleRow.id}`, "/training", `/training/${moduleRow.id}`]);
  redirectWith(`/admin/modules/${moduleRow.id}`, "success", "Custom module updated.");
}

export async function archiveAdminModuleAction(formData: FormData) {
  const moduleId = asString(formData, "module_id");
  const returnTo = normalizeReturnTo(formData, "/admin/modules");
  const user = await requireUserContext();

  if (user.role !== "org_admin") {
    redirectWith(returnTo, "error", "Only organization admins can archive modules.");
  }

  if (!moduleId) {
    redirectWith(returnTo, "error", "Invalid module selected.");
  }

  const supabase = await createClient();
  const { data: moduleRow, error } = await supabase
    .from("training_modules")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", user.organizationId)
    .eq("id", moduleId)
    .select("id, title")
    .maybeSingle();

  if (error) {
    redirectWith(returnTo, "error", error.message);
  }

  if (!moduleRow) {
    redirectWith(returnTo, "error", "Module not found.");
  }

  await supabase.from("audit_logs").insert({
    organization_id: user.organizationId,
    actor_user_id: user.userId,
    action: "admin_module_archived",
    entity_type: "training_modules",
    entity_id: moduleRow.id,
    metadata: {
      title: moduleRow.title,
    },
  });

  commonRevalidate(["/admin/modules", "/training", `/training/${moduleRow.id}`]);
  redirectWith("/admin/modules", "success", "Module archived successfully.");
}
