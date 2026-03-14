"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { UserRole } from "@/lib/constants/roles";
import { useI18n } from "@/lib/i18n/context";

type NavItem = {
  href: string;
  labelKey: string;
  icon: string;
  roles?: UserRole[];
};

const navItems: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: "dashboard" },
  { href: "/training", labelKey: "nav.training", icon: "school" },
  { href: "/certifications", labelKey: "nav.certificates", icon: "workspace_premium" },
  { href: "/notifications", labelKey: "nav.notifications", icon: "notifications_active" },
  { href: "/dashboard/ai-assistant", labelKey: "nav.aiCoach", icon: "psychology" },
  { href: "/profile", labelKey: "nav.profile", icon: "person" },
  {
    href: "/dashboard/compliance",
    labelKey: "nav.compliance",
    icon: "monitoring",
    roles: ["org_admin", "compliance_manager"],
  },
  {
    href: "/dashboard/predictive",
    labelKey: "nav.predictive",
    icon: "insights",
    roles: ["org_admin", "compliance_manager"],
  },
  { href: "/admin", labelKey: "nav.admin", icon: "admin_panel_settings", roles: ["org_admin"] },
  {
    href: "/admin/modules",
    labelKey: "nav.moduleStudio",
    icon: "edit_document",
    roles: ["org_admin"],
  },
  {
    href: "/admin/users",
    labelKey: "nav.staff",
    icon: "groups",
    roles: ["org_admin", "compliance_manager"],
  },
  {
    href: "/admin/audit",
    labelKey: "nav.auditTrail",
    icon: "history",
    roles: ["org_admin", "compliance_manager"],
  },
  {
    href: "/admin/policies",
    labelKey: "nav.policyLibrary",
    icon: "description",
    roles: ["org_admin", "compliance_manager"],
  },
];

function canAccess(role: UserRole, item: NavItem): boolean {
  return !item.roles || item.roles.includes(role);
}

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white p-4 lg:block">
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <span className="material-symbols-outlined text-lg">health_and_safety</span>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">MedCompliance</p>
          <p className="text-sm font-bold text-slate-900">Operations</p>
        </div>
      </div>

      <nav className="space-y-1">
        {navItems.filter((item) => canAccess(role, item)).map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border border-primary/25 bg-primary/10 text-primary shadow-sm shadow-primary/10"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span>{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
