import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { boardMembers, cards, columns } from "@/db/schema";
import { errorResponse } from "@/lib/auth";
import { loadCardForMember } from "@/lib/cards";
import { updateCardSchema } from "@/lib/validations";

/** PATCH a card: either a move (columnId + sortOrder) or modal field edits
 * (title / description / dueDate / assignee). Only the targeted row is written. */
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

    // An assignee must be a member of this board.
    if (parsed.data.assigneeId) {
      const [member] = await db
        .select({ userId: boardMembers.userId })
        .from(boardMembers)
        .where(
          and(
            eq(boardMembers.boardId, boardId),
            eq(boardMembers.userId, parsed.data.assigneeId),
          ),
        )
        .limit(1);
      if (!member) {
        return NextResponse.json(
          {
            error: {
              code: "INVALID_ASSIGNEE",
              message: "Assignee is not a member of this board",
            },
          },
          { status: 400 },
        );
      }
    }

    // `dueDate` arrives as an ISO string (or null); Drizzle wants a Date. Every
    // other parsed key is a `cards` column and passes through untouched.
    const { dueDate, ...rest } = parsed.data;
    const updateSet: Partial<typeof cards.$inferInsert> = { ...rest };
    if (dueDate !== undefined) {
      updateSet.dueDate = dueDate === null ? null : new Date(dueDate);
    }

    const [updated] = await db
      .update(cards)
      .set(updateSet)
      .where(eq(cards.id, card.id))
      .returning();

    return NextResponse.json(updated);
  } catch (e) {
    return errorResponse(e);
  }
}
