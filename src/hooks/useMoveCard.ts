"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchJson } from "@/lib/api";
import { optimisticallyMoveCard } from "@/lib/optimistic";
import type { BoardDetail } from "@/types/board";

type MoveCardInput = { cardId: string; columnId: string; sortOrder: string };

/** Optimistic card move (SPEC §5.4 pattern). PATCHes only the moved card's
 * columnId + sortOrder. The DnD layer computes `sortOrder` with
 * `keyBetween(prev, next)` on drop and calls this. */
export function useMoveCard(boardId: string) {
  const qc = useQueryClient();
  const key = ["board", boardId] as const;
  return useMutation({
    mutationFn: ({ cardId, columnId, sortOrder }: MoveCardInput) =>
      fetchJson(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ columnId, sortOrder }),
      }),
    onMutate: async (move) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<BoardDetail>(key);
      if (prev) {
        qc.setQueryData<BoardDetail>(key, optimisticallyMoveCard(prev, move));
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
