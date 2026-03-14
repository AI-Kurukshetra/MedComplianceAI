import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/date";
import { changePasswordAction, updateProfileAction } from "@/app/(protected)/profile/actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type ProfileRow = {
  full_name: string | null;
  role: string | null;
  created_at: string | null;
  updated_at: string | null;
  organizations: { name?: string } | { name?: string }[] | null;
};

function pickValue(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return null;
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const error = pickValue(params.error);
  const success = pickValue(params.success);

  const user = await requireUserContext();
  const supabase = await createClient();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, role, created_at, updated_at, organizations(name)")
    .eq("id", user.userId)
    .eq("organization_id", user.organizationId)
    .maybeSingle();

  const profile = (profileData ?? null) as ProfileRow | null;

  const organizationsData = profile?.organizations;
  const organizationName = Array.isArray(organizationsData)
    ? organizationsData[0]?.name
    : organizationsData?.name;

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {decodeURIComponent(error)}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {decodeURIComponent(success)}
        </p>
      ) : null}

      <section className="hero-card p-6">
        <p className="text-xs uppercase tracking-wide text-slate-500">Account</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">My Profile</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage your profile details and security settings.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <article className="surface-card p-5">
          <h2 className="text-lg font-bold text-slate-900">Profile Details</h2>

          <dl className="mt-4 space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <dt className="font-semibold text-slate-700">Email</dt>
              <dd className="break-all text-right">{user.email ?? "-"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="font-semibold text-slate-700">Role</dt>
              <dd>{profile?.role ?? user.role}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="font-semibold text-slate-700">Organization</dt>
              <dd>{organizationName ?? "Demo Clinic"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="font-semibold text-slate-700">Joined</dt>
              <dd>{formatDateTime(profile?.created_at)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="font-semibold text-slate-700">Last Update</dt>
              <dd>{formatDateTime(profile?.updated_at)}</dd>
            </div>
          </dl>

          <form action={updateProfileAction} className="mt-5 space-y-3">
            <label className="block text-sm text-slate-700">
              Full Name
              <input
                name="full_name"
                type="text"
                required
                className="field mt-1 w-full rounded-md p-2.5"
                defaultValue={profile?.full_name ?? user.fullName ?? ""}
              />
            </label>

            <button type="submit" className="btn-primary rounded-md px-4 py-2 text-sm font-semibold">
              Update Profile
            </button>
          </form>
        </article>

        <article className="surface-card p-5">
          <h2 className="text-lg font-bold text-slate-900">Change Password</h2>
          <p className="mt-2 text-sm text-slate-600">
            Update your password regularly to keep your account secure.
          </p>

          <form action={changePasswordAction} className="mt-4 space-y-3">
            <label className="block text-sm text-slate-700">
              New Password
              <input
                name="new_password"
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
                placeholder="Repeat new password"
              />
            </label>

            <button type="submit" className="btn-secondary rounded-md px-4 py-2 text-sm font-semibold">
              Change Password
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}
