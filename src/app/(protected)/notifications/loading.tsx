export default function NotificationsLoading() {
  return (
    <section className="space-y-4">
      <div className="hero-card rounded-2xl p-5 md:p-6 space-y-3">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-full max-w-sm" />
      </div>

      {/* Filter + mark-all row */}
      <div className="surface-card rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-24 rounded-full" />
          ))}
        </div>
        <div className="skeleton h-8 w-28 rounded-md" />
      </div>

      {/* Notification rows */}
      <div className="surface-card rounded-2xl divide-y divide-slate-100">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-start justify-between gap-4 p-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="skeleton mt-1 h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
                <div className="skeleton h-3 w-1/3" />
              </div>
            </div>
            <div className="skeleton h-7 w-20 rounded-md shrink-0" />
          </div>
        ))}
      </div>
    </section>
  );
}
