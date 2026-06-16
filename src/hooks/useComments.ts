"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchJson } from "@/lib/api";
import type { CardComment } from "@/types/board";

/** Comments live in their own `['card-comments', cardId]` query, fetched lazily
 * when the modal opens (not folded into the board payload — SPEC §5.1). */

function commentsKey(cardId: string) {
  return ["card-comments", cardId] as const;
}

export function useComments(cardId: string | null) {
  return useQuery({
    queryKey: ["card-comments", cardId],
    queryFn: () =>
      fetchJson<CardComment[]>(`/api/cards/${cardId}/comments`),
    enabled: Boolean(cardId),
  });
}

export function useCreateComment(
  cardId: string,
  author: { userId: string; name: string },
) {
  const qc = useQueryClient();
  const key = commentsKey(cardId);
  return useMutation({
    mutationFn: ({ content }: { content: string }) =>
      fetchJson<CardComment>(`/api/cards/${cardId}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      }),
    onMutate: async ({ content }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<CardComment[]>(key);
      const optimistic: CardComment = {
        id: `temp-${crypto.randomUUID()}`,
        cardId,
        userId: author.userId,
        authorName: author.name,
        content,
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData<CardComment[]>(key, [...(prev ?? []), optimistic]);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteComment(cardId: string) {
  const qc = useQueryClient();
  const key = commentsKey(cardId);
  return useMutation({
    mutationFn: (commentId: string) =>
      fetchJson(
        `/api/cards/${cardId}/comments?commentId=${encodeURIComponent(commentId)}`,
        { method: "DELETE" },
      ),
    onMutate: async (commentId) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<CardComment[]>(key);
      if (prev) {
        qc.setQueryData<CardComment[]>(
          key,
          prev.filter((c) => c.id !== commentId),
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
