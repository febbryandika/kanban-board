"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchJson } from "@/lib/api";
import { optimisticallyMoveColumn } from "@/lib/optimistic";
import type { BoardDetail } from "@/types/board";

type MoveColumnInput = { columnId: string; sortOrder: string };

/** Optimistic column reorder (SPEC §5.4 pattern). PATCHes only the moved
 * column's sortOrder. Prepared infra — the DnD phase computes `sortOrder` with
 * `keyBetween(prev, next)` on drop and calls this; there is no caller yet. */
export function useMoveColumn(boardId: string) {
  const qc = useQueryClient();
  const key = ["board", boardId] as const;
  return useMutation({
    mutationFn: ({ columnId, sortOrder }: MoveColumnInput) =>
      fetchJson(`/api/columns/${columnId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sortOrder }),
      }),
    onMutate: async (move) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<BoardDetail>(key);
      if (prev) {
        qc.setQueryData<BoardDetail>(key, optimisticallyMoveColumn(prev, move));
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
