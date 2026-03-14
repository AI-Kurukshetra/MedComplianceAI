import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { NotificationsView } from "@/components/notifications/notifications-view";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type NotificationFilter = "all" | "unread" | "urgent" | "training" | "policy" | "compliance";

type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

function pickValue(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return null;
}

function normalizeKind(kind: string): string {
  return kind.trim().toLowerCase();
}

function matchesFilter(notification: NotificationRow, filter: NotificationFilter): boolean {
  const kind = normalizeKind(notification.kind);
  if (filter === "all") return true;
  if (filter === "unread") return notification.read_at === null;
  if (filter === "urgent") return kind.includes("urgent") || kind.includes("overdue") || kind.includes("critical");
  if (filter === "training") return kind.includes("training");
  if (filter === "policy") return kind.includes("policy");
  return kind.includes("compliance") || kind.includes("certificate");
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUserContext();
  const params = await searchParams;
  const error = pickValue(params.error);
  const success = pickValue(params.success);
  const rawFilter = pickValue(params.filter);
  const filter: NotificationFilter =
    rawFilter === "unread" ||
    rawFilter === "urgent" ||
    rawFilter === "training" ||
    rawFilter === "policy" ||
    rawFilter === "compliance"
      ? rawFilter
      : "all";
  const supabase = await createClient();

  const { data: notificationsData } = await supabase
    .from("notifications")
    .select("id, kind, title, message, read_at, created_at")
    .eq("organization_id", user.organizationId)
    .eq("user_id", user.userId)
    .order("created_at", { ascending: false })
    .limit(100);

  const notifications = (notificationsData ?? []) as NotificationRow[];
  const unreadCount = notifications.filter((item) => item.read_at === null).length;
  const urgentCount = notifications.filter((item) => matchesFilter(item, "urgent")).length;

  return (
    <NotificationsView
      notifications={notifications.map((n) => ({
        id: n.id,
        kind: n.kind,
        title: n.title,
        message: n.message,
        readAt: n.read_at,
        createdAt: n.created_at,
      }))}
      unreadCount={unreadCount}
      urgentCount={urgentCount}
      currentFilter={filter}
      error={error}
      success={success}
    />
  );
}
