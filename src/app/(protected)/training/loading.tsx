export default function TrainingLoading() {
  return (
    <section className="space-y-4">
      <div className="hero-card rounded-2xl p-5 md:p-6 space-y-3">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-8 w-56" />
        <div className="skeleton h-4 w-full max-w-lg" />
      </div>

      {/* Filter bar skeleton */}
      <div className="surface-card rounded-2xl p-4 flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-8 w-28 rounded-full" />
        ))}
      </div>

      {/* Module cards grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="surface-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-5 w-16 rounded-full" />
            </div>
            <div className="skeleton h-3 w-1/2" />
            <div className="skeleton h-3 w-2/3" />
            <div className="flex items-center justify-between mt-2">
              <div className="skeleton h-3 w-20" />
              <div className="skeleton h-8 w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
