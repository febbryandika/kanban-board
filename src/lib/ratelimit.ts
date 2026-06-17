import { eq } from "drizzle-orm";

import { db } from "@/db";
import { aiRateLimits } from "@/db/schema";

const AI_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const AI_MAX = 20; // generations per window per user

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };

/**
 * Fixed-window per-user rate limit for the AI card generator (SPEC §8), backed
 * by Postgres — no external infra, correct across serverless instances. Each
 * call counts one generation attempt; the window resets lazily once it expires.
 */
export async function checkAiRateLimit(
  userId: string,
): Promise<RateLimitResult> {
  const now = Date.now();

  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(aiRateLimits)
      .where(eq(aiRateLimits.userId, userId))
      .for("update")
      .limit(1);

    // No row yet, or the previous window has elapsed → start a fresh window.
    if (!row || now - row.windowStart >= AI_WINDOW_MS) {
      await tx
        .insert(aiRateLimits)
        .values({ userId, count: 1, windowStart: now })
        .onConflictDoUpdate({
          target: aiRateLimits.userId,
          set: { count: 1, windowStart: now },
        });
      return { allowed: true };
    }

    if (row.count >= AI_MAX) {
      const retryAfterSec = Math.ceil(
        (row.windowStart + AI_WINDOW_MS - now) / 1000,
      );
      return { allowed: false, retryAfterSec };
    }

    await tx
      .update(aiRateLimits)
      .set({ count: row.count + 1 })
      .where(eq(aiRateLimits.userId, userId));
    return { allowed: true };
  });
}
