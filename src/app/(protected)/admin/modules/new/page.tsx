import { redirect } from "next/navigation";
import { requireUserContext } from "@/lib/auth/user";
import { ModuleForm } from "@/components/admin/module-form";
import { createAdminModuleAction } from "@/features/admin/actions";

export default async function AdminModuleCreatePage() {
  const user = await requireUserContext();

  if (user.role !== "org_admin") {
    redirect("/dashboard?error=Only%20organization%20admins%20can%20create%20custom%20modules");
  }

  return (
    <div className="space-y-6">
      <section className="hero-card p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Custom Content Creation Tools</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Create Training Module</h1>
        <p className="mt-2 text-sm text-slate-600">
          Build organization-owned training with policy text, media links, and role-targeted publishing.
        </p>
      </section>

      <ModuleForm mode="create" action={createAdminModuleAction} returnTo="/admin/modules/new" />
    </div>
  );
}
