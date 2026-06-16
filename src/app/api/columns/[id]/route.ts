import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { columns } from "@/db/schema";
import { requireSession, requireMember, errorResponse } from "@/lib/auth";
import { updateColumnSchema } from "@/lib/validations";

/** Look up a column and gate on board membership. Returns the column or a 404
 * NextResponse. Throws AuthError (handled by the caller's errorResponse).
 * Requires a session first so an unauthenticated caller can't probe column
 * existence (always 401, never 404). */
async function loadColumnForMember(id: string) {
  await requireSession();
  const [column] = await db
    .select()
    .from(columns)
    .where(eq(columns.id, id))
    .limit(1);
  if (!column) {
    return {
      column: null,
      notFound: NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Column not found" } },
        { status: 404 },
      ),
    };
  }
  await requireMember(column.boardId);
  return { column, notFound: null };
}

/** PATCH rename and/or reorder a column. Only the moved row's sortOrder is written. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { column, notFound } = await loadColumnForMember(id);
    if (notFound) return notFound;

    const parsed = updateColumnSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION",
            message: parsed.error.issues[0]?.message ?? "Invalid input",
          },
        },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(columns)
      .set(parsed.data)
      .where(eq(columns.id, column.id))
      .returning();

    return NextResponse.json(updated);
  } catch (e) {
    return errorResponse(e);
  }
}

/** DELETE a column. FK cascade removes its cards, card_labels, and comments. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { column, notFound } = await loadColumnForMember(id);
    if (notFound) return notFound;

    await db.delete(columns).where(eq(columns.id, column.id));

    return NextResponse.json({ id: column.id });
  } catch (e) {
    return errorResponse(e);
  }
}
