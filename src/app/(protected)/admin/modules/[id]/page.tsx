import { notFound, redirect } from "next/navigation";
import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { ModuleForm } from "@/components/admin/module-form";
import { updateAdminModuleAction } from "@/features/admin/actions";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pickValue(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return null;
}

export default async function AdminModuleEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const user = await requireUserContext();

  if (user.role !== "org_admin") {
    redirect("/dashboard?error=Only%20organization%20admins%20can%20edit%20custom%20modules");
  }

  const query = await searchParams;
  const error = pickValue(query.error);
  const success = pickValue(query.success);

  const supabase = await createClient();
  const { data: moduleItem } = await supabase
    .from("training_modules")
    .select(
      "id, title, description, content_markdown, regulation, audience_role, estimated_minutes, content_url, is_active",
    )
    .eq("organization_id", user.organizationId)
    .eq("id", id)
    .maybeSingle();

  if (!moduleItem) {
    notFound();
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
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Custom Content Creation Tools</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Edit Module Content</h1>
        <p className="mt-2 text-sm text-slate-600">{moduleItem.title}</p>
      </section>

      <ModuleForm
        mode="edit"
        action={updateAdminModuleAction}
        returnTo={`/admin/modules/${moduleItem.id}`}
        module={{
          id: moduleItem.id,
          title: moduleItem.title,
          description: moduleItem.description,
          contentMarkdown: moduleItem.content_markdown,
          regulation: moduleItem.regulation,
          audienceRole: moduleItem.audience_role,
          estimatedMinutes: moduleItem.estimated_minutes,
          contentUrl: moduleItem.content_url,
          isActive: moduleItem.is_active,
        }}
      />
    </div>
  );
}
