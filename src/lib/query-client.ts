import { QueryClient, MutationCache, isServer } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "@/lib/api";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 60 * 1000 } },
    // Centralized failure feedback for interactive mutations (SPEC §11): every
    // hook already rolls back its optimistic cache write in `onError`; this surfaces
    // a toast so a silent revert (e.g. a failed card drag) is visible to the user.
    // Opt out per-mutation with `meta: { suppressErrorToast: true }`.
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        if (mutation.meta?.suppressErrorToast) return;
        const message =
          error instanceof ApiError
            ? error.message
            : "Something went wrong. Please try again.";
        toast.error(message);
      },
    }),
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
