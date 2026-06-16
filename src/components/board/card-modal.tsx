"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useBoard } from "@/hooks/useBoard";
import { useUpdateCard } from "@/hooks/useUpdateCard";
import { useUiStore } from "@/stores/ui";
import type { BoardCardItem, BoardDetail } from "@/types/board";

import { CardAssignee } from "./card-assignee";
import { CardComments } from "./card-comments";
import { CardDescription } from "./card-description";
import { CardDueDate } from "./card-due-date";
import { CardLabels } from "./card-labels";

/** The card detail modal. Mounted once on the board; it reads the active card id
 * from the UI store and pulls the card from the shared `['board', boardId]` cache,
 * so optimistic field edits show instantly and there's a single source of truth. */
export function CardModal({ boardId }: { boardId: string }) {
  const activeCardId = useUiStore((s) => s.activeCardId);
  const closeCard = useUiStore((s) => s.closeCard);
  const { data } = useBoard(boardId);

  const card =
    activeCardId && data
      ? (data.columns
          .flatMap((c) => c.cards)
          .find((c) => c.id === activeCardId) ?? null)
      : null;

  // If the active card vanished (archived/deleted by a refetch), close the modal.
  useEffect(() => {
    if (activeCardId && data && !card) closeCard();
  }, [activeCardId, data, card, closeCard]);

  return (
    <Dialog
      open={Boolean(card)}
      onOpenChange={(open) => {
        if (!open) closeCard();
      }}
    >
      {card && data && (
        <CardModalContent boardId={boardId} card={card} board={data} />
      )}
    </Dialog>
  );
}

function CardModalContent({
  boardId,
  card,
  board,
}: {
  boardId: string;
  card: BoardCardItem;
  board: BoardDetail;
}) {
  const currentMember = board.members.find(
    (m) => m.userId === board.currentUserId,
  );
  const currentUser = {
    userId: board.currentUserId,
    name: currentMember?.name ?? "You",
  };
  const column = board.columns.find((c) => c.id === card.columnId);

  return (
    <DialogContent className="flex max-h-[85vh] flex-col overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle render={<div />} className="pr-8">
          <CardTitleEditor boardId={boardId} cardId={card.id} title={card.title} />
        </DialogTitle>
        {column && (
          <p className="text-xs text-muted-foreground">in {column.name}</p>
        )}
        <DialogDescription className="sr-only">
          Edit this card&apos;s labels, due date, assignee, description, and
          comments.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
        <div className="order-1 flex flex-col gap-4">
          <CardLabels
            boardId={boardId}
            cardId={card.id}
            cardLabels={card.labels}
            boardLabels={board.labels}
          />
          <CardDueDate
            boardId={boardId}
            cardId={card.id}
            dueDate={card.dueDate}
          />
          <CardAssignee
            boardId={boardId}
            cardId={card.id}
            assigneeId={card.assigneeId}
            members={board.members}
          />
        </div>

        <div className="order-2 flex flex-col gap-5">
          <CardDescription
            boardId={boardId}
            cardId={card.id}
            description={card.description}
          />
          <CardComments
            cardId={card.id}
            currentUser={currentUser}
            canModerate={board.role === "owner"}
          />
        </div>
      </div>
    </DialogContent>
  );
}

function CardTitleEditor({
  boardId,
  cardId,
  title,
}: {
  boardId: string;
  cardId: string;
  title: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const updateCard = useUpdateCard(boardId);

  function startEdit() {
    setValue(title);
    setEditing(true);
  }

  function commit() {
    const next = value.trim();
    if (next && next !== title) {
      updateCard.mutate({ cardId, title: next });
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <Input
        autoFocus
        value={value}
        maxLength={200}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            setEditing(false);
          }
        }}
        className="h-8 text-base font-medium"
        aria-label="Card title"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className="-mx-1 rounded px-1 text-left text-base font-medium hover:bg-muted"
    >
      {title}
    </button>
  );
}
