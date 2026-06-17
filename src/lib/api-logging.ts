import { logger, serializeError } from "@/lib/logger";

/**
 * Wrap a Route Handler with structured request logging + timing (SPEC §11).
 * Emits one `api.request` line per call (method, path, status, ms) tagged with a
 * generated `requestId`, which is also echoed on the response's `x-request-id`
 * header so client and server logs can be correlated.
 *
 * The wrapped handler keeps its own `try/catch + errorResponse`; the outer catch
 * here is a defensive backstop for anything that escapes it.
 *
 * The generic `C` preserves the route context type (e.g. dynamic `params`):
 *   export const PATCH = withApiLogging<{ params: Promise<{ id: string }> }>(
 *     "cards.update",
 *     async (req, { params }) => { ... },
 *   );
 */
export function withApiLogging<C = unknown>(
  name: string,
  handler: (req: Request, ctx: C) => Promise<Response>,
): (req: Request, ctx: C) => Promise<Response> {
  return async (req, ctx) => {
    const requestId = crypto.randomUUID();
    const start = Date.now();
    const method = req.method;
    const path = new URL(req.url).pathname;

    try {
      const res = await handler(req, ctx);
      res.headers.set("x-request-id", requestId);
      logger.info("api.request", {
        name,
        method,
        path,
        status: res.status,
        ms: Date.now() - start,
        requestId,
      });
      return res;
    } catch (err) {
      logger.error("api.request_failed", {
        name,
        method,
        path,
        ms: Date.now() - start,
        requestId,
        error: serializeError(err),
      });
      throw err;
    }
  };
}
