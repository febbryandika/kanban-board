import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder shown while the board query is pending. Mirrors the real
 * board layout (muted columns with a header + a few cards) so the swap to live
 * data doesn't shift the layout. */
export function BoardSkeleton() {
  return (
    <div className="flex gap-4 p-4" aria-hidden>
      {[3, 2, 1].map((cardCount, col) => (
        <div
          key={col}
          className="flex w-72 shrink-0 flex-col gap-3 rounded-xl bg-muted/50 p-3"
        >
          <div className="flex items-center gap-2 px-1">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
          <div className="flex flex-col gap-2">
            {Array.from({ length: cardCount }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
