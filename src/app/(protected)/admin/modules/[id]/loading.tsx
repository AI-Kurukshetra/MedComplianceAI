export default function AdminModuleEditLoading() {
  return (
    <div className="space-y-4">
      <div className="hero-card p-6 space-y-2">
        <div className="skeleton h-3 w-36" />
        <div className="skeleton h-9 w-2/3" />
      </div>
      <div className="surface-card p-4">
        <div className="skeleton h-[520px] w-full" />
      </div>
    </div>
  );
}
