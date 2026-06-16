"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateColumn } from "@/hooks/useColumnMutations";

/** Trailing "Add a column" affordance. Optimistically appends to the board and
 * reconciles on settle (see `useCreateColumn`). `self-start` keeps it top-aligned
 * while real columns stretch to fill the board height. */
export function AddColumnForm({ boardId }: { boardId: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const createColumn = useCreateColumn(boardId);

  function reset() {
    setValue("");
    setOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = value.trim();
    if (!name) return;
    createColumn.mutate(name);
    reset();
  }

  if (!open) {
    return (
      <Button
        variant="ghost"
        className="w-72 shrink-0 justify-start self-start text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <PlusIcon />
        Add a column
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-72 shrink-0 flex-col gap-2 self-start rounded-xl bg-muted/50 p-3"
    >
      <Input
        autoFocus
        value={value}
        maxLength={40}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") reset();
        }}
        placeholder="Enter column name…"
        aria-label="Column name"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={!value.trim()}>
          Add column
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={reset}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
