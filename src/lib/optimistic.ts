import type { BoardCardItem, BoardDetail } from "@/types/board";

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

/** Apply a card move to the cached board: detach the card from its current
 * column, set its columnId + sortOrder, attach it to the target column, and
 * re-sort that column. One path handles same-column reorder and cross-column
 * moves; only the moved card's fields change, never siblings. Pure (SPEC §10). */
export function optimisticallyMoveCard(
  board: BoardDetail,
  move: { cardId: string; columnId: string; sortOrder: string },
): BoardDetail {
  let moved: BoardCardItem | undefined;
  for (const col of board.columns) {
    const found = col.cards.find((c) => c.id === move.cardId);
    if (found) {
      moved = found;
      break;
    }
  }
  if (!moved) return board; // unknown card id — no-op

  const updated: BoardCardItem = {
    ...moved,
    columnId: move.columnId,
    sortOrder: move.sortOrder,
  };

  const columns = board.columns.map((col) => {
    const without = col.cards.filter((c) => c.id !== move.cardId);
    if (col.id === move.columnId) {
      const cards = [...without, updated].sort((a, b) =>
        a.sortOrder < b.sortOrder ? -1 : a.sortOrder > b.sortOrder ? 1 : 0,
      );
      return { ...col, cards };
    }
    // Untouched columns keep their identity so memoized columns skip re-render.
    return without.length === col.cards.length ? col : { ...col, cards: without };
  });

  return { ...board, columns };
}
