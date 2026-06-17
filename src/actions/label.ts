"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { labels, type Label } from "@/db/schema";
import { requireMember } from "@/lib/auth";
import {
  ok,
  fail,
  runAction,
  type ActionResult,
} from "@/lib/action-result";
import {
  createLabelSchema,
  updateLabelSchema,
  deleteLabelSchema,
  type CreateLabelInput,
  type UpdateLabelInput,
  type DeleteLabelInput,
} from "@/lib/validations";

/** Label CRUD is board-scoped and form-style, so it lives in Server Actions
 * (SPEC §5.2). Any board member may manage the shared label set. The board view
 * is client-rendered via TanStack Query, so callers invalidate `['board', id]`
 * after a successful action; `revalidatePath` covers any server-rendered surface. */

export async function createLabel(
  input: CreateLabelInput,
): Promise<ActionResult<Label>> {
  return runAction(async () => {
    const parsed = createLabelSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
    }

    await requireMember(parsed.data.boardId);
    const [label] = await db
      .insert(labels)
      .values({
        boardId: parsed.data.boardId,
        name: parsed.data.name,
        color: parsed.data.color,
      })
      .returning();

    revalidatePath(`/board/${parsed.data.boardId}`);
    return ok(label);
  });
}

export async function updateLabel(
  input: UpdateLabelInput,
): Promise<ActionResult<Label>> {
  return runAction(async () => {
    const parsed = updateLabelSchema.safeParse(input);
    if (!parsed.success) {
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const [existing] = await db
      .select({ boardId: labels.boardId })
      .from(labels)
      .where(eq(labels.id, parsed.data.id))
      .limit(1);
    if (!existing) return fail("NOT_FOUND", "Label not found");

    await requireMember(existing.boardId);
    const [label] = await db
      .update(labels)
      .set({ name: parsed.data.name, color: parsed.data.color })
      .where(eq(labels.id, parsed.data.id))
      .returning();

    revalidatePath(`/board/${existing.boardId}`);
    return ok(label);
  });
}

export async function deleteLabel(
  input: DeleteLabelInput,
): Promise<ActionResult> {
  return runAction(async () => {
    const parsed = deleteLabelSchema.safeParse(input);
    if (!parsed.success)
      return fail("VALIDATION", parsed.error.issues[0]?.message ?? "Invalid input");

    const [existing] = await db
      .select({ boardId: labels.boardId })
      .from(labels)
      .where(eq(labels.id, parsed.data.id))
      .limit(1);
    if (!existing) return fail("NOT_FOUND", "Label not found");

    await requireMember(existing.boardId);
    // FK cascade removes the card_labels rows for this label.
    await db.delete(labels).where(eq(labels.id, parsed.data.id));

    revalidatePath(`/board/${existing.boardId}`);
    return ok(undefined);
  });
}
