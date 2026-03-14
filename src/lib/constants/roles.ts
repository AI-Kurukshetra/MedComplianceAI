export const ROLES = ["org_admin", "compliance_manager", "learner"] as const;

export type UserRole = (typeof ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  org_admin: "Org Admin",
  compliance_manager: "Compliance Manager",
  learner: "Learner",
};

export function isManagerRole(role: UserRole): boolean {
  return role === "org_admin" || role === "compliance_manager";
}

export function isAdminRole(role: UserRole): boolean {
  return role === "org_admin";
}
