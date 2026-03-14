export default function SignInLoading() {
  return (
    <section className="surface-card w-full rounded-2xl p-6 md:p-8 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-9 w-32" />
        </div>
        <div className="skeleton h-6 w-24 rounded-full" />
      </div>
      <div className="skeleton h-4 w-3/4" />
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="skeleton h-4 w-16" />
          <div className="skeleton h-10 w-full rounded-md" />
        </div>
        <div className="space-y-1">
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-10 w-full rounded-md" />
        </div>
        <div className="skeleton h-10 w-full rounded-md" />
      </div>
    </section>
  );
}
