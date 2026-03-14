export default function ComplianceLoading() {
  return (
    <div className="space-y-4">
      <div className="hero-card p-6 space-y-2">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton h-9 w-1/2" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="surface-card p-4">
          <div className="skeleton h-64 w-full" />
        </div>
        <div className="surface-card p-4">
          <div className="skeleton h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
