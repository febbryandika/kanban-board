"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchJson } from "@/lib/api";
import { keyForAppend } from "@/lib/fractional";
import type { Card } from "@/db/schema";
import type { BoardCardItem, BoardDetail } from "@/types/board";

/** Optimistic card create/archive against the `['board', boardId]` cache (SPEC
 * §5.4 pattern). `onMutate` snapshots + applies the edit, `onError` rolls back,
 * `onSettled` invalidates so the server refetch reconciles (e.g. temp → real id). */

function boardKey(boardId: string) {
  return ["board", boardId] as const;
}

export function useCreateCard(boardId: string) {
  const qc = useQueryClient();
  const key = boardKey(boardId);
  return useMutation({
    mutationFn: ({ columnId, title }: { columnId: string; title: string }) =>
      fetchJson<Card>("/api/cards", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ columnId, title }),
      }),
    onMutate: async ({ columnId, title }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<BoardDetail>(key);
      if (prev) {
        const column = prev.columns.find((c) => c.id === columnId);
        const last = column
          ? column.cards.reduce<string | null>(
              (max, c) => (max === null || c.sortOrder > max ? c.sortOrder : max),
              null,
            )
          : null;
        const optimistic: BoardCardItem = {
          id: `temp-${crypto.randomUUID()}`,
          columnId,
          title,
          description: null,
          dueDate: null,
          sortOrder: keyForAppend(last),
          assigneeId: null,
          labels: [],
        };
        qc.setQueryData<BoardDetail>(key, {
          ...prev,
          columns: prev.columns.map((c) =>
            c.id === columnId ? { ...c, cards: [...c.cards, optimistic] } : c,
          ),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useArchiveCard(boardId: string) {
  const qc = useQueryClient();
  const key = boardKey(boardId);
  return useMutation({
    mutationFn: (cardId: string) =>
      fetchJson<Card>(`/api/cards/${cardId}/archive`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      }),
    onMutate: async (cardId) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<BoardDetail>(key);
      if (prev) {
        qc.setQueryData<BoardDetail>(key, {
          ...prev,
          columns: prev.columns.map((c) => ({
            ...c,
            cards: c.cards.filter((card) => card.id !== cardId),
          })),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
