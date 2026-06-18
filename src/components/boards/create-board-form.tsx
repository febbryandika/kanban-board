"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createBoard } from "@/actions/board";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { SubmitButton } from "./submit-button";

const PRESET_COLORS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
];

export function CreateBoardForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(createBoard, undefined);
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const nameId = useId();

  useEffect(() => {
    if (state?.ok) {
      toast.success("Board created");
      router.push("/boards");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor={nameId}>Board name</Label>
        <Input
          id={nameId}
          name="name"
          maxLength={60}
          placeholder="My board"
          autoFocus
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Background color</Label>
        <input type="hidden" name="bgColor" value={color} />
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Use color ${c}`}
              aria-pressed={color === c}
              className={cn(
                "size-7 rounded-full ring-2 ring-offset-2 ring-offset-background transition",
                color === c ? "ring-foreground" : "ring-transparent",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {state && !state.ok && (
        <p role="alert" className="text-sm text-destructive">
          {state.error.message}
        </p>
      )}

      <SubmitButton size="lg" pendingLabel="Creating…" className="mt-2 w-full">
        Create board
      </SubmitButton>
    </form>
  );
}
