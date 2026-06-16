"use client";

import { ArchiveIcon, MoreHorizontalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useArchiveCard } from "@/hooks/useCardMutations";

/** Per-card actions. Archive is a soft delete (`isArchived`) — the card leaves
 * the board optimistically. */
export function CardMenu({
  boardId,
  cardId,
}: {
  boardId: string;
  cardId: string;
}) {
  const archiveCard = useArchiveCard(boardId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Card actions" />
        }
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => archiveCard.mutate(cardId)}>
          <ArchiveIcon />
          Archive
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
