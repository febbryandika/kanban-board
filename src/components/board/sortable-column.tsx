"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { BoardColumnWithCards, BoardMemberInfo } from "@/types/board";

import { BoardColumn } from "./board-column";

/** Draggable wrapper around a column. Drag is initiated from the column header
 * (the `dragHandle` props), so clicking cards or the column menu doesn't drag. */
export function SortableColumn({
  boardId,
  column,
  members,
}: {
  boardId: string;
  column: BoardColumnWithCards;
  members?: BoardMemberInfo[];
}) {
  const {
    active,
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: column.id,
    data: { type: "column", columnId: column.id, sortOrder: column.sortOrder },
  });

  // True while a card is dragged over this column's empty/below-the-cards area
  // (when over a specific card, that card owns the `over` instead). Drives the
  // column-level drop highlight in BoardColumn.
  const isCardOver = isOver && active?.data.current?.type === "card";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={isDragging ? "opacity-40" : undefined}
    >
      <BoardColumn
        boardId={boardId}
        column={column}
        members={members}
        dragHandle={{ attributes, listeners }}
        isCardOver={isCardOver}
      />
    </div>
  );
}
