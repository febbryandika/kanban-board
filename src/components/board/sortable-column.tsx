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
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: "column", columnId: column.id, sortOrder: column.sortOrder },
  });

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
      />
    </div>
  );
}
