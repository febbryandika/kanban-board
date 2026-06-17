import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { cards, columns } from "@/db/schema";
import { requireMember, errorResponse } from "@/lib/auth";
import { withApiLogging } from "@/lib/api-logging";
import { keyForAppend } from "@/lib/fractional";
import { createCardSchema } from "@/lib/validations";

export const POST = withApiLogging("cards.create", createCard);

/** POST create a card at the end of its column. Membership-gated via the
 * column's board. */
async function createCard(req: Request) {
  try {
    const parsed = createCardSchema.safeParse(await req.json());
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

    const { columnId, title, description } = parsed.data;

    const [column] = await db
      .select({ boardId: columns.boardId })
      .from(columns)
      .where(eq(columns.id, columnId))
      .limit(1);
    if (!column) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Column not found" } },
        { status: 404 },
      );
    }
    await requireMember(column.boardId);

    // Append after the current last card (SPEC §3.4 — only the new row is written).
    const existing = await db
      .select({ sortOrder: cards.sortOrder })
      .from(cards)
      .where(eq(cards.columnId, columnId))
      .orderBy(asc(cards.sortOrder));
    const sortOrder = keyForAppend(existing.at(-1)?.sortOrder ?? null);

    const [card] = await db
      .insert(cards)
      .values({ columnId, title, description: description ?? null, sortOrder })
      .returning();

    return NextResponse.json(card, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
