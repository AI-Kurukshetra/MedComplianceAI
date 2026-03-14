export default function ResetPasswordLoading() {
  return (
    <section className="surface-card w-full rounded-2xl p-6 md:p-8 space-y-5">
      <div className="space-y-2">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton h-9 w-52" />
      </div>
      <div className="skeleton h-4 w-3/4" />
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-10 w-full" />
        </div>
        <div className="space-y-1">
          <div className="skeleton h-4 w-28" />
          <div className="skeleton h-10 w-full" />
        </div>
      </div>
      <div className="skeleton h-10 w-full" />
    </section>
  );
}
