import Link from "next/link";
import { requestPasswordResetAction } from "@/app/auth/actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pickValue(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return null;
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const error = pickValue(params.error);
  const email = pickValue(params.email);

  return (
    <section className="surface-card w-full rounded-2xl p-6 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Account Recovery</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Forgot Password</h1>
        </div>
        <span className="badge">Secure Reset</span>
      </div>

      <p className="muted mt-3 text-sm">
        Enter your account email and we&apos;ll send a password reset link.
      </p>

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-[var(--danger-bg)] p-3 text-sm text-[var(--danger-fg)]">
          {decodeURIComponent(error)}
        </p>
      ) : null}

      <form action={requestPasswordResetAction} className="mt-5 space-y-4">
        <label className="block text-sm text-slate-700">
          Email
          <input
            name="email"
            type="email"
            required
            className="field mt-1 w-full rounded-md p-2.5"
            placeholder="doctor@demo-clinic.com"
            defaultValue={email ?? ""}
          />
        </label>

        <button type="submit" className="btn-primary w-full rounded-md px-4 py-2.5 text-sm font-semibold">
          Send Reset Link
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-600">
        Remember your password?{" "}
        <Link href="/auth/sign-in" className="font-medium text-slate-900 underline">
          Back to sign in
        </Link>
      </p>
    </section>
  );
}
