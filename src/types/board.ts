/** Shape of the `GET /api/boards/:id` payload, shared by the route handler,
 * the `useBoard` hook, and the board components. JSON-serialized: timestamps
 * are ISO strings. Nested (board → columns → cards → labels) so the future
 * optimistic move reducer can relocate a card between column arrays. */

export type BoardLabel = { id: string; name: string; color: string };

export type BoardCardItem = {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  sortOrder: string;
  assigneeId: string | null;
  labels: BoardLabel[];
};

export type BoardColumnWithCards = {
  id: string;
  name: string;
  sortOrder: string;
  cards: BoardCardItem[];
};

export type BoardDetail = {
  id: string;
  name: string;
  bgColor: string;
  role: "owner" | "member";
  labels: BoardLabel[];
  columns: BoardColumnWithCards[];
};
