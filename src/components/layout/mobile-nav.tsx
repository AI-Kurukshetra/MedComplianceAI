"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { UserRole } from "@/lib/constants/roles";
import { useI18n } from "@/lib/i18n/context";

type MobileItem = {
  href: string;
  labelKey: string;
  icon: string;
  roles?: UserRole[];
};

const mobileItems: MobileItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: "home" },
  { href: "/training", labelKey: "nav.training", icon: "school" },
  { href: "/certifications", labelKey: "nav.certificates", icon: "workspace_premium" },
  { href: "/notifications", labelKey: "nav.notifications", icon: "notifications" },
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

function canAccess(role: UserRole, item: MobileItem): boolean {
  return !item.roles || item.roles.includes(role);
}

export function MobileNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
      <ul className="scrollbar-hide flex items-center gap-1 overflow-x-auto pb-0.5">
        {mobileItems.filter((item) => canAccess(role, item)).map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-w-[68px] flex-col items-center justify-center rounded-md px-2 py-1.5 text-[11px] font-semibold",
                  active
                    ? "border border-primary/25 bg-primary/10 text-primary shadow-sm shadow-primary/10"
                    : "text-slate-500",
                )}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{t(item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
