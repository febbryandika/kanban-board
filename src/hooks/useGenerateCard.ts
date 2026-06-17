"use client";

import { useMutation } from "@tanstack/react-query";

import { fetchJson } from "@/lib/api";

export type GeneratedCard = {
  title: string;
  description: string;
  acceptanceCriteria: string[];
};

type GenerateInput = { idea: string; boardContext?: string };

/** Calls POST /api/ai/card-generate to draft a card from a rough idea. This is
 * pre-fill only — it writes nothing to the board cache; the caller reviews the
 * draft and creates the card via `useCreateCard`. Exposes `isPending`/`error`. */
export function useGenerateCard() {
  return useMutation({
    // Failures surface inline in the add-card form (the form is open), so skip
    // the global error toast wired in query-client.ts to avoid a redundant one.
    meta: { suppressErrorToast: true },
    mutationFn: ({ idea, boardContext }: GenerateInput) =>
      fetchJson<GeneratedCard>("/api/ai/card-generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idea, boardContext }),
      }),
  });
}
