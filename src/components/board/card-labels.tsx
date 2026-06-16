"use client";

import { useState, useTransition } from "react";
import {
  CheckIcon,
  PencilIcon,
  PlusIcon,
  TagIcon,
  Trash2Icon,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { createLabel, deleteLabel, updateLabel } from "@/actions/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useAddCardLabel,
  useRemoveCardLabel,
} from "@/hooks/useCardLabelMutations";
import { cn } from "@/lib/utils";
import type { BoardLabel } from "@/types/board";

const LABEL_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#6366f1",
  "#a855f7",
  "#ec4899",
];

export function CardLabels({
  boardId,
  cardId,
  cardLabels,
  boardLabels,
}: {
  boardId: string;
  cardId: string;
  cardLabels: BoardLabel[];
  boardLabels: BoardLabel[];
}) {
  const qc = useQueryClient();
  const addLabel = useAddCardLabel(boardId);
  const removeLabel = useRemoveCardLabel(boardId);
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applied = new Set(cardLabels.map((l) => l.id));

  function refresh() {
    qc.invalidateQueries({ queryKey: ["board", boardId] });
  }

  function toggle(label: BoardLabel) {
    if (applied.has(label.id)) {
      removeLabel.mutate({ cardId, labelId: label.id });
    } else {
      addLabel.mutate({ cardId, label });
    }
  }

  function handleCreate(name: string, color: string) {
    startTransition(async () => {
      const res = await createLabel({ boardId, name, color });
      if (res.ok) {
        setCreating(false);
        setError(null);
        refresh();
      } else {
        setError(res.error.message);
      }
    });
  }

  function handleUpdate(id: string, name: string, color: string) {
    startTransition(async () => {
      const res = await updateLabel({ id, name, color });
      if (res.ok) {
        setEditingId(null);
        setError(null);
        refresh();
      } else {
        setError(res.error.message);
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteLabel({ id });
      if (res.ok) {
        setError(null);
        refresh();
      } else {
        setError(res.error.message);
      }
    });
  }

  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-xs font-medium text-muted-foreground">Labels</h3>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="h-auto min-h-9 justify-start gap-2 py-1.5 font-normal"
            />
          }
        >
          <TagIcon className="size-4 shrink-0" />
          {cardLabels.length > 0 ? (
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {cardLabels.map((l) => (
                <span key={l.id} className="inline-flex items-center gap-1">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: l.color }}
                  />
                  <span className="text-xs">{l.name}</span>
                </span>
              ))}
            </span>
          ) : (
            <span className="text-muted-foreground">Labels</span>
          )}
        </PopoverTrigger>

        <PopoverContent align="start" className="max-h-96 w-72 overflow-y-auto">
          <div className="flex flex-col gap-1">
            {boardLabels.length === 0 && !creating && (
              <p className="px-2 py-1 text-xs text-muted-foreground">
                No labels yet. Create one below.
              </p>
            )}

            {boardLabels.map((label) =>
              editingId === label.id ? (
                <LabelEditor
                  key={label.id}
                  initialName={label.name}
                  initialColor={label.color}
                  submitText="Save"
                  pending={isPending}
                  onSubmit={(name, color) => handleUpdate(label.id, name, color)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div key={label.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggle(label)}
                    className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted"
                    aria-pressed={applied.has(label.id)}
                  >
                    <span className="flex size-4 items-center justify-center">
                      {applied.has(label.id) && <CheckIcon className="size-4" />}
                    </span>
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="flex-1 truncate text-sm">{label.name}</span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${label.name}`}
                    onClick={() => setEditingId(label.id)}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${label.name}`}
                    disabled={isPending}
                    onClick={() => handleDelete(label.id)}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              ),
            )}

            {error && (
              <p role="alert" className="px-2 text-xs text-destructive">
                {error}
              </p>
            )}

            <div className="mt-1 border-t pt-1">
              {creating ? (
                <LabelEditor
                  initialName=""
                  initialColor={LABEL_COLORS[0]}
                  submitText="Add"
                  pending={isPending}
                  onSubmit={handleCreate}
                  onCancel={() => setCreating(false)}
                />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setCreating(true)}
                >
                  <PlusIcon />
                  Create a label
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </section>
  );
}

function LabelEditor({
  initialName,
  initialColor,
  submitText,
  pending,
  onSubmit,
  onCancel,
}: {
  initialName: string;
  initialColor: string;
  submitText: string;
  pending: boolean;
  onSubmit: (name: string, color: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);

  return (
    <div className="flex flex-col gap-2 rounded-md border p-2">
      <Input
        autoFocus
        value={name}
        maxLength={30}
        onChange={(e) => setName(e.target.value)}
        placeholder="Label name"
        aria-label="Label name"
        className="h-8"
      />
      <div className="flex flex-wrap gap-1.5">
        {LABEL_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Use color ${c}`}
            onClick={() => setColor(c)}
            className={cn(
              "size-6 rounded-full",
              color === c && "ring-2 ring-ring ring-offset-1",
            )}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={pending || !name.trim()}
          onClick={() => onSubmit(name.trim(), color)}
        >
          {submitText}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
