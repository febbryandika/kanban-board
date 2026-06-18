import { describe, it, expect } from "vitest";

import {
  optimisticallyMoveCard,
  optimisticallyMoveColumn,
  optimisticallyUpdateCard,
  optimisticallyAddCardLabel,
  optimisticallyRemoveCardLabel,
} from "@/lib/optimistic";
import type { BoardDetail, BoardLabel } from "@/types/board";

const L1: BoardLabel = { id: "l1", name: "Bug", color: "#ff0000" };
const L2: BoardLabel = { id: "l2", name: "Feature", color: "#00ff00" };

/** Fixture: 3 columns (c1/c2/c3) so identity-preservation has an untouched column.
 * c1: k1(a0,[L1]) k2(a1) · c2: k3(a0) · c3: k4(a0). */
function makeBoard(): BoardDetail {
  return {
    id: "b1",
    name: "Board",
    bgColor: "#6366f1",
    role: "owner",
    currentUserId: "u1",
    labels: [L1, L2],
    members: [
      { userId: "u1", name: "Owner", email: "o@x.com", image: null, role: "owner" },
    ],
    columns: [
      {
        id: "c1",
        name: "To Do",
        sortOrder: "a0",
        cards: [
          { id: "k1", columnId: "c1", title: "K1", description: null, dueDate: null, sortOrder: "a0", assigneeId: null, labels: [L1] },
          { id: "k2", columnId: "c1", title: "K2", description: null, dueDate: null, sortOrder: "a1", assigneeId: null, labels: [] },
        ],
      },
      {
        id: "c2",
        name: "Doing",
        sortOrder: "a1",
        cards: [
          { id: "k3", columnId: "c2", title: "K3", description: null, dueDate: null, sortOrder: "a0", assigneeId: null, labels: [] },
        ],
      },
      {
        id: "c3",
        name: "Done",
        sortOrder: "a2",
        cards: [
          { id: "k4", columnId: "c3", title: "K4", description: null, dueDate: null, sortOrder: "a0", assigneeId: null, labels: [] },
        ],
      },
    ],
  };
}

const col = (b: BoardDetail, id: string) => b.columns.find((c) => c.id === id)!;
const findCard = (b: BoardDetail, id: string) =>
  b.columns.flatMap((c) => c.cards).find((c) => c.id === id)!;

describe("optimisticallyMoveCard", () => {
  it("moves a card across columns and re-sorts the target", () => {
    const board = makeBoard();
    const result = optimisticallyMoveCard(board, { cardId: "k1", columnId: "c2", sortOrder: "a1" });

    expect(col(result, "c1").cards.map((c) => c.id)).toEqual(["k2"]);
    expect(col(result, "c2").cards.map((c) => c.id)).toEqual(["k3", "k1"]); // a0 < a1
    const moved = findCard(result, "k1");
    expect(moved.columnId).toBe("c2");
    expect(moved.sortOrder).toBe("a1");
  });

  it("reorders within the same column", () => {
    const board = makeBoard();
    const result = optimisticallyMoveCard(board, { cardId: "k1", columnId: "c1", sortOrder: "a2" });
    expect(col(result, "c1").cards.map((c) => c.id)).toEqual(["k2", "k1"]); // a1 < a2
  });

  it("returns the board unchanged for an unknown card id", () => {
    const board = makeBoard();
    expect(optimisticallyMoveCard(board, { cardId: "nope", columnId: "c2", sortOrder: "a9" })).toBe(board);
  });

  it("never renumbers sibling sortOrder values", () => {
    const board = makeBoard();
    const result = optimisticallyMoveCard(board, { cardId: "k1", columnId: "c2", sortOrder: "a1" });
    expect(findCard(result, "k2").sortOrder).toBe("a1"); // unchanged
    expect(findCard(result, "k3").sortOrder).toBe("a0"); // unchanged
  });

  it("keeps untouched columns referentially identical (memoization)", () => {
    const board = makeBoard();
    const result = optimisticallyMoveCard(board, { cardId: "k1", columnId: "c2", sortOrder: "a1" });
    expect(result.columns[2]).toBe(board.columns[2]); // c3 untouched
  });

  it("does not mutate the input board", () => {
    const board = makeBoard();
    const snapshot = structuredClone(board);
    optimisticallyMoveCard(board, { cardId: "k1", columnId: "c2", sortOrder: "a1" });
    expect(board).toEqual(snapshot);
  });
});

describe("optimisticallyMoveColumn", () => {
  it("updates the moved column's sortOrder and re-sorts", () => {
    const board = makeBoard();
    const result = optimisticallyMoveColumn(board, { columnId: "c3", sortOrder: "a0h" }); // a0 < a0h < a1
    expect(result.columns.map((c) => c.id)).toEqual(["c1", "c3", "c2"]);
    expect(col(result, "c3").sortOrder).toBe("a0h");
  });
});

describe("optimisticallyUpdateCard", () => {
  it("patches card fields", () => {
    const board = makeBoard();
    const result = optimisticallyUpdateCard(board, { cardId: "k1", title: "Renamed", assigneeId: "u1" });
    const card = findCard(result, "k1");
    expect(card.title).toBe("Renamed");
    expect(card.assigneeId).toBe("u1");
  });

  it("keeps columns without the card referentially identical", () => {
    const board = makeBoard();
    const result = optimisticallyUpdateCard(board, { cardId: "k1", title: "Renamed" });
    expect(result.columns[1]).toBe(board.columns[1]); // c2
    expect(result.columns[2]).toBe(board.columns[2]); // c3
  });
});

describe("optimisticallyAddCardLabel", () => {
  it("adds a label to the card", () => {
    const board = makeBoard();
    const result = optimisticallyAddCardLabel(board, { cardId: "k1", label: L2 });
    expect(findCard(result, "k1").labels.map((l) => l.id)).toEqual(["l1", "l2"]);
  });

  it("is a no-op when the label is already applied", () => {
    const board = makeBoard();
    const result = optimisticallyAddCardLabel(board, { cardId: "k1", label: L1 });
    expect(findCard(result, "k1").labels.map((l) => l.id)).toEqual(["l1"]);
  });
});

describe("optimisticallyRemoveCardLabel", () => {
  it("removes a label by id", () => {
    const board = makeBoard();
    const result = optimisticallyRemoveCardLabel(board, { cardId: "k1", labelId: "l1" });
    expect(findCard(result, "k1").labels).toEqual([]);
  });
});
