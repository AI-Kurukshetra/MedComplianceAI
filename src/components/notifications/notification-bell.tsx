import Link from "next/link";

export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <Link
      href="/notifications"
      className="relative flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
      aria-label="Open notifications"
    >
      <span className="material-symbols-outlined">notifications</span>
      {unreadCount > 0 ? (
        <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500" />
      ) : null}
    </Link>
  );
}
