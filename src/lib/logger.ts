/**
 * Lightweight, isomorphic structured logger (SPEC §11). Wraps `console` so the
 * platform's stdout collector (Vercel) captures everything — no external
 * observability infra. Safe to import from both server code and client
 * components (e.g. error boundaries): it touches no Node-only APIs.
 *
 * One record per call. In development it prints a readable single line; in
 * production a single-line JSON object that log collectors can parse.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const isProd = process.env.NODE_ENV === "production";

// Read LOG_LEVEL directly (not via the typed `env`) so this stays isomorphic —
// the typed env is server-only, and on the client `process.env.LOG_LEVEL` is
// simply undefined (the client only ever logs `error`, which always passes).
function minLevel(): number {
  const configured = process.env.LOG_LEVEL as LogLevel | undefined;
  if (configured && configured in LEVEL_ORDER) return LEVEL_ORDER[configured];
  return isProd ? LEVEL_ORDER.info : LEVEL_ORDER.debug;
}

/** Normalize an unknown thrown value into a loggable shape. */
export function serializeError(error: unknown) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { name: "NonError", message: String(error) };
}

const CONSOLE: Record<LogLevel, (...args: unknown[]) => void> = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return String(v);
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function emit(level: LogLevel, event: string, fields?: Record<string, unknown>) {
  if (LEVEL_ORDER[level] < minLevel()) return;
  const ts = new Date().toISOString();

  if (isProd) {
    CONSOLE[level](JSON.stringify({ ts, level, event, ...fields }));
    return;
  }

  // Dev: readable single line, e.g. `INFO  api.request name=cards.create ms=42`.
  const rendered = fields
    ? Object.entries(fields)
        .map(([k, v]) => `${k}=${formatValue(v)}`)
        .join(" ")
    : "";
  CONSOLE[level](`${level.toUpperCase().padEnd(5)} ${event}${rendered ? ` ${rendered}` : ""}`);
}

export const logger = {
  debug: (event: string, fields?: Record<string, unknown>) => emit("debug", event, fields),
  info: (event: string, fields?: Record<string, unknown>) => emit("info", event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => emit("warn", event, fields),
  error: (event: string, fields?: Record<string, unknown>) => emit("error", event, fields),
};
