"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { BoardCardItem, BoardMemberInfo } from "@/types/board";

import { CardItem } from "./card-item";

/** Draggable wrapper around a card. The dragged item is hidden (it's rendered in
 * the DndContext's DragOverlay instead) to avoid clipping by the board's
 * horizontal scroll container. */
export function SortableCard({
  boardId,
  card,
  members,
}: {
  boardId: string;
  card: BoardCardItem;
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
    id: card.id,
    data: {
      type: "card",
      cardId: card.id,
      columnId: card.columnId,
      sortOrder: card.sortOrder,
    },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`touch-none ${isDragging ? "opacity-40" : ""}`}
      data-testid="card"
      data-card-title={card.title}
      {...attributes}
      {...listeners}
    >
      <CardItem boardId={boardId} card={card} members={members} />
    </div>
  );
}
