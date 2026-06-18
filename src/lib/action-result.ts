import { AuthError } from "@/lib/auth";
import { logger, serializeError } from "@/lib/logger";

/**
 * Discriminated result returned by Server Actions so that client forms can
 * render expected failures (validation, not-found, forbidden, …) inline
 * instead of tripping the Next.js error boundary.
 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });

export const fail = (code: string, message: string): ActionResult<never> => ({
  ok: false,
  error: { code, message },
});

/**
 * Run a Server Action body, mapping thrown auth/authorization failures to a
 * structured `ActionResult`. Unexpected errors are logged and reported as a
 * generic internal error. (Actions in this app never throw `redirect()` — they
 * return success and let the client navigate — so no redirect handling needed.)
 *
 * `name` identifies the action in logs (e.g. "board.create").
 */
export async function runAction<T>(
  name: string,
  fn: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  const start = Date.now();
  try {
    const result = await fn();
    logger.debug("action.ok", { name, ms: Date.now() - start });
    return result;
  } catch (err) {
    if (err instanceof AuthError) {
      logger.debug("action.auth_error", { name, code: err.code });
      return fail(err.code, err.message);
    }
    logger.error("action.unhandled", {
      name,
      ms: Date.now() - start,
      error: serializeError(err),
    });
    return fail("INTERNAL_ERROR", "Something went wrong");
  }
}
