import { eq, inArray } from "drizzle-orm";
import Link from "next/link";

import { db } from "@/db";
import { boardMembers, boards, user } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { BoardCard } from "@/components/boards/board-card";
import type { BoardMemberView } from "@/components/boards/types";

export default async function BoardsPage() {
  const session = await requireSession();
  const userId = session.user.id;

  // Boards the current user belongs to, with their own role.
  const rows = await db
    .select({
      id: boards.id,
      name: boards.name,
      bgColor: boards.bgColor,
      role: boardMembers.role,
    })
    .from(boardMembers)
    .innerJoin(boards, eq(boardMembers.boardId, boards.id))
    .where(eq(boardMembers.userId, userId));

  // All members of those boards (for the manage-members dialog).
  const boardIds = rows.map((r) => r.id);
  const memberRows = boardIds.length
    ? await db
        .select({
          boardId: boardMembers.boardId,
          userId: boardMembers.userId,
          role: boardMembers.role,
          name: user.name,
          email: user.email,
        })
        .from(boardMembers)
        .innerJoin(user, eq(boardMembers.userId, user.id))
        .where(inArray(boardMembers.boardId, boardIds))
    : [];

  const membersByBoard = new Map<string, BoardMemberView[]>();
  for (const m of memberRows) {
    const list = membersByBoard.get(m.boardId) ?? [];
    list.push(m);
    membersByBoard.set(m.boardId, list);
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Boards</h1>
        <div className="flex items-center gap-2">
          <Button nativeButton={false} render={<Link href="/boards/new" />}>
            New board
          </Button>
          <LogoutButton />
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">
            You don&apos;t have any boards yet.
          </p>
          <Button nativeButton={false} render={<Link href="/boards/new" />}>
            Create your first board
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((b) => (
            <li key={b.id}>
              <BoardCard
                board={b}
                members={membersByBoard.get(b.id) ?? []}
                currentUserId={userId}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
