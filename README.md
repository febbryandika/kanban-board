# Kanban Board AI

A drag-and-drop task board (Trello-style) with AI-assisted card generation, built with Next.js 16 fullstack App Router.

## Features

- User authentication via Better Auth
- Create and manage boards (personal or shared with members)
- Columns per board with drag-and-drop reordering (default: To Do, In Progress, Done)
- Cards with title, description, labels, due dates, and assignee
- Drag-and-drop cards across columns using fractional indexing (no full-list renumbering)
- Card detail modal: description editor, comments, label picker, due date
- Board member invitations by email (owner/member roles, async sharing)
- AI feature: generate card description + acceptance criteria from a rough idea (Vercel AI SDK `generateObject`)

## Tech Stack

| Layer          | Technology                                              |
| -------------- | ------------------------------------------------------- |
| Framework      | Next.js 16 (App Router) — fullstack, single deployable  |
| UI             | React 19, Tailwind CSS v4, shadcn/ui                    |
| Server state   | TanStack Query v5 (optimistic drag-and-drop + rollback) |
| Client state   | Zustand v5 (modal / drag UI state)                      |
| Drag and drop  | @dnd-kit/core, @dnd-kit/sortable, fractional-indexing   |
| Authentication | Better Auth                                             |
| Database       | Neon PostgreSQL + Drizzle ORM                           |
| Validation     | Zod (shared between server and client)                  |
| AI             | Vercel AI SDK (`ai` + `@ai-sdk/openai`)                 |
| Tooling        | pnpm, TypeScript, ESLint, Prettier, Vitest, Playwright  |

## Architecture

Single Next.js fullstack application — no separate API server. Board data and interactive mutations (drag-and-drop) are handled by **Route Handlers** consumed by TanStack Query hooks, which gives clean optimistic updates with rollback. Form-style mutations (create/rename/delete board, invite member, label CRUD) are **Server Actions** with `revalidatePath`.

The board is accessed exclusively through `board_members` membership checks — there are no public boards.

```
src/
├── app/
│   ├── layout.tsx           # Root layout with Providers
│   ├── providers.tsx        # TanStack Query provider (client)
│   ├── (app)/               # Auth-gated board list + new board
│   ├── board/[id]/          # Kanban view (DnD, client component)
│   └── api/                 # Route Handlers (boards, columns, cards, AI)
├── actions/                 # Server Actions (board, label CRUD)
├── components/              # KanbanBoard, BoardColumn, CardItem, CardModal, ...
├── hooks/                   # TanStack Query hooks (useBoard, useMoveCard, ...)
├── db/                      # Drizzle schema + client
├── stores/
│   └── ui.ts                # Zustand UI store (activeCardId)
└── lib/
    ├── env.ts               # @t3-oss/env-nextjs validation
    ├── query-client.ts      # TanStack Query client factory
    ├── auth.ts              # Better Auth config + requireSession/requireMember
    ├── validations.ts       # Shared Zod schemas
    └── utils.ts             # cn() helper (shadcn)
```

## Local Setup

**Prerequisites:** Node.js 20+, pnpm, and a free [Neon](https://neon.tech) PostgreSQL database.

```bash
# 1. Clone and install
git clone <repo-url>
cd kanban-board
pnpm install

# 2. Copy env and fill in values (set DATABASE_URL to your Neon connection string)
cp .env.example .env.local

# 3. Apply the database schema to Neon
pnpm db:migrate

# 4. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Tip:** Use a separate Neon **branch** for local development (e.g. a `dev` branch) and keep `production` for the deployed app. Neon branches are instant and free, so destructive schema changes during development never touch production data. Put the dev branch URL in `.env.local`; set the production URL in your host's environment variables (e.g. Vercel).

## Environment Variables

| Variable             | Description                                                                             |
| -------------------- | --------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | Neon PostgreSQL connection string (e.g. `postgresql://user:pass@host/db`)               |
| `BETTER_AUTH_SECRET` | Random secret for Better Auth sessions — 32+ chars. Generate: `openssl rand -base64 32` |
| `BETTER_AUTH_URL`    | App base URL (e.g. `http://localhost:3000`)                                             |
| `OPENAI_API_KEY`     | OpenAI API key for AI card generation                                                   |

See `.env.example` for the full template. Validation is enforced at build time via `@t3-oss/env-nextjs` — the build will fail fast if any variable is missing or malformed.

## API & Server Actions

### Route Handlers (TanStack Query)

| Method          | Path                      | Description                                  |
| --------------- | ------------------------- | -------------------------------------------- |
| GET             | `/api/boards/:id`         | Full board: columns with cards + labels      |
| POST            | `/api/columns`            | Create column                                |
| PATCH           | `/api/columns/:id`        | Rename or reorder (sortOrder)                |
| DELETE          | `/api/columns/:id`        | Delete column (cascade cards)                |
| POST            | `/api/cards`              | Create card in a column                      |
| PATCH           | `/api/cards/:id`          | Move (columnId + sortOrder) or update fields |
| PATCH           | `/api/cards/:id/archive`  | Toggle archive (soft delete)                 |
| GET/POST/DELETE | `/api/cards/:id/comments` | Card comments                                |
| POST            | `/api/ai/card-generate`   | AI card description generator                |

All handlers require board membership. Error format: `{ error: { code: string; message: string } }`.

### Server Actions

`createBoard`, `renameBoard`, `deleteBoard` (owner only), `inviteMember` (owner only), `createLabel`, `updateLabel`, `deleteLabel` — each calls `revalidatePath` after mutation.

## Database Schema

Seven tables: `boards`, `board_members`, `columns`, `labels`, `cards`, `card_labels`, `comments`. Cards and columns use fractional-indexing `sortOrder` strings so drag-and-drop only writes a single row. See `src/db/schema.ts` (upcoming phase).

Key constraints:

- `uq_board_member`: one membership row per user/board
- `uq_card_label`: no duplicate label on a card
- Indexes on `board_id`, `column_id`, `card_id` for fast board renders

## Screenshots

TBD — screenshots will be added once the UI is implemented.

## Future Improvements

- Real-time presence (WebSocket) for live multiplayer
- Card attachments and file uploads
- Recurring due dates and calendar view
- Email notifications for invitations and due-date reminders
- Vitest unit tests + Playwright E2E suite
- GitHub Actions CI (lint, typecheck, Vitest)
- Vercel deployment + Neon managed database
