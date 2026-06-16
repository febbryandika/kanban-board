import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { cards, columns } from "@/db/schema";
import { requireSession, requireMember } from "@/lib/auth";

/** Look up a card and gate on board membership. A card reaches its board only
 * through its column, so we join card → column for the boardId. Returns the card
 * + boardId, or a 404 NextResponse. Throws AuthError (handled by the caller's
 * errorResponse). Requires a session first so an unauthenticated caller can't
 * probe card existence (always 401, never 404). */
export async function loadCardForMember(id: string) {
  await requireSession();
  const [row] = await db
    .select({ card: cards, boardId: columns.boardId })
    .from(cards)
    .innerJoin(columns, eq(cards.columnId, columns.id))
    .where(eq(cards.id, id))
    .limit(1);
  if (!row) {
    return {
      card: null,
      boardId: null,
      session: null,
      membership: null,
      notFound: NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Card not found" } },
        { status: 404 },
      ),
    };
  }
  // `requireMember` returns the session + membership row (with `role`) so callers
  // can do ownership checks and stamp `userId`/`assigneeId` without re-querying.
  const { session, membership } = await requireMember(row.boardId);
  return {
    card: row.card,
    boardId: row.boardId,
    session,
    membership,
    notFound: null,
  };
}
