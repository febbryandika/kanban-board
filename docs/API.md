# API & Server Actions Reference

The backend uses **two server patterns**, each chosen deliberately:

- **Route Handlers** (`src/app/api/**`) — board reads and *interactive* mutations (card/column create, move, archive, comments, labels). Consumed by **TanStack Query** hooks so drag-and-drop gets optimistic updates with rollback.
- **Server Actions** (`src/actions/**`) — *form-style* mutations (create/rename/delete board, member management, label CRUD). Each validates with Zod, checks membership/ownership, then calls `revalidatePath`.

**Authorization.** Every board/column/card/comment mutation calls `requireMember(boardId)` — the user must have a `board_members` row for the target board. Owner-only operations (delete board, manage members) additionally use `requireOwner(boardId)`. There are **no public boards**.

All validation rules live in [`src/lib/validations.ts`](../src/lib/validations.ts) and are shared across handlers, actions, and client forms.

## Error response shape

Every Route Handler returns errors as:

```json
{ "error": { "code": "string", "message": "string" } }
```

| Code | Status | Meaning |
| --- | --- | --- |
| `VALIDATION` | 400 | Body failed the Zod schema |
| `UNAUTHORIZED` | 401 | No authenticated session |
| `FORBIDDEN` | 403 | Authenticated but not a member / not the owner |
| `NOT_FOUND` | 404 | Board, column, card, label, or comment not found |
| `RATE_LIMITED` | 429 | AI endpoint per-user limit hit (sets `Retry-After`) |
| `AI_TIMEOUT` | 504 | AI generation exceeded the 15s budget |
| `AI_GENERATION_FAILED` | 502 | AI returned malformed output or the provider errored |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

Server Actions don't throw HTTP errors; they return a discriminated `ActionResult` (see [Server Actions](#server-actions)).

---

## Route Handlers

All require a session + board membership unless noted. Paths are under `/api`.

### `GET /api/boards/:id`

Full board in one payload: columns → cards → labels, plus members and the caller's role. Archived cards are excluded.

**Response `200`** — [`BoardDetail`](../src/types/board.ts) (timestamps are ISO strings):

```ts
{
  id: string;
  name: string;
  bgColor: string;
  role: "owner" | "member";        // the caller's role
  currentUserId: string;
  labels:  { id; name; color }[];
  members: { userId; name; email; image; role }[];
  columns: {
    id; name; sortOrder;
    cards: {
      id; columnId; title; description; dueDate;
      sortOrder; assigneeId; labels: { id; name; color }[];
    }[];
  }[];
}
```

### `POST /api/columns`

Create a column, appended after the last one (`sortOrder` via `keyForAppend`).

- **Body** (`createColumnSchema`): `{ boardId: string, name: string (1–40) }`
- **Response `201`**: `{ id, boardId, name, sortOrder }`

### `PATCH /api/columns/:id`

Rename and/or reorder a column. At least one field required.

- **Body** (`updateColumnSchema`): `{ name?: string (1–40), sortOrder?: string }`
- **Response `200`**: the updated column

### `DELETE /api/columns/:id`

Delete a column. FK cascade removes its cards (and their comments + label links).

- **Response `200`**: `{ id }`

### `POST /api/cards`

Create a card, appended at the end of its column.

- **Body** (`createCardSchema`): `{ columnId: string, title: string (1–200), description?: string (≤5000) }`
- **Response `201`**: the created card row

### `PATCH /api/cards/:id`

Dual-purpose: a **move** (`columnId` + `sortOrder`) or **field edits** from the modal (`title`, `description`, `dueDate`, `assigneeId`). At least one field required; only the targeted row is written.

- **Body** (`updateCardSchema`, all optional):
  ```ts
  {
    columnId?: string;
    sortOrder?: string;
    title?: string;                       // 1–200
    description?: string | null;          // ≤5000, null clears
    dueDate?: string | null;              // ISO datetime, null clears
    assigneeId?: string | null;           // null clears
  }
  ```
- **Guards**: a new `columnId` must belong to the **same board**; a new `assigneeId` must be a board member.
- **Response `200`**: the updated card

### `PATCH /api/cards/:id/archive`

Soft-delete toggle. Archived cards are hidden from `GET /api/boards/:id` but never hard-deleted.

- **Body** (`archiveCardSchema`): `{ isArchived: boolean }`
- **Response `200`**: the updated card

### `GET /api/cards/:id/comments`

List a card's comments, oldest-first, with author names resolved.

- **Response `200`**: [`CardComment[]`](../src/types/board.ts) — `{ id, cardId, userId, authorName, content, createdAt }[]`

### `POST /api/cards/:id/comments`

Add a comment authored by the current user.

- **Body** (`createCommentSchema`): `{ content: string (1–2000) }`
- **Response `201`**: the created `CardComment`

### `DELETE /api/cards/:id/comments?commentId=…`

Delete a comment. Allowed for the **comment author** or the **board owner** (moderation).

- **Query**: `commentId` (required)
- **Response `200`**: `{ id }` — or `403` if neither author nor owner

### `POST /api/cards/:id/labels`

Apply a board label to the card. The label must belong to the card's board. Re-applying an existing label is idempotent (the `uq_card_label` race is treated as success).

- **Body** (`cardLabelSchema`): `{ labelId: string }`
- **Response `200`**: `{ cardId, labelId }`

### `DELETE /api/cards/:id/labels`

Remove a label from the card.

- **Body** (`cardLabelSchema`): `{ labelId: string }`
- **Response `200`**: `{ cardId, labelId }`

### `POST /api/ai/card-generate`

Turn a rough idea into a card draft. **Session-required but not board-gated** — it touches no board data and only returns a draft to pre-fill the add-card form (never auto-creates a card). Model: `gpt-4.1-mini` via the Vercel AI SDK `generateObject`. 15s timeout; per-user rate limit.

- **Body** (`aiCardGenerateSchema`): `{ idea: string (1–500), boardContext?: string (≤500) }`
- **Response `200`** (`aiCardOutputSchema`): `{ title: string, description: string, acceptanceCriteria: string[] (≤5) }`
- **Errors**: `401` · `400 VALIDATION` · `429 RATE_LIMITED` · `504 AI_TIMEOUT` · `502 AI_GENERATION_FAILED`

---

## Server Actions

Defined in [`src/actions/board.ts`](../src/actions/board.ts) and [`src/actions/label.ts`](../src/actions/label.ts). Each returns an `ActionResult`:

```ts
type ActionResult<T> =
  | { ok: true;  data: T }
  | { ok: false; error: { code: string; message: string } };
```

Board/member actions take `FormData`; label actions take a typed input object.

| Action | Auth | Input (schema) | Effect | Revalidates |
| --- | --- | --- | --- | --- |
| `createBoard` | session | `createBoardSchema` — `name (1–60)`, `bgColor (hex)` | Creates board + owner membership, seeds **To Do / In Progress / Done** | `/boards` |
| `renameBoard` | member | `renameBoardSchema` — `id`, `name (1–60)` | Renames a board | `/boards` |
| `deleteBoard` | **owner** | `deleteBoardSchema` — `id` | Deletes board (cascades everything) | `/boards` |
| `inviteMember` | **owner** | `inviteMemberSchema` — `boardId`, `email` | Adds an existing user by email. Errors: `USER_NOT_FOUND`, `SELF_INVITE`, `ALREADY_MEMBER` | `/boards` |
| `removeMember` | **owner** | `removeMemberSchema` — `boardId`, `userId` | Removes a member. Errors: `NOT_MEMBER`, `CANNOT_REMOVE_OWNER` | `/boards` |
| `leaveBoard` | member | `leaveBoardSchema` — `boardId` | Leave a board you were invited to. Error: `OWNER_CANNOT_LEAVE` | `/boards` |
| `createLabel` | member | `createLabelSchema` — `boardId`, `name (1–30)`, `color (hex)` | Creates a board label | `/board/:boardId` |
| `updateLabel` | member | `updateLabelSchema` — `id`, `name (1–30)`, `color (hex)` | Updates a label | `/board/:boardId` |
| `deleteLabel` | member | `deleteLabelSchema` — `id` | Deletes a label (cascades `card_labels`) | `/board/:boardId` |

> The owner cannot be invited again, removed, or leave — they must delete the board to step down, so a board always has exactly one owner.
