import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { archiveAdminModuleAction } from "@/features/admin/actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type ModuleRow = {
  id: string;
  title: string;
  description: string;
  regulation: string;
  audience_role: string;
  estimated_minutes: number;
  content_url: string | null;
  content_markdown: string;
  is_active: boolean;
  updated_at: string;
};

function pickValue(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return null;
}

export default async function AdminModulesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUserContext();

  if (user.role !== "org_admin") {
    redirect("/dashboard?error=Only%20organization%20admins%20can%20manage%20content%20modules");
  }

  const params = await searchParams;
  const error = pickValue(params.error);
  const success = pickValue(params.success);

  const supabase = await createClient();
  const [modulesRes, assignmentsRes] = await Promise.all([
    supabase
      .from("training_modules")
      .select(
        "id, title, description, regulation, audience_role, estimated_minutes, content_url, content_markdown, is_active, updated_at",
      )
      .eq("organization_id", user.organizationId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("module_assignments")
      .select("module_id")
      .eq("organization_id", user.organizationId),
  ]);

  const modules = (modulesRes.data ?? []) as ModuleRow[];
  const assignmentCountByModule = new Map<string, number>();

  for (const assignment of assignmentsRes.data ?? []) {
    assignmentCountByModule.set(
      assignment.module_id,
      (assignmentCountByModule.get(assignment.module_id) ?? 0) + 1,
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {decodeURIComponent(error)}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {decodeURIComponent(success)}
        </p>
      ) : null}

      <section className="hero-card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Custom Content Creation Tools</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Organization Module Studio</h1>
            <p className="mt-2 text-sm text-slate-600">
              Create, edit, and publish organization-specific compliance content with media links and SOP text.
            </p>
          </div>
          <Link href="/admin/modules/new" className="btn-primary rounded-md px-4 py-2 text-sm font-semibold">
            Create Custom Module
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((moduleItem) => (
          <article key={moduleItem.id} className="surface-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900">{moduleItem.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {moduleItem.regulation} · {moduleItem.audience_role} · {moduleItem.estimated_minutes} min
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                  moduleItem.is_active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {moduleItem.is_active ? "Active" : "Archived"}
              </span>
            </div>

            <p className="mt-3 line-clamp-3 text-sm text-slate-600">{moduleItem.description}</p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="badge">{assignmentCountByModule.get(moduleItem.id) ?? 0} assignments</span>
              {moduleItem.content_url ? <span className="badge">Media linked</span> : null}
              {moduleItem.content_markdown?.trim() ? <span className="badge">Custom SOP text</span> : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/admin/modules/${moduleItem.id}`} className="btn-secondary rounded-md px-3 py-1.5 text-xs font-semibold">
                Edit Content
              </Link>
              {moduleItem.is_active ? (
                <form action={archiveAdminModuleAction}>
                  <input type="hidden" name="return_to" value="/admin/modules" />
                  <input type="hidden" name="module_id" value={moduleItem.id} />
                  <button type="submit" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100">
                    Archive
                  </button>
                </form>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
