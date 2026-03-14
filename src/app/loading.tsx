// Root-level loading shown while the home page (/) resolves
export default function RootLoading() {
  return (
    <main className="relative min-h-screen px-5 py-8 md:px-10 md:py-10">
      <div className="relative z-10 mx-auto max-w-6xl space-y-8">
        {/* Hero card skeleton */}
        <div className="hero-card rounded-2xl p-6 md:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="skeleton h-5 w-48 rounded-full" />
              <div className="skeleton h-12 w-72" />
              <div className="skeleton h-4 w-full max-w-lg" />
              <div className="skeleton h-4 w-3/4 max-w-md" />
            </div>
            <div className="surface-card rounded-xl px-4 py-3 space-y-2">
              <div className="skeleton h-3 w-28" />
              <div className="skeleton h-5 w-36" />
            </div>
          </div>
        </div>

        {/* Three step cards skeleton */}
        <section className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="surface-card rounded-xl p-4 space-y-2">
              <div className="skeleton h-3 w-24" />
              <div className="skeleton h-5 w-40" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-3/4" />
            </div>
          ))}
        </section>

        {/* CTA paths skeleton */}
        <div className="surface-card rounded-2xl p-6 md:p-8 space-y-4">
          <div className="skeleton h-7 w-52" />
          <div className="skeleton h-4 w-full max-w-lg" />
          <div className="grid gap-3 md:grid-cols-3 mt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white/80 p-4 space-y-3">
                <div className="skeleton h-3 w-16" />
                <div className="skeleton h-5 w-32" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-9 w-32 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
