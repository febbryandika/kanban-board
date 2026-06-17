import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { cards } from "@/db/schema";
import { errorResponse } from "@/lib/auth";
import { withApiLogging } from "@/lib/api-logging";
import { loadCardForMember } from "@/lib/cards";
import { archiveCardSchema } from "@/lib/validations";

export const PATCH = withApiLogging("cards.archive", archiveCard);

/** PATCH archive/unarchive a card (soft delete via `isArchived`). */
async function archiveCard(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { card, notFound } = await loadCardForMember(id);
    if (notFound) return notFound;

    const parsed = archiveCardSchema.safeParse(await req.json());
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
      .update(cards)
      .set({ isArchived: parsed.data.isArchived })
      .where(eq(cards.id, card.id))
      .returning();

    return NextResponse.json(updated);
  } catch (e) {
    return errorResponse(e);
  }
}
