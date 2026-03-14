import Link from "next/link";
import { resetPasswordAction } from "@/app/auth/actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pickValue(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return null;
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const error = pickValue(params.error);

  return (
    <section className="surface-card w-full rounded-2xl p-6 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Recovery Session</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Set New Password</h1>
        </div>
        <span className="badge">Password Update</span>
      </div>

      <p className="muted mt-3 text-sm">
        Choose a strong password with at least 8 characters.
      </p>

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-[var(--danger-bg)] p-3 text-sm text-[var(--danger-fg)]">
          {decodeURIComponent(error)}
        </p>
      ) : null}

      <form action={resetPasswordAction} className="mt-5 space-y-4">
        <label className="block text-sm text-slate-700">
          New Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="field mt-1 w-full rounded-md p-2.5"
            placeholder="At least 8 characters"
          />
        </label>

        <label className="block text-sm text-slate-700">
          Confirm Password
          <input
            name="confirm_password"
            type="password"
            required
            minLength={8}
            className="field mt-1 w-full rounded-md p-2.5"
            placeholder="Repeat your password"
          />
        </label>

        <button type="submit" className="btn-primary w-full rounded-md px-4 py-2.5 text-sm font-semibold">
          Update Password
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Return to{" "}
        <Link href="/auth/sign-in" className="font-medium text-slate-900 underline">
          sign in
        </Link>
      </p>
    </section>
  );
}
