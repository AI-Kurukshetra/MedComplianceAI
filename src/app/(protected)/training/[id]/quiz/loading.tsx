export default function TrainingQuizLoading() {
  return (
    <div className="space-y-4">
      <div className="hero-card p-6 space-y-2">
        <div className="skeleton h-8 w-1/3" />
        <div className="skeleton h-4 w-2/3" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="surface-card p-4 space-y-3">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-20 w-full" />
        </div>
        <div className="surface-card p-5 space-y-3">
          <div className="skeleton h-5 w-28" />
          <div className="skeleton h-6 w-full" />
          <div className="skeleton h-16 w-full" />
          <div className="skeleton h-16 w-full" />
        </div>
      </div>
    </div>
  );
}
