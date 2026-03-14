export default function AdminLoading() {
  return (
    <section className="space-y-4">
      <div className="hero-card rounded-2xl p-5 md:p-6 space-y-3">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-8 w-44" />
        <div className="skeleton h-4 w-full max-w-sm" />
      </div>

      {/* Tab bar skeleton */}
      <div className="surface-card rounded-2xl p-4 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-8 w-28 rounded-full" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="surface-card rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 border-b border-slate-200 bg-slate-50/80 px-5 py-3">
          {[140, 180, 100, 100, 90].map((w, i) => (
            <div key={i} className={`skeleton h-3`} style={{ width: w }} />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-slate-100 px-5 py-4">
            <div className="skeleton h-4 w-36" />
            <div className="skeleton h-4 w-44" />
            <div className="skeleton h-5 w-24 rounded-full" />
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-7 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </section>
  );
}
