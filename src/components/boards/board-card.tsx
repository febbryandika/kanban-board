"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MoreVerticalIcon,
  PencilIcon,
  Trash2Icon,
  UsersIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { RenameBoardDialog } from "./rename-board-dialog";
import { DeleteBoardDialog } from "./delete-board-dialog";
import { BoardMembersDialog } from "./board-members-dialog";
import type { BoardListItem, BoardMemberView } from "./types";

type DialogKind = "rename" | "delete" | "members";

export function BoardCard({
  board,
  members,
  currentUserId,
}: {
  board: BoardListItem;
  members: BoardMemberView[];
  currentUserId: string;
}) {
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const isOwner = board.role === "owner";

  return (
    <>
      <Card className="border-l-4" style={{ borderLeftColor: board.bgColor }}>
        <CardHeader>
          <CardTitle className="truncate">
            <Link href={`/board/${board.id}`} className="hover:underline">
              {board.name}
            </Link>
          </CardTitle>
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Board actions"
                  />
                }
              >
                <MoreVerticalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDialog("rename")}>
                  <PencilIcon />
                  Rename
                </DropdownMenuItem>
                {isOwner && (
                  <DropdownMenuItem onClick={() => setDialog("members")}>
                    <UsersIcon />
                    Manage members
                  </DropdownMenuItem>
                )}
                {isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDialog("delete")}
                    >
                      <Trash2Icon />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary" className="capitalize">
            {board.role}
          </Badge>
        </CardContent>
      </Card>

      {dialog === "rename" && (
        <RenameBoardDialog
          boardId={board.id}
          currentName={board.name}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "delete" && (
        <DeleteBoardDialog
          boardId={board.id}
          boardName={board.name}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "members" && (
        <BoardMembersDialog
          boardId={board.id}
          boardName={board.name}
          members={members}
          currentUserId={currentUserId}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}
