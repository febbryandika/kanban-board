"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PlusIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useCreateCard } from "@/hooks/useCardMutations";
import { useGenerateCard, type GeneratedCard } from "@/hooks/useGenerateCard";
import type { BoardDetail } from "@/types/board";

/** Fold the AI's acceptance criteria into the Markdown description as a checklist
 * (there is no AC column). The user reviews/edits before saving. */
function buildDescription(ai: GeneratedCard): string {
  const criteria = ai.acceptanceCriteria.filter((c) => c.trim().length > 0);
  if (criteria.length === 0) return ai.description;
  const checklist = criteria.map((c) => `- [ ] ${c}`).join("\n");
  return `${ai.description}\n\n## Acceptance Criteria\n${checklist}`;
}

/** Inline add-card affordance. Optimistically appends a card to the column.
 * Also offers AI "✨ Generate": the input doubles as a rough idea, and the
 * result pre-fills title + description for review before the card is created. */
export function AddCardForm({
  boardId,
  columnId,
}: {
  boardId: string;
  columnId: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const createCard = useCreateCard(boardId);
  const generate = useGenerateCard();
  const qc = useQueryClient();

  function reset() {
    setValue("");
    setDescription("");
    generate.reset();
    setOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const title = value.trim();
    if (!title) return;
    const desc = description.trim();
    createCard.mutate({ columnId, title, description: desc || undefined });
    reset();
  }

  function handleGenerate() {
    const idea = value.trim();
    if (!idea) return;
    const boardContext = qc.getQueryData<BoardDetail>(["board", boardId])?.name;
    generate.mutate(
      { idea, boardContext },
      {
        onSuccess: (ai) => {
          setValue(ai.title);
          setDescription(buildDescription(ai));
          toast.success("Card draft ready — review and save");
        },
      },
    );
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
        data-testid="card-title-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") reset();
        }}
        disabled={generate.isPending}
        placeholder="Enter a title — or a rough idea to ✨ generate…"
        rows={2}
        className="w-full resize-none rounded-md border bg-background p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      />

      {description !== "" && (
        <textarea
          data-testid="card-description-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={generate.isPending}
          placeholder="Description"
          rows={6}
          maxLength={5000}
          className="w-full resize-y rounded-md border bg-background p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
        />
      )}

      {generate.error && (
        <p role="alert" className="text-sm text-destructive">
          {generate.error.message}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={!value.trim() || generate.isPending}>
          Add card
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={handleGenerate}
          disabled={!value.trim() || generate.isPending}
        >
          {generate.isPending ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <SparklesIcon />
          )}
          {generate.isPending ? "Generating…" : "Generate"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={reset}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
