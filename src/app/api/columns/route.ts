import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { columns } from "@/db/schema";
import { requireMember, errorResponse } from "@/lib/auth";
import { withApiLogging } from "@/lib/api-logging";
import { keyForAppend } from "@/lib/fractional";
import { createColumnSchema } from "@/lib/validations";

export const POST = withApiLogging("columns.create", createColumn);

/** POST create a column at the end of its board. Membership-gated. */
async function createColumn(req: Request) {
  try {
    const parsed = createColumnSchema.safeParse(await req.json());
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

    const { boardId, name } = parsed.data;
    await requireMember(boardId);

    // Append after the current last column (SPEC §3.4 — only the new row is written).
    const existing = await db
      .select({ sortOrder: columns.sortOrder })
      .from(columns)
      .where(eq(columns.boardId, boardId))
      .orderBy(asc(columns.sortOrder));
    const sortOrder = keyForAppend(existing.at(-1)?.sortOrder ?? null);

    const [column] = await db
      .insert(columns)
      .values({ boardId, name, sortOrder })
      .returning();

    return NextResponse.json(column, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
