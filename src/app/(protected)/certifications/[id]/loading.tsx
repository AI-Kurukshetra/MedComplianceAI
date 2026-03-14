export default function CertificationDetailLoading() {
  return (
    <div className="space-y-4">
      <div className="hero-card p-6 space-y-2">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-9 w-2/3" />
      </div>
      <div className="surface-card p-6 space-y-3">
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-14 w-full" />
      </div>
    </div>
  );
}
