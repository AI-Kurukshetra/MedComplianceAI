import { redirect } from "next/navigation";
import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { isManagerRole } from "@/lib/constants/roles";
import { formatDate } from "@/lib/utils/date";

export default async function AdminPoliciesPage() {
  const user = await requireUserContext();

  if (!isManagerRole(user.role)) {
    redirect("/dashboard?error=Only%20managers%20can%20view%20policy%20library");
  }

  const supabase = await createClient();
  const { data: modules } = await supabase
    .from("training_modules")
    .select("id, title, regulation, updated_at, created_at")
    .eq("organization_id", user.organizationId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(100);

  const docs = modules ?? [];
  const categoryCount = {
    HIPAA: docs.filter((item) => item.regulation === "HIPAA").length,
    HITECH: docs.filter((item) => item.regulation === "HITECH").length,
    SOX: docs.filter((item) => item.regulation === "SOX").length,
    FDA: docs.filter((item) => item.regulation === "FDA").length,
  };

  return (
    <div className="space-y-6">
      <section className="hero-card p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Policy Library & Document Management</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Policy Library</h1>
        <p className="mt-2 text-sm text-slate-600">Access and manage regulation-linked policy records used across training and compliance workflows.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(categoryCount).map(([key, count]) => (
          <article key={key} className="kpi-tile">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{key}</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{count}</p>
            <p className="text-xs text-slate-500">documents</p>
          </article>
        ))}
      </section>

      <section className="surface-card overflow-hidden">
        <div className="responsive-table">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Document Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Last Updated</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{doc.title}</td>
                  <td className="px-4 py-3 text-slate-600">{doc.regulation}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(doc.updated_at ?? doc.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn-secondary rounded-md px-3 py-1.5 text-xs font-semibold">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
