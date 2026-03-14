"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/app/(protected)/dashboard/actions";
import { NotificationItem } from "@/components/notifications/notification-item";

type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};

type Props = {
  notifications: NotificationRow[];
  unreadCount: number;
  urgentCount: number;
  currentFilter: string;
  error: string | null;
  success: string | null;
};

function chipClass(active: boolean): string {
  if (active) {
    return "rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary";
  }
  return "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50";
}

function normalizeKind(kind: string): string {
  return kind.trim().toLowerCase();
}

function matchesFilter(notification: NotificationRow, filter: string): boolean {
  const kind = normalizeKind(notification.kind);
  if (filter === "all") return true;
  if (filter === "unread") return notification.readAt === null;
  if (filter === "urgent") return kind.includes("urgent") || kind.includes("overdue") || kind.includes("critical");
  if (filter === "training") return kind.includes("training");
  if (filter === "policy") return kind.includes("policy");
  return kind.includes("compliance") || kind.includes("certificate");
}

export function NotificationsView({
  notifications,
  unreadCount,
  urgentCount,
  currentFilter,
  error,
  success,
}: Props) {
  const { t } = useI18n();
  const filtered = notifications.filter((item) => matchesFilter(item, currentFilter));

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {decodeURIComponent(error)}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {decodeURIComponent(success)}
        </p>
      ) : null}

      <section className="hero-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{t("notifications.pageLabel")}</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{t("notifications.heading")}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">{t("notifications.description")}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="badge">{notifications.length} {t("notifications.total")}</span>
            <span className="badge">{unreadCount} {t("notifications.unread")}</span>
          </div>
        </div>
      </section>

      <section className="surface-card p-4">
        <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto">
          <Link href="/notifications" className={chipClass(currentFilter === "all")} prefetch={false}>
            {t("notifications.filterAll")} ({notifications.length})
          </Link>
          <Link href="/notifications?filter=unread" className={chipClass(currentFilter === "unread")} prefetch={false}>
            {t("notifications.filterUnread")} ({unreadCount})
          </Link>
          <Link href="/notifications?filter=urgent" className={chipClass(currentFilter === "urgent")} prefetch={false}>
            {t("notifications.filterUrgent")} ({urgentCount})
          </Link>
          <Link href="/notifications?filter=training" className={chipClass(currentFilter === "training")} prefetch={false}>
            {t("notifications.filterTraining")}
          </Link>
          <Link href="/notifications?filter=policy" className={chipClass(currentFilter === "policy")} prefetch={false}>
            {t("notifications.filterPolicy")}
          </Link>
          <Link href="/notifications?filter=compliance" className={chipClass(currentFilter === "compliance")} prefetch={false}>
            {t("notifications.filterCompliance")}
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="surface-card p-4 text-sm text-slate-600">{t("notifications.noNotifications")}</p>
          ) : (
            filtered.map((notification) => (
              <NotificationItem
                key={notification.id}
                id={notification.id}
                kind={notification.kind}
                title={notification.title}
                message={notification.message}
                createdAt={notification.createdAt}
                readAt={notification.readAt}
                action={notification.readAt === null ? (
                  <form action={markNotificationReadAction}>
                    <input type="hidden" name="return_to" value="/notifications" />
                    <input type="hidden" name="notification_id" value={notification.id} />
                    <button type="submit" className="btn-secondary rounded-md px-3 py-1.5 text-xs font-semibold">
                      {t("common.markRead")}
                    </button>
                  </form>
                ) : null}
              />
            ))
          )}
        </div>

        <aside className="space-y-4">
          <section className="surface-card p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">{t("notifications.quickActions")}</h3>
            <form action={markAllNotificationsReadAction} className="mt-3">
              <input type="hidden" name="return_to" value="/notifications" />
              <button type="submit" className="btn-primary w-full rounded-md px-3 py-2 text-sm font-semibold">
                {t("notifications.markAllRead")}
              </button>
            </form>
          </section>

          <section className="surface-card p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">{t("notifications.preferences")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>{t("notifications.prefAlerts")}</li>
              <li>{t("notifications.prefEmail")}</li>
              <li>{t("notifications.prefPriority")}</li>
            </ul>
          </section>
        </aside>
      </section>
    </div>
  );
}
