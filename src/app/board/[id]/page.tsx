import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { KanbanBoard } from "@/components/board/kanban-board";

/** Board detail page. Lives outside the `(app)` group, so it guards auth here;
 * membership is enforced by `GET /api/boards/:id` (consumed via `useBoard`). */
export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  return <KanbanBoard boardId={id} />;
}
