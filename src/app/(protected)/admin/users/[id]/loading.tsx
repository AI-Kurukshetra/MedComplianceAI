export default function AdminUserDetailLoading() {
  return (
    <div className="space-y-4">
      <div className="hero-card p-6 space-y-2">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-9 w-1/2" />
      </div>
      <div className="surface-card p-5">
        <div className="skeleton h-56 w-full" />
      </div>
    </div>
  );
}
