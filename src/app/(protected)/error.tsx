"use client";

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="surface-card p-6">
      <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Workspace Error</p>
      <h1 className="mt-1 text-2xl font-black text-slate-900">Unable to load this page</h1>
      <p className="mt-2 text-sm text-slate-600">{error.message}</p>
      <button type="button" onClick={reset} className="btn-primary mt-4 rounded-md px-4 py-2 text-sm font-semibold">
        Retry
      </button>
    </div>
  );
}
