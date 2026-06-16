"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchJson } from "@/lib/api";
import { keyForAppend } from "@/lib/fractional";
import type { Column } from "@/db/schema";
import type { BoardColumnWithCards, BoardDetail } from "@/types/board";

/** Optimistic column CRUD against the `['board', boardId]` cache (SPEC §5.4
 * pattern). `onMutate` snapshots + applies the edit, `onError` rolls back,
 * `onSettled` invalidates so the server refetch reconciles (e.g. temp → real id). */

function boardKey(boardId: string) {
  return ["board", boardId] as const;
}

export function useCreateColumn(boardId: string) {
  const qc = useQueryClient();
  const key = boardKey(boardId);
  return useMutation({
    mutationFn: (name: string) =>
      fetchJson<Column>("/api/columns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ boardId, name }),
      }),
    onMutate: async (name) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<BoardDetail>(key);
      if (prev) {
        const last = prev.columns.reduce<string | null>(
          (max, c) => (max === null || c.sortOrder > max ? c.sortOrder : max),
          null,
        );
        const optimistic: BoardColumnWithCards = {
          id: `temp-${crypto.randomUUID()}`,
          name,
          sortOrder: keyForAppend(last),
          cards: [],
        };
        qc.setQueryData<BoardDetail>(key, {
          ...prev,
          columns: [...prev.columns, optimistic],
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

export function useRenameColumn(boardId: string) {
  const qc = useQueryClient();
  const key = boardKey(boardId);
  return useMutation({
    mutationFn: ({ columnId, name }: { columnId: string; name: string }) =>
      fetchJson<Column>(`/api/columns/${columnId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      }),
    onMutate: async ({ columnId, name }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<BoardDetail>(key);
      if (prev) {
        qc.setQueryData<BoardDetail>(key, {
          ...prev,
          columns: prev.columns.map((c) =>
            c.id === columnId ? { ...c, name } : c,
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

export function useDeleteColumn(boardId: string) {
  const qc = useQueryClient();
  const key = boardKey(boardId);
  return useMutation({
    mutationFn: (columnId: string) =>
      fetchJson<{ id: string }>(`/api/columns/${columnId}`, {
        method: "DELETE",
      }),
    onMutate: async (columnId) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<BoardDetail>(key);
      if (prev) {
        qc.setQueryData<BoardDetail>(key, {
          ...prev,
          columns: prev.columns.filter((c) => c.id !== columnId),
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
