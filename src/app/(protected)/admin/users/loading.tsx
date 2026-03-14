export default function AdminUsersLoading() {
  return (
    <div className="space-y-4">
      <div className="hero-card p-6 space-y-2">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton h-9 w-1/2" />
      </div>
      <div className="surface-card p-4">
        <div className="skeleton h-72 w-full" />
      </div>
    </div>
  );
}
