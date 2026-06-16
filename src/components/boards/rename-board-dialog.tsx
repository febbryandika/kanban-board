"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";

import { renameBoard } from "@/actions/board";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { SubmitButton } from "./submit-button";

export function RenameBoardDialog({
  boardId,
  currentName,
  onClose,
}: {
  boardId: string;
  currentName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(renameBoard, undefined);
  const nameId = useId();
  // Pin the initial value so a post-refresh prop change can't retrigger
  // Base UI's "uncontrolled default value changed" warning during close.
  const [initialName] = useState(currentName);

  useEffect(() => {
    if (state?.ok) {
      onClose();
      router.refresh();
    }
  }, [state, onClose, router]);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename board</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={boardId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor={nameId}>Board name</Label>
            <Input
              id={nameId}
              name="name"
              defaultValue={initialName}
              maxLength={60}
              autoFocus
              required
            />
          </div>
          {state && !state.ok && (
            <p role="alert" className="text-sm text-destructive">
              {state.error.message}
            </p>
          )}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
