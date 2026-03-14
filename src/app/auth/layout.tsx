import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen w-full px-4 py-8 md:px-8 xl:px-14 2xl:px-20">
      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        <article className="hero-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Secure Access</p>
            <Link href="/" className="btn-secondary rounded-md px-3 py-1.5 text-xs font-semibold">
              Back Home
            </Link>
          </div>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Compliance Portal</h1>
          <p className="mt-3 max-w-xl text-sm text-slate-600">
            Sign in to access your role-based workspace for training, certifications, notifications, and audit-ready records.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <article className="kpi-tile">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Step 1</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Authenticate</p>
            </article>
            <article className="kpi-tile">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Step 2</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Load Profile</p>
            </article>
            <article className="kpi-tile">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Step 3</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Enter Dashboard</p>
            </article>
          </div>
        </article>

        <aside className="flex items-start">{children}</aside>
      </section>
    </main>
  );
}
