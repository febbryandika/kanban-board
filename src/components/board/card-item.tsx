"use client";

import { memo } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useUiStore } from "@/stores/ui";
import { getInitials } from "@/lib/utils";
import type { BoardCardItem, BoardMemberInfo } from "@/types/board";

import { CardMenu } from "./card-menu";

function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Card preview. Clicking opens the detail modal (via the UI store). Memoized so
 * a card move only re-renders the moved card and its columns, not the board. */
function CardItemImpl({
  boardId,
  card,
  members,
}: {
  boardId: string;
  card: BoardCardItem;
  members?: BoardMemberInfo[];
}) {
  const openCard = useUiStore((s) => s.openCard);
  const assignee = card.assigneeId
    ? (members?.find((m) => m.userId === card.assigneeId) ?? null)
    : null;
  const hasFooter = Boolean(card.dueDate) || Boolean(card.assigneeId);
  // Optimistically-created cards carry a temp id until the server reconciles;
  // dim them and suppress interactions (open/menu) that need the real id.
  const isPending = card.id.startsWith("temp-");

  return (
    <div
      className={`rounded-md border bg-card p-3 text-sm shadow-sm ${
        isPending ? "opacity-70" : "cursor-pointer hover:border-foreground/20"
      }`}
      onClick={isPending ? undefined : () => openCard(card.id)}
      aria-busy={isPending || undefined}
    >
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
        {/* Stop the menu from also opening the modal. Hidden while pending. */}
        {!isPending && (
          <div onClick={(e) => e.stopPropagation()}>
            <CardMenu boardId={boardId} cardId={card.id} />
          </div>
        )}
      </div>

      {hasFooter && (
        <div className="mt-2 flex items-center justify-between">
          {card.dueDate ? (
            <Badge variant="secondary">{formatDueDate(card.dueDate)}</Badge>
          ) : (
            <span />
          )}
          {card.assigneeId &&
            (assignee ? (
              <Avatar size="sm">
                <AvatarImage src={assignee.image ?? undefined} alt={assignee.name} />
                <AvatarFallback>{getInitials(assignee.name)}</AvatarFallback>
              </Avatar>
            ) : (
              <span
                className="size-6 rounded-full bg-muted"
                aria-label="Assignee"
              />
            ))}
        </div>
      )}
    </div>
  );
}

export const CardItem = memo(CardItemImpl);
