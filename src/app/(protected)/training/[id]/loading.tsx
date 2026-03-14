export default function TrainingDetailLoading() {
  return (
    <div className="space-y-4">
      <div className="hero-card p-6 space-y-3">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton h-9 w-2/3" />
        <div className="skeleton h-4 w-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="surface-card p-5 space-y-3">
          <div className="skeleton h-5 w-40" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
        </div>
        <div className="surface-card p-5 space-y-3">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-9 w-full" />
          <div className="skeleton h-9 w-full" />
        </div>
      </div>
    </div>
  );
}
