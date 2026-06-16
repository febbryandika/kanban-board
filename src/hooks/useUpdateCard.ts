"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchJson } from "@/lib/api";
import { optimisticallyUpdateCard } from "@/lib/optimistic";
import type { BoardCardItem, BoardDetail } from "@/types/board";

type UpdateCardInput = { cardId: string } & Partial<
  Pick<BoardCardItem, "title" | "description" | "dueDate" | "assigneeId">
>;

/** Optimistic card field edit (title / description / dueDate / assignee) from the
 * card modal. Mirrors `useMoveCard`: snapshot → apply reducer → rollback on
 * error → invalidate on settle. `dueDate` is sent as an ISO string (or null). */
export function useUpdateCard(boardId: string) {
  const qc = useQueryClient();
  const key = ["board", boardId] as const;
  return useMutation({
    mutationFn: ({ cardId, ...fields }: UpdateCardInput) =>
      fetchJson(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(fields),
      }),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<BoardDetail>(key);
      if (prev) {
        qc.setQueryData<BoardDetail>(key, optimisticallyUpdateCard(prev, patch));
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
