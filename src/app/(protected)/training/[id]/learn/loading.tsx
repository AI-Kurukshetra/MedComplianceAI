export default function TrainingLearnLoading() {
  return (
    <div className="space-y-4">
      <div className="surface-card overflow-hidden">
        <div className="skeleton aspect-video w-full" />
        <div className="p-5 space-y-2">
          <div className="skeleton h-6 w-1/2" />
          <div className="skeleton h-4 w-full" />
        </div>
      </div>
    </div>
  );
}
