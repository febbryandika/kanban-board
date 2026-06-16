"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchJson } from "@/lib/api";
import {
  optimisticallyAddCardLabel,
  optimisticallyRemoveCardLabel,
} from "@/lib/optimistic";
import type { BoardDetail, BoardLabel } from "@/types/board";

/** Apply / remove a label on a card, optimistically against the board cache.
 * The label-definition CRUD lives in Server Actions; applying an existing label
 * to a card is interactive, so it's a Route Handler consumed here. */

function boardKey(boardId: string) {
  return ["board", boardId] as const;
}

export function useAddCardLabel(boardId: string) {
  const qc = useQueryClient();
  const key = boardKey(boardId);
  return useMutation({
    mutationFn: ({ cardId, label }: { cardId: string; label: BoardLabel }) =>
      fetchJson(`/api/cards/${cardId}/labels`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ labelId: label.id }),
      }),
    onMutate: async ({ cardId, label }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<BoardDetail>(key);
      if (prev) {
        qc.setQueryData<BoardDetail>(
          key,
          optimisticallyAddCardLabel(prev, { cardId, label }),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useRemoveCardLabel(boardId: string) {
  const qc = useQueryClient();
  const key = boardKey(boardId);
  return useMutation({
    mutationFn: ({ cardId, labelId }: { cardId: string; labelId: string }) =>
      fetchJson(`/api/cards/${cardId}/labels`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ labelId }),
      }),
    onMutate: async ({ cardId, labelId }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<BoardDetail>(key);
      if (prev) {
        qc.setQueryData<BoardDetail>(
          key,
          optimisticallyRemoveCardLabel(prev, { cardId, labelId }),
        );
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
