"use client";

export default function RootError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="surface-card p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Application Error</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-600">{error.message}</p>
        <button type="button" onClick={reset} className="btn-primary mt-4 rounded-md px-4 py-2 text-sm font-semibold">
          Try again
        </button>
      </div>
    </main>
  );
}
