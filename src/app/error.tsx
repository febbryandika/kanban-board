"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

/** Root-level error boundary — a safety net for unhandled render errors on any
 * page segment (SPEC §11). The board view has its own boundary in board/[id]. */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("ui.error_boundary", {
      scope: "app",
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
