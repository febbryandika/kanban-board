import type { BoardCardItem, BoardDetail, BoardLabel } from "@/types/board";

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

/** Card field edits (title / description / dueDate / assignee) for the modal's
 * optimistic update. Only the card's column changes identity; others are kept
 * for memoization. Pure (SPEC §10). */
export function optimisticallyUpdateCard(
  board: BoardDetail,
  patch: { cardId: string } & Partial<
    Pick<BoardCardItem, "title" | "description" | "dueDate" | "assigneeId">
  >,
): BoardDetail {
  const { cardId, ...fields } = patch;
  const columns = board.columns.map((col) => {
    if (!col.cards.some((c) => c.id === cardId)) return col;
    return {
      ...col,
      cards: col.cards.map((c) => (c.id === cardId ? { ...c, ...fields } : c)),
    };
  });
  return { ...board, columns };
}

/** Add a label to a card optimistically (no-op if already applied). Pure. */
export function optimisticallyAddCardLabel(
  board: BoardDetail,
  input: { cardId: string; label: BoardLabel },
): BoardDetail {
  const columns = board.columns.map((col) => {
    if (!col.cards.some((c) => c.id === input.cardId)) return col;
    return {
      ...col,
      cards: col.cards.map((c) =>
        c.id === input.cardId && !c.labels.some((l) => l.id === input.label.id)
          ? { ...c, labels: [...c.labels, input.label] }
          : c,
      ),
    };
  });
  return { ...board, columns };
}

/** Remove a label from a card optimistically. Pure. */
export function optimisticallyRemoveCardLabel(
  board: BoardDetail,
  input: { cardId: string; labelId: string },
): BoardDetail {
  const columns = board.columns.map((col) => {
    if (!col.cards.some((c) => c.id === input.cardId)) return col;
    return {
      ...col,
      cards: col.cards.map((c) =>
        c.id === input.cardId
          ? { ...c, labels: c.labels.filter((l) => l.id !== input.labelId) }
          : c,
      ),
    };
  });
  return { ...board, columns };
}
