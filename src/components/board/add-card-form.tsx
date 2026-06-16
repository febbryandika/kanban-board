"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Inline add-card affordance. UI-only this phase — submit is a stub; wiring to
 * `POST /api/cards` lands in the card-CRUD phase. */
export function AddCardForm({ columnId }: { columnId: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  function reset() {
    setValue("");
    setOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO(card-CRUD phase): POST /api/cards { columnId, title: value } then
    // invalidate ['board', boardId]. No persistence yet.
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
