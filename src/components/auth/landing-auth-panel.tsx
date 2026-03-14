import Link from "next/link";
import { resendConfirmationAction, signInAction, signUpAction } from "@/app/auth/actions";

export type LandingAuthMode = "sign-in" | "sign-up";

type LandingAuthPanelProps = {
  mode: LandingAuthMode;
  error: string | null;
  notice: string | null;
  email: string | null;
  tenantMode: "create" | "join";
  organizationName: string | null;
  organizationSlug: string | null;
};

function tabClass(active: boolean): string {
  if (active) {
    return "flex-1 rounded-lg bg-white px-3 py-2.5 text-sm font-bold text-primary shadow-sm";
  }
  return "flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-800";
}

export function LandingAuthPanel({
  mode,
  error,
  notice,
  email,
  tenantMode,
  organizationName,
  organizationSlug,
}: LandingAuthPanelProps) {
  const signIn = mode !== "sign-up";

  return (
    <aside className="surface-card relative overflow-hidden rounded-3xl border-slate-200/80 p-6 shadow-xl shadow-slate-900/5 md:p-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/8 to-transparent" />

      <div className="relative">
        <div className="mb-5 flex rounded-xl bg-slate-100 p-1">
          <Link href="/?mode=sign-in" className={tabClass(signIn)} prefetch={false}>
            Login
          </Link>
          <Link href="/?mode=sign-up" className={tabClass(!signIn)} prefetch={false}>
            Sign Up
          </Link>
        </div>

        {error ? (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {decodeURIComponent(error)}
          </p>
        ) : null}

        {notice ? (
          <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {decodeURIComponent(notice)}
          </p>
        ) : null}

        {signIn ? (
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-black tracking-tight text-slate-900">Welcome back</p>
              <p className="mt-1 text-sm text-slate-500">
                Access your training, certifications, and compliance reports.
              </p>
            </div>

            <form action={signInAction} className="space-y-3">
              <input type="hidden" name="return_to" value="/" />
              <input type="hidden" name="auth_mode" value="sign-in" />
              <label className="block text-sm font-semibold text-slate-700">
                Work Email
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={email ?? ""}
                  placeholder="you@hospital.org"
                  className="field mt-1 w-full rounded-lg px-3 py-2.5 text-sm"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Password
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Enter password"
                  className="field mt-1 w-full rounded-lg px-3 py-2.5 text-sm"
                />
              </label>

              <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" className="size-4 rounded border-slate-300 text-primary" />
                  Remember me
                </label>
                <Link href="/auth/forgot-password" className="font-semibold text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="btn-primary w-full rounded-lg px-4 py-3 text-sm font-bold">
                Continue To Dashboard
              </button>
            </form>

            <form action={resendConfirmationAction} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <input type="hidden" name="return_to" value="/" />
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Need a new confirmation link?
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={email ?? ""}
                  className="field w-full rounded-lg px-3 py-2 text-sm"
                  placeholder="you@hospital.org"
                />
                <button type="submit" className="btn-secondary rounded-lg px-3 py-2 text-xs font-bold">
                  Resend
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-black tracking-tight text-slate-900">Create your account</p>
              <p className="mt-1 text-sm text-slate-500">
                Register and start role-based compliance training immediately.
              </p>
            </div>

            <form action={signUpAction} className="space-y-3">
              <input type="hidden" name="return_to" value="/" />
              <input type="hidden" name="auth_mode" value="sign-up" />

              <label className="block text-sm font-semibold text-slate-700">
                Full Name
                <input
                  type="text"
                  name="full_name"
                  required
                  placeholder="Alex Johnson"
                  className="field mt-1 w-full rounded-lg px-3 py-2.5 text-sm"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Work Email
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={email ?? ""}
                  placeholder="you@hospital.org"
                  className="field mt-1 w-full rounded-lg px-3 py-2.5 text-sm"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Workspace Access
                <select
                  name="tenant_mode"
                  defaultValue={tenantMode}
                  className="field mt-1 w-full rounded-lg px-3 py-2.5 text-sm"
                >
                  <option value="create">Create New Organization</option>
                  <option value="join">Join Existing Organization</option>
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Organization Name
                <input
                  type="text"
                  name="organization_name"
                  defaultValue={organizationName ?? ""}
                  placeholder="North Valley Medical Center"
                  className="field mt-1 w-full rounded-lg px-3 py-2.5 text-sm"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Organization Slug
                <input
                  type="text"
                  name="organization_slug"
                  defaultValue={organizationSlug ?? ""}
                  placeholder="north-valley-medical"
                  className="field mt-1 w-full rounded-lg px-3 py-2.5 text-sm"
                />
              </label>
              <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Create uses organization name and optional slug. Join requires an existing organization slug.
              </p>

              <label className="block text-sm font-semibold text-slate-700">
                Password
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  className="field mt-1 w-full rounded-lg px-3 py-2.5 text-sm"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Confirm Password
                <input
                  type="password"
                  name="confirm_password"
                  required
                  minLength={8}
                  placeholder="Repeat your password"
                  className="field mt-1 w-full rounded-lg px-3 py-2.5 text-sm"
                />
              </label>

              <button type="submit" className="btn-primary w-full rounded-lg px-4 py-3 text-sm font-bold">
                Create Account
              </button>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
}
