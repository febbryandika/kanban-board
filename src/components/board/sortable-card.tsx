"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { BoardCardItem, BoardMemberInfo } from "@/types/board";

import { CardItem } from "./card-item";

/** Draggable wrapper around a card. The dragged item is hidden (it's rendered in
 * the DndContext's DragOverlay instead) to avoid clipping by the board's
 * horizontal scroll container. While another card is dragged over this one, a thin
 * insertion line shows where it will land. */
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
    active,
    activeIndex,
    index,
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: card.id,
    // A temp (optimistic) card can't be dragged until the server assigns a real id.
    disabled: card.id.startsWith("temp-"),
    data: {
      type: "card",
      cardId: card.id,
      columnId: card.columnId,
      sortOrder: card.sortOrder,
    },
  });

  // Insertion guide: shown only when a *card* (not a column) is dragged over this
  // one, and never on the card being dragged. A same-column downward drag lands
  // after the target; every other case lands before it — matching onDragEnd.
  const showInsertion =
    isOver && !isDragging && active?.data.current?.type === "card";
  const insertAfter = activeIndex !== -1 && activeIndex < index;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`relative touch-none ${isDragging ? "opacity-40" : ""}`}
      data-testid="card"
      data-card-title={card.title}
      {...attributes}
      {...listeners}
    >
      {showInsertion && (
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 h-0.5 rounded-full bg-primary ${
            insertAfter ? "-bottom-1" : "-top-1"
          }`}
        />
      )}
      <CardItem boardId={boardId} card={card} members={members} />
    </div>
  );
}
