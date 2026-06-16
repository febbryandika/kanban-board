import { Badge } from "@/components/ui/badge";
import type { BoardCardItem } from "@/types/board";

function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Display-only card. The card detail modal arrives in a later phase. */
export function CardItem({ card }: { card: BoardCardItem }) {
  const hasFooter = Boolean(card.dueDate) || Boolean(card.assigneeId);

  return (
    <div className="rounded-md border bg-card p-3 text-sm shadow-sm">
      {card.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {card.labels.map((l) => (
            <span
              key={l.id}
              className="h-2 w-8 rounded-full"
              style={{ backgroundColor: l.color }}
              title={l.name}
            />
          ))}
        </div>
      )}

      <p className="font-medium leading-snug">{card.title}</p>

      {hasFooter && (
        <div className="mt-2 flex items-center justify-between">
          {card.dueDate ? (
            <Badge variant="secondary">{formatDueDate(card.dueDate)}</Badge>
          ) : (
            <span />
          )}
          {card.assigneeId && (
            <span className="h-6 w-6 rounded-full bg-muted" aria-label="Assignee" />
          )}
        </div>
      )}
    </div>
  );
}
