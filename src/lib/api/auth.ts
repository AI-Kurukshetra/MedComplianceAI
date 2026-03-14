import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null } as const;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return { supabase, user: null } as const;
  }

  return {
    supabase,
    user: {
      id: user.id,
      organizationId: profile.organization_id,
      role: profile.role,
    },
  } as const;
}
