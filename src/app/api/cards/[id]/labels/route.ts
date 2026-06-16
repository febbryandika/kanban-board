import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { cardLabels, labels } from "@/db/schema";
import { errorResponse } from "@/lib/auth";
import { loadCardForMember } from "@/lib/cards";
import { cardLabelSchema } from "@/lib/validations";

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "23505"
  );
}

/** POST apply a label to a card. The label must belong to the card's board. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { boardId, notFound } = await loadCardForMember(id);
    if (notFound) return notFound;

    const parsed = cardLabelSchema.safeParse(await req.json());
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

    const [label] = await db
      .select({ id: labels.id })
      .from(labels)
      .where(
        and(eq(labels.id, parsed.data.labelId), eq(labels.boardId, boardId)),
      )
      .limit(1);
    if (!label) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Label not found" } },
        { status: 404 },
      );
    }

    try {
      await db
        .insert(cardLabels)
        .values({ cardId: id, labelId: parsed.data.labelId });
    } catch (e) {
      // uq_card_label race: the label is already applied — treat as success.
      if (!isUniqueViolation(e)) throw e;
    }

    return NextResponse.json({ cardId: id, labelId: parsed.data.labelId });
  } catch (e) {
    return errorResponse(e);
  }
}

/** DELETE remove a label from a card. */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { notFound } = await loadCardForMember(id);
    if (notFound) return notFound;

    const parsed = cardLabelSchema.safeParse(await req.json());
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

    await db
      .delete(cardLabels)
      .where(
        and(
          eq(cardLabels.cardId, id),
          eq(cardLabels.labelId, parsed.data.labelId),
        ),
      );

    return NextResponse.json({ cardId: id, labelId: parsed.data.labelId });
  } catch (e) {
    return errorResponse(e);
  }
}
