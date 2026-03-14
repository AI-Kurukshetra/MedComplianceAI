import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/constants/roles";
import { isManagerRole } from "@/lib/constants/roles";

export type UserContext = {
  userId: string;
  email: string | null;
  fullName: string | null;
  organizationId: string;
  organizationName: string | null;
  organizationSlug: string | null;
  role: UserRole;
};

export async function getUserContext(): Promise<UserContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const userId = user.id;
  const email = user.email ?? null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id, role, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("name, slug")
    .eq("id", profile.organization_id)
    .maybeSingle();

  return {
    userId,
    email,
    fullName: profile.full_name ?? null,
    organizationId: profile.organization_id,
    organizationName: organization?.name ?? null,
    organizationSlug: organization?.slug ?? null,
    role: profile.role as UserRole,
  };
}

export async function requireUserContext(): Promise<UserContext> {
  const user = await getUserContext();

  if (!user) {
    redirect("/?mode=sign-in");
  }

  return user;
}

export function isManager(role: UserRole): boolean {
  return isManagerRole(role);
}
