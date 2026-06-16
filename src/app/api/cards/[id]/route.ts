import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { cards, columns } from "@/db/schema";
import { errorResponse } from "@/lib/auth";
import { loadCardForMember } from "@/lib/cards";
import { updateCardSchema } from "@/lib/validations";

/** PATCH move a card (columnId + sortOrder). Only the moved row is written. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { card, boardId, notFound } = await loadCardForMember(id);
    if (notFound) return notFound;

    const parsed = updateCardSchema.safeParse(await req.json());
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

    // A card never moves across boards: the target column must live on the same
    // board, so a member can't inject a card into another board's column.
    if (parsed.data.columnId && parsed.data.columnId !== card.columnId) {
      const [target] = await db
        .select({ boardId: columns.boardId })
        .from(columns)
        .where(eq(columns.id, parsed.data.columnId))
        .limit(1);
      if (!target || target.boardId !== boardId) {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Target column not found" } },
          { status: 404 },
        );
      }
    }

    const [updated] = await db
      .update(cards)
      .set(parsed.data)
      .where(eq(cards.id, card.id))
      .returning();

    return NextResponse.json(updated);
  } catch (e) {
    return errorResponse(e);
  }
}
