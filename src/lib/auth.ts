import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { boardMembers } from "@/db/schema";
import { env } from "@/lib/env";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  // Must be the last plugin so it can persist Set-Cookie headers in the
  // Next.js server context (Server Actions / Route Handlers).
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;

/** Structured auth/authorization failure carrying an HTTP status + error code. */
export class AuthError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** Read the current session from request headers. Returns null when signed out. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

/** Require an authenticated session or throw a 401 AuthError. */
export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new AuthError("UNAUTHORIZED", "Authentication required", 401);
  }
  return session;
}

/**
 * Require the current user to be a member of `boardId`.
 * Throws 401 when signed out, 403 when not a member.
 * Returns the session and the membership row (with `role`) so callers can
 * perform owner-only checks without a second query.
 */
export async function requireMember(boardId: string) {
  const session = await requireSession();
  const [membership] = await db
    .select()
    .from(boardMembers)
    .where(
      and(
        eq(boardMembers.boardId, boardId),
        eq(boardMembers.userId, session.user.id),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new AuthError("FORBIDDEN", "You are not a member of this board", 403);
  }

  return { session, membership };
}

/** Map an error to the standard `{ error: { code, message } }` JSON response. */
export function errorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }
  console.error("Unhandled API error:", error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Something went wrong" } },
    { status: 500 },
  );
}
