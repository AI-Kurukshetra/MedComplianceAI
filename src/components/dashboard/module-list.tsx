import { createClient } from "@/lib/supabase/server";

type TrainingModule = {
  id: string;
  title: string;
  regulation: string;
  audience_role: string;
};

export default async function ModuleList() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_modules")
    .select("id, title, regulation, audience_role")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    return (
      <section className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
        Supabase error: {error.message}
      </section>
    );
  }

  const modules = (data ?? []) as TrainingModule[];

  if (!modules.length) {
    return (
      <section className="rounded-lg border p-4 text-sm text-zinc-600">
        No modules found. Run <code>db/seed.sql</code> in Supabase SQL Editor.
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4">
      <h2 className="mb-3 text-lg font-semibold">Compliance Modules</h2>
      <ul className="space-y-2">
        {modules.map((module) => (
          <li
            key={module.id}
            className="flex items-center justify-between rounded border border-zinc-200 p-3"
          >
            <div>
              <p className="font-medium">{module.title}</p>
              <p className="text-xs text-zinc-500">
                {module.regulation} · Role: {module.audience_role}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
