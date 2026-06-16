"use client";

import { useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useRenameColumn } from "@/hooks/useColumnMutations";
import type { BoardColumnWithCards } from "@/types/board";

import { AddCardForm } from "./add-card-form";
import { CardItem } from "./card-item";
import { ColumnMenu } from "./column-menu";

export function BoardColumn({
  boardId,
  column,
}: {
  boardId: string;
  column: BoardColumnWithCards;
}) {
  const [isRenaming, setIsRenaming] = useState(false);

  return (
    <div className="flex w-72 shrink-0 flex-col gap-3 rounded-xl bg-muted/50 p-3">
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
            <h2 className="truncate text-sm font-semibold">{column.name}</h2>
            <div className="flex shrink-0 items-center gap-1">
              <Badge variant="secondary">{column.cards.length}</Badge>
              <ColumnMenu
                boardId={boardId}
                columnId={column.id}
                columnName={column.name}
                onRename={() => setIsRenaming(true)}
              />
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {column.cards.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted-foreground">No cards</p>
        ) : (
          column.cards.map((card) => <CardItem key={card.id} card={card} />)
        )}
      </div>

      <AddCardForm columnId={column.id} />
    </div>
  );
}

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
