import { formatDateTime } from "@/lib/utils/date";

type NotificationItemProps = {
  id: string;
  kind: string;
  title: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  action?: React.ReactNode;
};

function tone(kind: string): string {
  if (kind === "overdue") return "status-badge status-overdue";
  if (kind === "renewal") return "status-badge status-in_progress";
  if (kind === "assignment") return "status-badge status-assigned";
  return "status-badge status-completed";
}

export function NotificationItem({
  kind,
  title,
  message,
  createdAt,
  readAt,
  action,
}: NotificationItemProps) {
  return (
    <article className="surface-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <span className={tone(kind)}>{kind}</span>
          </div>
          <p className="text-sm text-slate-600">{message}</p>
          <p className="text-xs text-slate-500">{formatDateTime(createdAt)}</p>
        </div>

        <div className="w-full sm:w-auto">{readAt ? <span className="text-xs font-semibold text-emerald-600">Read</span> : action}</div>
      </div>
    </article>
  );
}
