"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdateCard } from "@/hooks/useUpdateCard";
import { getInitials } from "@/lib/utils";
import type { BoardMemberInfo } from "@/types/board";

export function CardAssignee({
  boardId,
  cardId,
  assigneeId,
  members,
}: {
  boardId: string;
  cardId: string;
  assigneeId: string | null;
  members: BoardMemberInfo[];
}) {
  const updateCard = useUpdateCard(boardId);
  const assignee = members.find((m) => m.userId === assigneeId) ?? null;

  function assign(userId: string | null) {
    if (userId === (assigneeId ?? null)) return;
    updateCard.mutate({ cardId, assigneeId: userId });
  }

  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-xs font-medium text-muted-foreground">Assignee</h3>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2 font-normal"
            />
          }
        >
          {assignee ? (
            <>
              <Avatar size="sm">
                <AvatarImage src={assignee.image ?? undefined} alt="" />
                <AvatarFallback>{getInitials(assignee.name)}</AvatarFallback>
              </Avatar>
              <span className="truncate">{assignee.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Unassigned</span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => assign(null)}>
            Unassigned
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {members.map((m) => (
            <DropdownMenuItem key={m.userId} onClick={() => assign(m.userId)}>
              <Avatar size="sm">
                <AvatarImage src={m.image ?? undefined} alt="" />
                <AvatarFallback>{getInitials(m.name)}</AvatarFallback>
              </Avatar>
              <span className="truncate">{m.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </section>
  );
}
