"use client";

import { useQuery } from "@tanstack/react-query";

import { ApiError, fetchJson } from "@/lib/api";
import type { BoardDetail } from "@/types/board";

/** Fetches the full board. Query key `['board', boardId]` matches the key the
 * optimistic card-move mutation will mutate in a later phase (SPEC §5.4). */
export function useBoard(boardId: string) {
  return useQuery({
    queryKey: ["board", boardId],
    queryFn: () => fetchJson<BoardDetail>(`/api/boards/${boardId}`),
    // Client errors (401/403/404) won't resolve on retry — surface them
    // immediately. Keep retrying transient network/5xx failures.
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
  });
}
