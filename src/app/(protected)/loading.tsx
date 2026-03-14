// Shown while the protected layout itself is resolving (auth check + profile fetch)
export default function ProtectedLoading() {
  return (
    <main className="relative min-h-screen py-4">
      <div className="dashboard-shell relative z-10 space-y-4">
        {/* Command bar skeleton */}
        <header className="command-bar rounded-2xl px-4 py-3 md:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="skeleton h-3 w-36" />
              <div className="skeleton h-7 w-64" />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-8 w-24 rounded-full" />
              ))}
            </div>
          </div>
        </header>

        <div className="shell-grid">
          {/* Left rail skeleton */}
          <aside className="left-rail space-y-3">
            <div className="rail-card space-y-2">
              <div className="skeleton h-3 w-16" />
              <div className="skeleton h-5 w-32" />
              <div className="skeleton h-4 w-20" />
            </div>
            <div className="rail-card space-y-2">
              <div className="skeleton h-3 w-24" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-9 w-full rounded-lg" />
              ))}
            </div>
          </aside>

          {/* Main content skeleton */}
          <section className="space-y-4">
            <div className="hero-card rounded-2xl p-5 md:p-6 space-y-3">
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-8 w-56" />
              <div className="skeleton h-4 w-full max-w-lg" />
              <div className="kpi-grid mt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="kpi-tile space-y-2">
                    <div className="skeleton h-3 w-24" />
                    <div className="skeleton h-8 w-16" />
                  </div>
                ))}
              </div>
            </div>
            <div className="surface-card rounded-2xl p-5 space-y-3">
              <div className="skeleton h-6 w-48" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-4 flex justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                  </div>
                  <div className="skeleton h-8 w-24 rounded-md" />
                </div>
              ))}
            </div>
          </section>

          {/* Right rail skeleton */}
          <aside className="right-rail space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rail-card space-y-2">
                <div className="skeleton h-3 w-24" />
                <div className="skeleton h-5 w-40" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-3/4" />
              </div>
            ))}
          </aside>
        </div>
      </div>
    </main>
  );
}
