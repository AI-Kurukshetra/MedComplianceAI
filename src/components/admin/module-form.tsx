import { REGULATIONS } from "@/lib/constants/regulations";
import { ROLES } from "@/lib/constants/roles";

type AudienceRole = "all" | (typeof ROLES)[number];

type ModuleSeed = {
  id?: string;
  title?: string;
  description?: string;
  contentMarkdown?: string;
  regulation?: (typeof REGULATIONS)[number];
  audienceRole?: AudienceRole;
  estimatedMinutes?: number;
  contentUrl?: string | null;
  isActive?: boolean;
};

type ModuleFormProps = {
  mode: "create" | "edit";
  action: (formData: FormData) => void | Promise<void>;
  returnTo: string;
  module?: ModuleSeed;
  submitLabel?: string;
};

export function ModuleForm({
  mode,
  action,
  returnTo,
  module,
  submitLabel,
}: ModuleFormProps) {
  const actionLabel = submitLabel ?? (mode === "create" ? "Create Module" : "Save Changes");
  const roleOptions: AudienceRole[] = ["all", ...ROLES];

  return (
    <form action={action} className="surface-card space-y-4 p-5">
      <input type="hidden" name="return_to" value={returnTo} />
      {module?.id ? <input type="hidden" name="module_id" value={module.id} /> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Module Title
          <input
            type="text"
            name="title"
            required
            minLength={3}
            maxLength={200}
            defaultValue={module?.title ?? ""}
            className="field mt-1 w-full rounded-lg px-3 py-2.5 text-sm"
            placeholder="HIPAA Workforce Security Essentials"
          />
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Regulation
          <select
            name="regulation"
            required
            defaultValue={module?.regulation ?? "HIPAA"}
            className="field mt-1 w-full rounded-lg px-3 py-2.5 text-sm"
          >
            {REGULATIONS.map((regulation) => (
              <option key={regulation} value={regulation}>
                {regulation}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block text-sm font-semibold text-slate-700">
          Audience Role
          <select
            name="audience_role"
            required
            defaultValue={module?.audienceRole ?? "all"}
            className="field mt-1 w-full rounded-lg px-3 py-2.5 text-sm"
          >
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Estimated Minutes
          <input
            type="number"
            name="estimated_minutes"
            required
            min={1}
            max={600}
            defaultValue={module?.estimatedMinutes ?? 30}
            className="field mt-1 w-full rounded-lg px-3 py-2.5 text-sm"
          />
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Active
          <select
            name="is_active"
            defaultValue={module?.isActive === false ? "false" : "true"}
            className="field mt-1 w-full rounded-lg px-3 py-2.5 text-sm"
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
      </div>

      <label className="block text-sm font-semibold text-slate-700">
        Module Summary
        <textarea
          name="description"
          required
          minLength={10}
          maxLength={4000}
          defaultValue={module?.description ?? ""}
          className="field mt-1 min-h-28 w-full rounded-lg px-3 py-2.5 text-sm"
          placeholder="Describe objectives, compliance outcomes, and learner expectations."
        />
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        Content Asset URL
        <input
          type="url"
          name="content_url"
          defaultValue={module?.contentUrl ?? ""}
          className="field mt-1 w-full rounded-lg px-3 py-2.5 text-sm"
          placeholder="https://cdn.your-org.com/training/hipaa-security.mp4"
        />
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        Custom Content (Markdown / SOP Text)
        <textarea
          name="content_markdown"
          defaultValue={module?.contentMarkdown ?? ""}
          maxLength={20000}
          className="field mt-1 min-h-48 w-full rounded-lg px-3 py-2.5 font-mono text-sm"
          placeholder="# Lesson Outline\n\n- Policy references\n- Incident handling procedure\n- Mandatory do/don't checklist"
        />
      </label>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Organizations can upload content to a secure CDN or storage bucket and paste the URL above, while storing
        editable policy text directly in the custom content field.
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-primary rounded-md px-4 py-2 text-sm font-semibold">
          {actionLabel}
        </button>
      </div>
    </form>
  );
}
