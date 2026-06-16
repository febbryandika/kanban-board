/** Loading placeholder shown while the board query is pending. */
export function BoardSkeleton() {
  return (
    <div className="flex gap-4 p-6" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex w-72 shrink-0 flex-col gap-3">
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          <div className="h-20 animate-pulse rounded-md bg-muted" />
          <div className="h-20 animate-pulse rounded-md bg-muted" />
        </div>
      ))}
    </div>
  );
}
