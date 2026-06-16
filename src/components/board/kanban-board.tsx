"use client";

import Link from "next/link";

import { useBoard } from "@/hooks/useBoard";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

import { AddColumnForm } from "./add-column-form";
import { BoardColumn } from "./board-column";
import { BoardSkeleton } from "./board-skeleton";

export function KanbanBoard({ boardId }: { boardId: string }) {
  const { data, isPending, isError, error, refetch } = useBoard(boardId);

  if (isPending) return <BoardSkeleton />;

  if (isError) {
    return <BoardErrorState error={error} onRetry={() => refetch()} />;
  }

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

      <div className="flex flex-1 gap-4 overflow-x-auto p-4">
        {data.columns.map((column) => (
          <BoardColumn key={column.id} boardId={boardId} column={column} />
        ))}
        <AddColumnForm boardId={boardId} />
      </div>
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
