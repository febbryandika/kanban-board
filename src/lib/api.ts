/** Client-side fetch helper that surfaces the standard
 * `{ error: { code, message } }` response as a typed error, so hooks and
 * components can branch on `status`/`code` for structured error handling. */

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchJson<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(
      res.status,
      body?.error?.code ?? "UNKNOWN",
      body?.error?.message ?? "Request failed",
    );
  }
  return res.json() as Promise<T>;
}
