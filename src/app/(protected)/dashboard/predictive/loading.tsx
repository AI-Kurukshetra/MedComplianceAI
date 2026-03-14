export default function PredictiveLoading() {
  return (
    <div className="space-y-4">
      <div className="hero-card p-6 space-y-2">
        <div className="skeleton h-3 w-40" />
        <div className="skeleton h-9 w-2/3" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="kpi-tile">
            <div className="skeleton h-3 w-20" />
            <div className="mt-2 skeleton h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div className="surface-card p-4">
          <div className="skeleton h-72 w-full" />
        </div>
        <div className="space-y-4">
          <div className="surface-card p-4">
            <div className="skeleton h-36 w-full" />
          </div>
          <div className="surface-card p-4">
            <div className="skeleton h-40 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
