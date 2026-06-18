"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

/**
 * Error boundary for the board view (SPEC §11). Catches render/throw errors in
 * the board tree — distinct from `BoardErrorState`, which handles query-fetch
 * failures. `reset()` re-renders the segment so the user can retry without a
 * full reload.
 */
export default function BoardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("ui.error_boundary", {
      scope: "board",
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          This board couldn&apos;t be displayed. You can try again.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
