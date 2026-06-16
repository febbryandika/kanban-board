import { NextResponse } from "next/server";
import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { boards, cardLabels, cards, columns, labels } from "@/db/schema";
import { requireMember, errorResponse } from "@/lib/auth";
import type { BoardCardItem, BoardDetail, BoardLabel } from "@/types/board";

/** GET full board: columns → cards → labels. Membership-gated. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { membership } = await requireMember(id);

    const [board] = await db
      .select()
      .from(boards)
      .where(eq(boards.id, id))
      .limit(1);
    if (!board) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Board not found" } },
        { status: 404 },
      );
    }

    const boardColumns = await db
      .select()
      .from(columns)
      .where(eq(columns.boardId, id))
      .orderBy(asc(columns.sortOrder));
    const columnIds = boardColumns.map((c) => c.id);

    const boardCards = columnIds.length
      ? await db
          .select()
          .from(cards)
          .where(
            and(inArray(cards.columnId, columnIds), eq(cards.isArchived, false)),
          )
          .orderBy(asc(cards.sortOrder))
      : [];
    const cardIds = boardCards.map((c) => c.id);

    const boardLabels = await db
      .select()
      .from(labels)
      .where(eq(labels.boardId, id));

    const links = cardIds.length
      ? await db
          .select()
          .from(cardLabels)
          .where(inArray(cardLabels.cardId, cardIds))
      : [];

    // Index labels and group them onto cards / cards onto columns.
    const labelById = new Map<string, BoardLabel>(
      boardLabels.map((l) => [l.id, { id: l.id, name: l.name, color: l.color }]),
    );

    const labelsByCard = new Map<string, BoardLabel[]>();
    for (const link of links) {
      const label = labelById.get(link.labelId);
      if (!label) continue;
      const list = labelsByCard.get(link.cardId) ?? [];
      list.push(label);
      labelsByCard.set(link.cardId, list);
    }

    const cardsByColumn = new Map<string, BoardCardItem[]>();
    for (const card of boardCards) {
      const list = cardsByColumn.get(card.columnId) ?? [];
      list.push({
        id: card.id,
        columnId: card.columnId,
        title: card.title,
        description: card.description,
        dueDate: card.dueDate ? card.dueDate.toISOString() : null,
        sortOrder: card.sortOrder,
        assigneeId: card.assigneeId,
        labels: labelsByCard.get(card.id) ?? [],
      });
      cardsByColumn.set(card.columnId, list);
    }

    const payload: BoardDetail = {
      id: board.id,
      name: board.name,
      bgColor: board.bgColor,
      role: membership.role,
      labels: boardLabels.map((l) => ({
        id: l.id,
        name: l.name,
        color: l.color,
      })),
      columns: boardColumns.map((col) => ({
        id: col.id,
        name: col.name,
        sortOrder: col.sortOrder,
        cards: cardsByColumn.get(col.id) ?? [],
      })),
    };

    return NextResponse.json(payload);
  } catch (e) {
    return errorResponse(e);
  }
}
