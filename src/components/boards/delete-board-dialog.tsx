"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { deleteBoard } from "@/actions/board";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { SubmitButton } from "./submit-button";

export function DeleteBoardDialog({
  boardId,
  boardName,
  onClose,
}: {
  boardId: string;
  boardName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(deleteBoard, undefined);

  useEffect(() => {
    if (state?.ok) {
      onClose();
      router.refresh();
    }
  }, [state, onClose, router]);

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete board?</AlertDialogTitle>
          <AlertDialogDescription>
            “{boardName}” and all of its columns, cards, labels, and comments
            will be permanently deleted. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {state && !state.ok && (
          <p role="alert" className="text-sm text-destructive">
            {state.error.message}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
          <form action={formAction} className="contents">
            <input type="hidden" name="id" value={boardId} />
            <SubmitButton variant="destructive" pendingLabel="Deleting…">
              Delete
            </SubmitButton>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
