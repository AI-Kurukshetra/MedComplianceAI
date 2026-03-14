import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserContext } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/date";

export default async function CertificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUserContext();
  const supabase = await createClient();

  const { data: cert } = await supabase
    .from("certifications")
    .select("id, certificate_no, issued_at, expires_at, training_modules(title, regulation)")
    .eq("organization_id", user.organizationId)
    .eq("user_id", user.userId)
    .eq("id", id)
    .maybeSingle();

  if (!cert) notFound();

  const title = cert.training_modules?.[0]?.title ?? "Compliance Certification";
  const regulation = cert.training_modules?.[0]?.regulation ?? "HIPAA";

  return (
    <div className="space-y-6">
      <section className="hero-card p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Certificate Detail</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">Regulation: {regulation}</p>
      </section>

      <section className="surface-card p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Certificate Number</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{cert.certificate_no}</dd>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Issued</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(cert.issued_at)}</dd>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Expires</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{formatDateTime(cert.expires_at)}</dd>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">Verification</dt>
            <dd className="mt-1 text-sm font-semibold text-emerald-600">Verified</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={`/api/certifications/${cert.id}/download`} className="btn-primary rounded-md px-4 py-2 text-sm font-semibold">
            Download PDF
          </Link>
          <Link href="/certifications" className="btn-secondary rounded-md px-4 py-2 text-sm font-semibold">
            Back
          </Link>
        </div>
      </section>
    </div>
  );
}
