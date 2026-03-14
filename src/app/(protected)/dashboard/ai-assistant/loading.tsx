export default function AiAssistantLoading() {
  return (
    <div className="space-y-4">
      <div className="hero-card p-6 space-y-2">
        <div className="skeleton h-3 w-40" />
        <div className="skeleton h-9 w-2/3" />
        <div className="skeleton h-4 w-full max-w-2xl" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="surface-card p-4 space-y-3">
          <div className="skeleton h-5 w-56" />
          <div className="skeleton h-20 w-full" />
          <div className="skeleton h-20 w-full" />
        </div>
        <div className="surface-card p-4 space-y-3">
          <div className="skeleton h-5 w-56" />
          <div className="skeleton h-20 w-full" />
          <div className="skeleton h-20 w-full" />
        </div>
      </div>
    </div>
  );
}
