export default function ProfileLoading() {
  return (
    <div className="space-y-4">
      <div className="hero-card p-6 space-y-2">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-8 w-40" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="surface-card p-5">
          <div className="skeleton h-48 w-full" />
        </div>
        <div className="surface-card p-5">
          <div className="skeleton h-48 w-full" />
        </div>
      </div>
    </div>
  );
}
