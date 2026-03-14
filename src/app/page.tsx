import Link from "next/link";
import { getUserContext } from "@/lib/auth/user";
import { LandingAuthPanel, type LandingAuthMode } from "@/components/auth/landing-auth-panel";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pickValue(value: string | string[] | undefined): string | null {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return null;
}

const platformItems = [
  {
    title: "Adaptive Training Paths",
    description: "Role-aware modules that auto-prioritize risk-heavy topics for each staff member.",
    icon: "school",
  },
  {
    title: "Live Compliance Scoring",
    description: "Always-on dashboards for completion, pass rate, and deadline risk across your organization.",
    icon: "monitoring",
  },
  {
    title: "Evidence-Ready Audits",
    description: "Centralized logs and certificate records ready for internal and external inspections.",
    icon: "history",
  },
];

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getUserContext();
  const params = await searchParams;
  const mode = pickValue(params.mode) === "sign-up" ? "sign-up" : "sign-in";
  const error = pickValue(params.error);
  const notice = pickValue(params.notice);
  const email = pickValue(params.email);
  const tenantModeParam = pickValue(params.tenant_mode);
  const tenantMode = tenantModeParam === "join" ? "join" : "create";
  const organizationName = pickValue(params.organization_name);
  const organizationSlug = pickValue(params.organization_slug);
  const authMode = mode as LandingAuthMode;

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-slate-50">
      <section className="relative isolate border-b border-slate-200/70 bg-white">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_10%,rgba(17,82,212,0.22),transparent_35%),radial-gradient(circle_at_88%_18%,rgba(8,145,178,0.18),transparent_34%),linear-gradient(180deg,#f8fbff_0%,#eef5ff_45%,#ffffff_100%)]" />

        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/75 backdrop-blur">
          <div className="flex h-16 w-full items-center justify-between px-4 md:px-8 xl:px-14 2xl:px-20">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-2xl">shield</span>
              <span className="text-lg font-black tracking-tight text-slate-900">MedCompliance AI</span>
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <Link href="/dashboard" className="btn-primary rounded-lg px-4 py-2 text-sm font-bold">
                  Open Dashboard
                </Link>
              ) : (
                <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Secure Access
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="grid min-h-[calc(100vh-4rem)] w-full items-center gap-10 px-4 py-10 md:px-8 lg:grid-cols-[1.08fr_0.92fr] xl:px-14 2xl:px-20">
          <article className="reveal space-y-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              HIPAA-Centered Compliance Platform
            </span>

            <div>
              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-slate-900 md:text-6xl xl:text-7xl">
                Compliance That Feels Clear, Fast, And Audit-Ready
              </h1>
              <p className="mt-4 max-w-3xl text-base text-slate-600 md:text-lg">
                Replace fragmented spreadsheets and reminder chains with one intelligent workflow for HIPAA, HITECH,
                SOX, and FDA compliance training.
              </p>
            </div>

            {user ? (
              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard" className="btn-primary rounded-xl px-6 py-3 text-sm font-bold">
                  Go To Workspace
                </Link>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-3">
              {platformItems.map((item) => (
                <article
                  key={item.title}
                  className="group rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                >
                  <div className="mb-2 inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </article>

          <div className="reveal" style={{ animationDelay: "120ms" }}>
            {user ? (
              <aside className="surface-card rounded-3xl p-8 shadow-xl shadow-slate-900/10">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Session</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">You are signed in</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Continue to your workspace to manage training, certifications, alerts, and analytics.
                </p>
                <Link href="/dashboard" className="btn-primary mt-6 inline-flex rounded-lg px-5 py-3 text-sm font-bold">
                  Continue To Dashboard
                </Link>
              </aside>
            ) : (
              <LandingAuthPanel
                mode={authMode}
                error={error}
                notice={notice}
                email={email}
                tenantMode={tenantMode}
                organizationName={organizationName}
                organizationSlug={organizationSlug}
              />
            )}
          </div>
        </div>
      </section>

      <section className="w-full px-4 py-12 md:px-8 xl:px-14 2xl:px-20">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="surface-card group p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Admin Dashboard</p>
            <p className="mt-2 text-sm text-slate-700">Organization KPI, compliance score, and risk alerts.</p>
          </article>
          <article className="surface-card group p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Training Portal</p>
            <p className="mt-2 text-sm text-slate-700">Module catalog, learning player, and assessment flow.</p>
          </article>
          <article className="surface-card group p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Certifications</p>
            <p className="mt-2 text-sm text-slate-700">Credential vault with expiry monitoring and downloads.</p>
          </article>
          <article className="surface-card group p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Audit Trail</p>
            <p className="mt-2 text-sm text-slate-700">Secure event history for compliance evidence collection.</p>
          </article>
        </div>
      </section>

      <section className="w-full bg-slate-900 px-4 py-12 md:px-8 xl:px-14 2xl:px-20">
        <div className="grid gap-5 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">Platform Velocity</p>
            <p className="mt-2 text-3xl font-black text-white">4x</p>
            <p className="mt-1 text-sm text-slate-300">Faster assignment and completion tracking than manual workflows.</p>
          </article>
          <article className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Audit Confidence</p>
            <p className="mt-2 text-3xl font-black text-white">99.9%</p>
            <p className="mt-1 text-sm text-slate-300">Training and log evidence available in one export-ready stream.</p>
          </article>
          <article className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">Risk Visibility</p>
            <p className="mt-2 text-3xl font-black text-white">Real-time</p>
            <p className="mt-1 text-sm text-slate-300">Identify overdue, low-score, and policy-risk cohorts instantly.</p>
          </article>
        </div>
      </section>

      <footer className="border-t border-slate-800 bg-[#0b1222] text-slate-200">
        <div className="grid w-full gap-8 px-4 py-12 md:grid-cols-2 md:px-8 lg:grid-cols-4 xl:px-14 2xl:px-20">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-cyan-300">
              <span className="material-symbols-outlined text-2xl">shield</span>
              <span className="text-lg font-black tracking-tight text-white">MedCompliance AI</span>
            </div>
            <p className="text-sm text-slate-300">
              Healthcare cybersecurity and compliance training platform for HIPAA, HITECH, SOX, and FDA readiness.
            </p>
            <p className="text-xs text-slate-400">Bacancy Technology</p>
          </section>

          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Platform</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="text-slate-200 hover:text-cyan-300">Dashboard</Link>
              </li>
              <li>
                <Link href="/training" className="text-slate-200 hover:text-cyan-300">Training</Link>
              </li>
              <li>
                <Link href="/certifications" className="text-slate-200 hover:text-cyan-300">Certifications</Link>
              </li>
              <li>
                <Link href="/notifications" className="text-slate-200 hover:text-cyan-300">Notifications</Link>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Resources</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/dashboard/compliance" className="text-slate-200 hover:text-cyan-300">Compliance Analytics</Link>
              </li>
              <li>
                <Link href="/admin/audit" className="text-slate-200 hover:text-cyan-300">Audit Trail</Link>
              </li>
              <li>
                <Link href="/admin/policies" className="text-slate-200 hover:text-cyan-300">Policy Library</Link>
              </li>
              <li>
                <Link href="/api/health" className="text-slate-200 hover:text-cyan-300">System Health</Link>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Company</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/bacancy/medcompliance-ai"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-200 hover:text-cyan-300"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a href="https://www.bacancytechnology.com/" target="_blank" rel="noreferrer" className="text-slate-200 hover:text-cyan-300">
                  About Bacancy
                </a>
              </li>
              <li>
                <a href="mailto:compliance@bacancy.com" className="text-slate-200 hover:text-cyan-300">Contact Support</a>
              </li>
              <li>
                <Link href="/?mode=sign-in" className="text-slate-200 hover:text-cyan-300" prefetch={false}>Secure Sign In</Link>
              </li>
            </ul>
          </section>
        </div>

        <div className="border-t border-slate-800">
          <div className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-slate-400 md:px-8 xl:px-14 2xl:px-20">
            <p>© 2026 MedCompliance AI. All rights reserved.</p>
            <p>Built for healthcare compliance operations.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
