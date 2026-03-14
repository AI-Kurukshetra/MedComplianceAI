"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

function asString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWith(path: string, key: "error" | "success", message: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(message)}`);
}

const PROFILE_PATH = "/profile";

export async function updateProfileAction(formData: FormData) {
  const user = await requireUserContext();
  const supabase = await createClient();

  const fullName = asString(formData, "full_name");
  if (!fullName) {
    redirectWith(PROFILE_PATH, "error", "Full name is required");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, updated_at: new Date().toISOString() })
    .eq("id", user.userId)
    .eq("organization_id", user.organizationId);

  if (error) {
    redirectWith(PROFILE_PATH, "error", error.message);
  }

  await supabase.from("audit_logs").insert({
    organization_id: user.organizationId,
    actor_user_id: user.userId,
    action: "profile_updated",
    entity_type: "profiles",
    entity_id: user.userId,
    metadata: { full_name: fullName },
  });

  revalidatePath(PROFILE_PATH);
  redirectWith(PROFILE_PATH, "success", "Profile updated successfully");
}

export async function changePasswordAction(formData: FormData) {
  const user = await requireUserContext();
  const supabase = await createClient();

  const newPassword = asString(formData, "new_password");
  const confirmPassword = asString(formData, "confirm_password");

  if (!newPassword || !confirmPassword) {
    redirectWith(PROFILE_PATH, "error", "Both password fields are required");
  }

  if (newPassword.length < 8) {
    redirectWith(PROFILE_PATH, "error", "Password must be at least 8 characters");
  }

  if (newPassword !== confirmPassword) {
    redirectWith(PROFILE_PATH, "error", "Passwords do not match");
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    redirectWith(PROFILE_PATH, "error", error.message);
  }

  await supabase.from("audit_logs").insert({
    organization_id: user.organizationId,
    actor_user_id: user.userId,
    action: "password_changed",
    entity_type: "profiles",
    entity_id: user.userId,
    metadata: {},
  });

  redirectWith(PROFILE_PATH, "success", "Password updated successfully");
}
