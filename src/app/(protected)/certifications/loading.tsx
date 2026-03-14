export default function CertificationsLoading() {
  return (
    <section className="space-y-4">
      <div className="hero-card rounded-2xl p-5 md:p-6 space-y-3">
        <div className="skeleton h-3 w-32" />
        <div className="skeleton h-8 w-52" />
        <div className="skeleton h-4 w-full max-w-md" />
      </div>

      {/* Stats row */}
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="kpi-tile space-y-2">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Certificate cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface-card rounded-2xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className="skeleton h-5 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
                <div className="skeleton h-3 w-2/3" />
              </div>
              <div className="skeleton h-6 w-16 rounded-full" />
            </div>
            <div className="skeleton h-px w-full" />
            <div className="flex items-center justify-between">
              <div className="skeleton h-3 w-32" />
              <div className="skeleton h-8 w-28 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
