import { notFound, redirect } from "next/navigation";
import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { isManagerRole } from "@/lib/constants/roles";
import { formatDate } from "@/lib/utils/date";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUserContext();

  if (!isManagerRole(user.role)) {
    redirect("/dashboard?error=Only%20managers%20can%20view%20staff%20records");
  }

  const supabase = await createClient();
  const [{ data: profile }, { data: assignments }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .eq("organization_id", user.organizationId)
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("module_assignments")
      .select("id, status, due_date, training_modules(title, regulation)")
      .eq("organization_id", user.organizationId)
      .eq("user_id", id)
      .order("assigned_at", { ascending: false })
      .limit(50),
  ]);

  if (!profile) notFound();

  return (
    <div className="space-y-6">
      <section className="hero-card p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Staff Profile</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{profile.full_name || "Unknown User"}</h1>
        <p className="mt-2 break-all text-sm text-slate-600">{profile.email || "-"} · {profile.role}</p>
      </section>

      <section className="surface-card p-5">
        <h2 className="text-lg font-bold text-slate-900">Assigned Modules</h2>
        <ul className="mt-3 space-y-2">
          {(assignments ?? []).map((item) => (
            <li key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-sm font-semibold text-slate-900">{item.training_modules?.[0]?.title ?? "Untitled module"}</p>
              <p className="mt-1 text-xs text-slate-500">
                {item.training_modules?.[0]?.regulation ?? "HIPAA"} · {item.status} · Due {formatDate(item.due_date)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
