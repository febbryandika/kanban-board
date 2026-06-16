"use client";

import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import type { BoardCardItem } from "@/types/board";

import { CardMenu } from "./card-menu";

function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Display-only card. The card detail modal arrives in a later phase. Memoized
 * so a card move only re-renders the moved card and its columns, not the board. */
function CardItemImpl({
  boardId,
  card,
}: {
  boardId: string;
  card: BoardCardItem;
}) {
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

      <div className="flex items-start justify-between gap-1">
        <p className="flex-1 font-medium leading-snug">{card.title}</p>
        <CardMenu boardId={boardId} cardId={card.id} />
      </div>

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

export const CardItem = memo(CardItemImpl);
