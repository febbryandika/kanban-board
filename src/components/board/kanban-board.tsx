"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type Active,
  type DragEndEvent,
  type DragStartEvent,
  type Over,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";

import { useBoard } from "@/hooks/useBoard";
import { useMoveCard } from "@/hooks/useMoveCard";
import { useMoveColumn } from "@/hooks/useMoveColumn";
import { ApiError } from "@/lib/api";
import { keyBetween } from "@/lib/fractional";
import { Button } from "@/components/ui/button";

import { AddColumnForm } from "./add-column-form";
import { BoardColumn } from "./board-column";
import { BoardSkeleton } from "./board-skeleton";
import { CardItem } from "./card-item";
import { SortableColumn } from "./sortable-column";

type DragData =
  | { type: "column"; columnId: string; sortOrder: string }
  | { type: "card"; cardId: string; columnId: string; sortOrder: string };

function getDragData(node: Active | Over | null): DragData | undefined {
  return node?.data.current as DragData | undefined;
}

export function KanbanBoard({ boardId }: { boardId: string }) {
  const { data, isPending, isError, error, refetch } = useBoard(boardId);
  const moveColumn = useMoveColumn(boardId);
  const moveCard = useMoveCard(boardId);

  const sensors = useSensors(
    // A small drag threshold so clicks (card menu, column menu, rename) still fire.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"column" | "card" | null>(null);

  const onDragStart = useCallback((e: DragStartEvent) => {
    const d = getDragData(e.active);
    if (!d) return;
    setActiveId(e.active.id as string);
    setActiveType(d.type);
  }, []);

  const onDragCancel = useCallback(() => {
    setActiveId(null);
    setActiveType(null);
  }, []);

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e;
      setActiveId(null);
      setActiveType(null);
      if (!over || !data) return;

      const activeData = getDragData(active);
      const overData = getDragData(over);
      if (!activeData || !overData) return;

      // --- Column reorder. `over` may be a column or a card; use its columnId. ---
      if (activeData.type === "column") {
        const targetColumnId = overData.columnId;
        if (targetColumnId === activeData.columnId) return;
        const cols = data.columns;
        const oldIndex = cols.findIndex((c) => c.id === activeData.columnId);
        const newIndex = cols.findIndex((c) => c.id === targetColumnId);
        if (oldIndex === -1 || newIndex === -1) return;
        const reordered = arrayMove(cols, oldIndex, newIndex);
        const pos = reordered.findIndex((c) => c.id === activeData.columnId);
        const sortOrder = keyBetween(
          reordered[pos - 1]?.sortOrder ?? null,
          reordered[pos + 1]?.sortOrder ?? null,
        );
        moveColumn.mutate({ columnId: activeData.columnId, sortOrder });
        return;
      }

      // --- Card move (within or across columns). ---
      const cardId = activeData.cardId;
      const sourceColumnId = activeData.columnId;
      const targetColumnId = overData.columnId;
      const targetCol = data.columns.find((c) => c.id === targetColumnId);
      if (!targetCol) return;

      let prev: string | null;
      let next: string | null;

      if (sourceColumnId === targetColumnId) {
        // Same column: arrayMove to match dnd-kit's reorder (handles up & down).
        const cards = targetCol.cards;
        const oldIndex = cards.findIndex((c) => c.id === cardId);
        if (oldIndex === -1) return;
        const newIndex =
          overData.type === "card"
            ? cards.findIndex((c) => c.id === over.id)
            : cards.length - 1;
        if (newIndex === -1 || newIndex === oldIndex) return; // no-op
        const reordered = arrayMove(cards, oldIndex, newIndex);
        const pos = reordered.findIndex((c) => c.id === cardId);
        prev = reordered[pos - 1]?.sortOrder ?? null;
        next = reordered[pos + 1]?.sortOrder ?? null;
      } else {
        // Cross column: insert before the hovered card, or append on a column drop.
        const siblings = targetCol.cards; // the dragged card isn't in this column
        const insertIndex =
          overData.type === "card"
            ? Math.max(0, siblings.findIndex((c) => c.id === over.id))
            : siblings.length;
        prev = siblings[insertIndex - 1]?.sortOrder ?? null;
        next = siblings[insertIndex]?.sortOrder ?? null;
      }

      moveCard.mutate({
        cardId,
        columnId: targetColumnId,
        sortOrder: keyBetween(prev, next),
      });
    },
    [data, moveColumn, moveCard],
  );

  if (isPending) return <BoardSkeleton />;

  if (isError) {
    return <BoardErrorState error={error} onRetry={() => refetch()} />;
  }

  const activeColumn =
    activeType === "column"
      ? (data.columns.find((c) => c.id === activeId) ?? null)
      : null;
  const activeCard =
    activeType === "card"
      ? (data.columns.flatMap((c) => c.cards).find((c) => c.id === activeId) ??
        null)
      : null;

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center gap-3 border-b p-4">
        <span
          className="h-5 w-5 rounded"
          style={{ backgroundColor: data.bgColor }}
          aria-hidden
        />
        <h1 className="text-lg font-semibold tracking-tight">{data.name}</h1>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          nativeButton={false}
          render={<Link href="/boards" />}
        >
          All boards
        </Button>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="flex flex-1 gap-4 overflow-x-auto p-4">
          <SortableContext
            items={data.columns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            {data.columns.map((column) => (
              <SortableColumn key={column.id} boardId={boardId} column={column} />
            ))}
          </SortableContext>
          <AddColumnForm boardId={boardId} />
        </div>

        <DragOverlay>
          {activeColumn ? (
            <BoardColumn boardId={boardId} column={activeColumn} isOverlay />
          ) : activeCard ? (
            <CardItem boardId={boardId} card={activeCard} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </main>
  );
}

function BoardErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  let message = "Something went wrong loading this board.";
  let showRetry = true;

  if (error instanceof ApiError) {
    if (error.status === 403) {
      message = "You don't have access to this board.";
      showRetry = false;
    } else if (error.status === 404) {
      message = "Board not found.";
      showRetry = false;
    } else if (error.status === 401) {
      message = "Please sign in to view this board.";
      showRetry = false;
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="flex items-center gap-2">
        {showRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/boards" />}
        >
          Back to boards
        </Button>
      </div>
    </div>
  );
}
