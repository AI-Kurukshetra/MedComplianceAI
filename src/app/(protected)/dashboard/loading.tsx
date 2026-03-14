export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      {/* Hero skeleton */}
      <section className="hero-card rounded-2xl p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex gap-2">
              <div className="skeleton h-5 w-24 rounded-full" />
            </div>
            <div className="skeleton h-10 w-72" />
            <div className="skeleton h-4 w-full max-w-lg" />
            <div className="mt-4 flex flex-wrap gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="kpi-tile w-28 space-y-2">
                  <div className="skeleton h-5 w-6" />
                  <div className="skeleton h-8 w-10" />
                  <div className="skeleton h-3 w-16" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="skeleton h-[140px] w-[140px] rounded-full" />
            <div className="surface-card skeleton h-[76px] w-36 rounded-xl" />
            <div className="skeleton h-8 w-28 rounded-full" />
          </div>
        </div>
      </section>

      {/* 2-col grid skeleton */}
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {/* Spotlight */}
          <section className="surface-card rounded-2xl p-5 space-y-3">
            <div className="flex gap-2">
              <div className="skeleton h-5 w-16 rounded-full" />
              <div className="skeleton h-4 w-32" />
            </div>
            <div className="skeleton h-6 w-2/3" />
            <div className="flex gap-2">
              <div className="skeleton h-5 w-20 rounded-full" />
              <div className="skeleton h-4 w-28" />
            </div>
            <div className="flex gap-3 pt-1">
              <div className="skeleton h-10 w-36 rounded-lg" />
              <div className="skeleton h-10 w-32 rounded-lg" />
            </div>
          </section>

          {/* Pending list */}
          <section className="surface-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="skeleton h-3 w-28" />
                <div className="skeleton h-5 w-36" />
              </div>
              <div className="skeleton h-8 w-20 rounded-lg" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white/90 p-4 flex items-center justify-between gap-3"
              >
                <div className="space-y-2 flex-1">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="flex gap-2">
                    <div className="skeleton h-4 w-14 rounded-full" />
                    <div className="skeleton h-4 w-20 rounded-full" />
                  </div>
                </div>
                <div className="skeleton h-8 w-20 rounded-lg" />
              </div>
            ))}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Notifications */}
          <section className="surface-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="skeleton h-3 w-16" />
              <div className="skeleton h-7 w-10 rounded-lg" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-100 bg-white/85 p-3 flex gap-2">
                <div className="skeleton h-5 w-5 rounded" />
                <div className="flex-1 space-y-1.5">
                  <div className="skeleton h-3 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                  <div className="skeleton h-3 w-20" />
                </div>
              </div>
            ))}
          </section>

          {/* Certs */}
          <section className="surface-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="skeleton h-3 w-36" />
              <div className="skeleton h-7 w-10 rounded-lg" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white/90 p-3.5 space-y-1.5">
                <div className="skeleton h-3 w-14" />
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            ))}
          </section>

          {/* Quick nav */}
          <section className="surface-card rounded-2xl p-5 space-y-3">
            <div className="skeleton h-3 w-24" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-10 rounded-xl" />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
