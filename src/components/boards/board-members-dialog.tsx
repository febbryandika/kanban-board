"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { useRouter } from "next/navigation";

import { inviteMember } from "@/actions/board";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { SubmitButton } from "./submit-button";
import type { BoardMemberView } from "./types";

export function BoardMembersDialog({
  boardId,
  boardName,
  members,
  currentUserId,
  onClose,
}: {
  boardId: string;
  boardName: string;
  members: BoardMemberView[];
  currentUserId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(inviteMember, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const emailId = useId();

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  const sorted = [...members].sort((a, b) =>
    a.role === b.role
      ? a.name.localeCompare(b.name)
      : a.role === "owner"
        ? -1
        : 1,
  );

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Members</DialogTitle>
          <DialogDescription>
            Invite people to “{boardName}” by email. They must already have an
            account.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="boardId" value={boardId} />
          <Label htmlFor={emailId}>Email</Label>
          <div className="flex gap-2">
            <Input
              id={emailId}
              name="email"
              type="email"
              placeholder="teammate@example.com"
              className="flex-1"
              required
            />
            <SubmitButton pendingLabel="Inviting…">Invite</SubmitButton>
          </div>
          {state && !state.ok && (
            <p role="alert" className="text-sm text-destructive">
              {state.error.message}
            </p>
          )}
          {state?.ok && (
            <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">
              Member added.
            </p>
          )}
        </form>

        <ul className="flex flex-col gap-2">
          {sorted.map((m) => (
            <li
              key={m.userId}
              className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {m.name}
                  {m.userId === currentUserId && (
                    <span className="text-muted-foreground"> (you)</span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {m.email}
                </p>
              </div>
              <Badge
                variant={m.role === "owner" ? "default" : "secondary"}
                className="capitalize"
              >
                {m.role}
              </Badge>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Done
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
