"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { leaveBoard } from "@/actions/board";
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

/** Confirm dialog for a member leaving a shared board. Owners never see this —
 * they delete the board instead (so a board always keeps an owner). */
export function LeaveBoardDialog({
  boardId,
  boardName,
  onClose,
}: {
  boardId: string;
  boardName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(leaveBoard, undefined);

  useEffect(() => {
    if (state?.ok) {
      toast.success(`You left “${boardName}”`);
      onClose();
      router.refresh();
    }
  }, [state, boardName, onClose, router]);

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave board?</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll lose access to “{boardName}”. An owner can invite you
            back later.
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
            <input type="hidden" name="boardId" value={boardId} />
            <SubmitButton variant="destructive" pendingLabel="Leaving…">
              Leave
            </SubmitButton>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
