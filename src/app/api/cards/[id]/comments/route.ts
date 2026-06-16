import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { comments, user } from "@/db/schema";
import { errorResponse } from "@/lib/auth";
import { loadCardForMember } from "@/lib/cards";
import { createCommentSchema } from "@/lib/validations";
import type { CardComment } from "@/types/board";

/** GET a card's comments, oldest-first (chronological, SPEC §3.3 / idx_comment_card). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { notFound } = await loadCardForMember(id);
    if (notFound) return notFound;

    const rows = await db
      .select({
        id: comments.id,
        cardId: comments.cardId,
        userId: comments.userId,
        authorName: user.name,
        content: comments.content,
        createdAt: comments.createdAt,
      })
      .from(comments)
      .innerJoin(user, eq(comments.userId, user.id))
      .where(eq(comments.cardId, id))
      .orderBy(asc(comments.createdAt));

    const payload: CardComment[] = rows.map((r) => ({
      id: r.id,
      cardId: r.cardId,
      userId: r.userId,
      authorName: r.authorName,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json(payload);
  } catch (e) {
    return errorResponse(e);
  }
}

/** POST a new comment on a card, authored by the current user. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { session, notFound } = await loadCardForMember(id);
    if (notFound) return notFound;

    const parsed = createCommentSchema.safeParse(await req.json());
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

    const [created] = await db
      .insert(comments)
      .values({
        cardId: id,
        userId: session.user.id,
        content: parsed.data.content,
      })
      .returning();

    const payload: CardComment = {
      id: created.id,
      cardId: created.cardId,
      userId: created.userId,
      authorName: session.user.name,
      content: created.content,
      createdAt: created.createdAt.toISOString(),
    };

    return NextResponse.json(payload, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}

/** DELETE a comment (`?commentId=`). The author or the board owner may delete it. */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { session, membership, notFound } = await loadCardForMember(id);
    if (notFound) return notFound;

    const commentId = new URL(req.url).searchParams.get("commentId");
    if (!commentId) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "commentId is required" } },
        { status: 400 },
      );
    }

    const [comment] = await db
      .select()
      .from(comments)
      .where(and(eq(comments.id, commentId), eq(comments.cardId, id)))
      .limit(1);
    if (!comment) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Comment not found" } },
        { status: 404 },
      );
    }

    // Author or board owner only (SPEC §8).
    if (comment.userId !== session.user.id && membership.role !== "owner") {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "You can only delete your own comments",
          },
        },
        { status: 403 },
      );
    }

    await db.delete(comments).where(eq(comments.id, commentId));
    return NextResponse.json({ id: commentId });
  } catch (e) {
    return errorResponse(e);
  }
}
