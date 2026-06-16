"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCreateCard } from "@/hooks/useCardMutations";

/** Inline add-card affordance. Optimistically appends a card to the column. */
export function AddCardForm({
  boardId,
  columnId,
}: {
  boardId: string;
  columnId: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const createCard = useCreateCard(boardId);

  function reset() {
    setValue("");
    setOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const title = value.trim();
    if (!title) return;
    createCard.mutate({ columnId, title });
    reset();
  }

  if (!open) {
    return (
      <Button
        variant="ghost"
        className="w-full justify-start text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <PlusIcon />
        Add a card
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-column-id={columnId}
      className="flex flex-col gap-2"
    >
      <textarea
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") reset();
        }}
        placeholder="Enter a title for this card…"
        rows={2}
        className="w-full resize-none rounded-md border bg-background p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={!value.trim()}>
          Add card
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={reset}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
