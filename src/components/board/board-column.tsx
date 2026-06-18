"use client";

import { memo, useRef, useState } from "react";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useRenameColumn } from "@/hooks/useColumnMutations";
import type { BoardColumnWithCards, BoardMemberInfo } from "@/types/board";

import { AddCardForm } from "./add-card-form";
import { CardItem } from "./card-item";
import { ColumnMenu } from "./column-menu";
import { SortableCard } from "./sortable-card";

export type ColumnDragHandle = {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
};

function BoardColumnImpl({
  boardId,
  column,
  members,
  dragHandle,
  isOverlay = false,
  isCardOver = false,
}: {
  boardId: string;
  column: BoardColumnWithCards;
  members?: BoardMemberInfo[];
  dragHandle?: ColumnDragHandle;
  isOverlay?: boolean;
  isCardOver?: boolean;
}) {
  const [isRenaming, setIsRenaming] = useState(false);

  return (
    <div
      className="flex w-[85vw] max-w-[18rem] shrink-0 flex-col gap-3 rounded-xl bg-muted/50 p-3 sm:w-72"
      data-testid="board-column"
      data-column-name={column.name}
    >
      <div className="flex items-center justify-between gap-1 px-1">
        {isRenaming ? (
          <RenameColumnInput
            boardId={boardId}
            columnId={column.id}
            currentName={column.name}
            onDone={() => setIsRenaming(false)}
          />
        ) : (
          <>
            <div
              className="flex flex-1 items-center gap-2 touch-none select-none [cursor:grab] active:[cursor:grabbing]"
              {...dragHandle?.attributes}
              {...dragHandle?.listeners}
              aria-label={`Reorder column ${column.name}`}
            >
              <h2 className="truncate text-sm font-semibold">{column.name}</h2>
              <Badge variant="secondary">{column.cards.length}</Badge>
            </div>
            <ColumnMenu
              boardId={boardId}
              columnId={column.id}
              columnName={column.name}
              onRename={() => setIsRenaming(true)}
            />
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {column.cards.length === 0 ? (
          <p
            className={`rounded-md border border-dashed py-6 text-center text-xs ${
              isCardOver
                ? "border-primary bg-primary/5 text-foreground"
                : "text-muted-foreground"
            }`}
          >
            No cards yet
          </p>
        ) : isOverlay ? (
          column.cards.map((card) => (
            <CardItem
              key={card.id}
              boardId={boardId}
              card={card}
              members={members}
            />
          ))
        ) : (
          <SortableContext
            items={column.cards.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {column.cards.map((card) => (
              <SortableCard
                key={card.id}
                boardId={boardId}
                card={card}
                members={members}
              />
            ))}
          </SortableContext>
        )}
        {/* Append guide when a card hovers the column's empty area below the cards. */}
        {!isOverlay && isCardOver && column.cards.length > 0 && (
          <span
            aria-hidden
            className="pointer-events-none h-0.5 rounded-full bg-primary"
          />
        )}
      </div>

      <AddCardForm boardId={boardId} columnId={column.id} />
    </div>
  );
}

export const BoardColumn = memo(BoardColumnImpl);

/** Inline rename input shown in the column header. Commits once on Enter or
 * blur; Escape cancels without saving (the guard ref prevents the unmount-blur
 * from double-committing). */
function RenameColumnInput({
  boardId,
  columnId,
  currentName,
  onDone,
}: {
  boardId: string;
  columnId: string;
  currentName: string;
  onDone: () => void;
}) {
  const [value, setValue] = useState(currentName);
  const renameColumn = useRenameColumn(boardId);
  const settled = useRef(false);

  function commit() {
    if (settled.current) return;
    settled.current = true;
    const name = value.trim();
    if (name && name !== currentName) {
      renameColumn.mutate({ columnId, name });
    }
    onDone();
  }

  function cancel() {
    settled.current = true; // stop the unmount blur from committing
    onDone();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        commit();
      }}
      className="flex-1"
    >
      <Input
        autoFocus
        value={value}
        maxLength={40}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") cancel();
        }}
        className="h-7 text-sm"
        aria-label="Column name"
      />
    </form>
  );
}
