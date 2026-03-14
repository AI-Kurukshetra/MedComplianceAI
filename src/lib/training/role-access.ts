import { ROLES, type UserRole } from "@/lib/constants/roles";

function isKnownRole(value: string): value is UserRole {
  return (ROLES as readonly string[]).includes(value);
}

export function normalizeRole(role: string): UserRole {
  return isKnownRole(role) ? role : "learner";
}

export function audienceFilterForRole(role: string): string {
  const normalizedRole = normalizeRole(role);
  return `audience_role.eq.all,audience_role.eq.${normalizedRole}`;
}

export function canRoleAccessAudience(role: string, audienceRole: string | null | undefined): boolean {
  if (!audienceRole) {
    return false;
  }

  const normalizedRole = normalizeRole(role);
  return audienceRole === "all" || audienceRole === normalizedRole;
}
