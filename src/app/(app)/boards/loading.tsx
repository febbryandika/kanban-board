import { Skeleton } from "@/components/ui/skeleton";

/** Route-level fallback shown while the board list (a Server Component) fetches,
 * so navigating to /boards shows structure instead of a blank flash. Mirrors the
 * real page layout in boards/page.tsx. */
export default function BoardsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6" aria-hidden>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-20" />
        </div>
      </header>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="flex flex-col gap-4 rounded-xl border border-l-4 p-6"
          >
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-16" />
          </li>
        ))}
      </ul>
    </main>
  );
}
