import Link from "next/link";
import { signOutAction } from "@/app/auth/actions";
import type { UserContext } from "@/lib/auth/user";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export function Topbar({
  user,
  unreadCount,
}: {
  user: UserContext;
  unreadCount: number;
}) {
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-3 py-3 backdrop-blur sm:px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="hidden rounded-lg bg-primary/10 p-2 text-primary sm:block">
          <span className="material-symbols-outlined">security</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900 sm:hidden">MedCompliance</p>
          <p className="hidden truncate text-sm font-bold text-slate-900 sm:block">Healthcare Compliance Platform</p>
          <p className="truncate text-xs text-slate-500">
            {(user.organizationName ? `${user.organizationName} · ` : "") + (user.fullName || user.email || "User")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Language switcher — client component */}
        <LanguageSwitcher />

        <Link
          href="/profile"
          className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 sm:size-10"
          aria-label="Open profile"
        >
          <span className="material-symbols-outlined">person</span>
        </Link>

        <Link
          href="/notifications"
          className="relative flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 sm:size-10"
        >
          <span className="material-symbols-outlined">notifications</span>
          {unreadCount > 0 ? (
            <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500" />
          ) : null}
        </Link>

        <form action={signOutAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 sm:px-3"
          >
            <span className="material-symbols-outlined text-base sm:hidden">logout</span>
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </div>
    </header>
  );
}
