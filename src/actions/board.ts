"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { boards, boardMembers, columns, user } from "@/db/schema";
import { requireSession, requireMember, requireOwner } from "@/lib/auth";
import {
  ok,
  fail,
  runAction,
  type ActionResult,
} from "@/lib/action-result";
import {
  createBoardSchema,
  renameBoardSchema,
  deleteBoardSchema,
  inviteMemberSchema,
} from "@/lib/validations";

/** Create a board and the owner membership row atomically. */
export async function createBoard(
  _prev: ActionResult<{ boardId: string }> | undefined,
  formData: FormData,
): Promise<ActionResult<{ boardId: string }>> {
  return runAction("board.create", async () => {
    const session = await requireSession();

    const parsed = createBoardSchema.safeParse({
      name: formData.get("name"),
      bgColor: formData.get("bgColor") ?? undefined,
    });
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const boardId = await db.transaction(async (tx) => {
      const [board] = await tx
        .insert(boards)
        .values({ name: parsed.data.name, bgColor: parsed.data.bgColor })
        .returning({ id: boards.id });
      await tx.insert(boardMembers).values({
        boardId: board.id,
        userId: session.user.id,
        role: "owner",
      });
      // Seed the default columns (SPEC §1). "a0"/"a1"/"a2" are the keys
      // generateKeyBetween produces sequentially, so future inserts/moves chain
      // off them cleanly without a fractional helper here.
      await tx.insert(columns).values([
        { boardId: board.id, name: "To Do", sortOrder: "a0" },
        { boardId: board.id, name: "In Progress", sortOrder: "a1" },
        { boardId: board.id, name: "Done", sortOrder: "a2" },
      ]);
      return board.id;
    });

    revalidatePath("/boards");
    return ok({ boardId });
  });
}

/** Rename a board. Any member may rename (SPEC §5.2 marks only delete/invite owner-only). */
export async function renameBoard(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return runAction("board.rename", async () => {
    const parsed = renameBoardSchema.safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
    });
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
    }

    await requireMember(parsed.data.id);
    await db
      .update(boards)
      .set({ name: parsed.data.name })
      .where(eq(boards.id, parsed.data.id));

    revalidatePath("/boards");
    return ok(undefined);
  });
}

/** Delete a board (owner only). FK cascades remove columns, cards, labels, members, comments. */
export async function deleteBoard(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return runAction("board.delete", async () => {
    const parsed = deleteBoardSchema.safeParse({ id: formData.get("id") });
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
    }

    await requireOwner(parsed.data.id);
    await db.delete(boards).where(eq(boards.id, parsed.data.id));

    revalidatePath("/boards");
    return ok(undefined);
  });
}

/** Invite an existing user to a board by email (owner only). */
export async function inviteMember(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  return runAction("board.inviteMember", async () => {
    const parsed = inviteMemberSchema.safeParse({
      boardId: formData.get("boardId"),
      email: formData.get("email"),
    });
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const { session } = await requireOwner(parsed.data.boardId);

    const [invitee] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, parsed.data.email))
      .limit(1);
    if (!invitee) {
      return fail("USER_NOT_FOUND", "No account found for that email");
    }
    if (invitee.id === session.user.id) {
      return fail("SELF_INVITE", "You are already on this board");
    }

    const [existing] = await db
      .select({ userId: boardMembers.userId })
      .from(boardMembers)
      .where(
        and(
          eq(boardMembers.boardId, parsed.data.boardId),
          eq(boardMembers.userId, invitee.id),
        ),
      )
      .limit(1);
    if (existing) {
      return fail("ALREADY_MEMBER", "That user is already a member");
    }

    try {
      await db.insert(boardMembers).values({
        boardId: parsed.data.boardId,
        userId: invitee.id,
        role: "member",
      });
    } catch (e) {
      // Defensive: race on the uq_board_member unique constraint.
      if (
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        (e as { code?: string }).code === "23505"
      ) {
        return fail("ALREADY_MEMBER", "That user is already a member");
      }
      throw e;
    }

    revalidatePath("/boards");
    return ok(undefined);
  });
}
