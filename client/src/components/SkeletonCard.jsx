export default function SkeletonCard() {
  return (
    <div className="card animate-pulse overflow-hidden" aria-hidden="true">
      <div className="h-44 bg-neutral-200" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-24 rounded-full bg-neutral-200" />
        <div className="h-5 w-3/4 rounded bg-neutral-200" />
        <div className="h-3 w-full rounded bg-neutral-100" />
        <div className="h-3 w-5/6 rounded bg-neutral-100" />
      </div>
    </div>
  );
}
