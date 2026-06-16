import type { BoardDetail } from "@/types/board";

/** Apply a column reorder to the cached board: set the moved column's sortOrder
 * and re-sort. Pure and side-effect free so it can be unit-tested (SPEC §10) and
 * reused by the optimistic move mutation. */
export function optimisticallyMoveColumn(
  board: BoardDetail,
  move: { columnId: string; sortOrder: string },
): BoardDetail {
  const columns = board.columns
    .map((c) =>
      c.id === move.columnId ? { ...c, sortOrder: move.sortOrder } : c,
    )
    .sort((a, b) =>
      a.sortOrder < b.sortOrder ? -1 : a.sortOrder > b.sortOrder ? 1 : 0,
    );
  return { ...board, columns };
}
