import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline — MedCompliance AI",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="surface-card max-w-md rounded-2xl p-8">
        <p className="text-5xl">📡</p>
        <h1 className="mt-4 text-2xl font-black text-slate-900">You&apos;re Offline</h1>
        <p className="mt-2 text-sm text-slate-600">
          MedCompliance AI needs a connection to load this page. Your quiz progress and any completed
          assessments will sync automatically once you&apos;re back online.
        </p>

        <div className="mt-6 space-y-3">
          <Link
            href="/dashboard"
            className="btn-primary block w-full rounded-xl px-4 py-3 text-sm font-bold"
          >
            Try Dashboard
          </Link>
          <Link
            href="/training"
            className="btn-secondary block w-full rounded-xl px-4 py-3 text-sm font-semibold"
          >
            Browse Training
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          Previously visited pages may still be available. Check your browser&apos;s back button.
        </p>
      </div>
    </div>
  );
}
