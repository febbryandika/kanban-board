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

/** A board member, resolved against the Better Auth user table, so the UI can
 * render assignee names/avatars and the assignee picker. */
export type BoardMemberInfo = {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: "owner" | "member";
};

export type BoardDetail = {
  id: string;
  name: string;
  bgColor: string;
  role: "owner" | "member";
  currentUserId: string;
  labels: BoardLabel[];
  members: BoardMemberInfo[];
  columns: BoardColumnWithCards[];
};

/** A card comment with its author's name resolved, as returned by
 * `GET /api/cards/:id/comments` (chronological). */
export type CardComment = {
  id: string;
  cardId: string;
  userId: string;
  authorName: string;
  content: string;
  createdAt: string;
};
