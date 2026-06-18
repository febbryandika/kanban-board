import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

const BG_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export const createBoardSchema = z.object({
  name: z.string().trim().min(1, "Board name is required").max(60),
  bgColor: z.string().regex(BG_COLOR_RE, "Invalid color").default("#6366f1"),
});

export const renameBoardSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Board name is required").max(60),
});

export const deleteBoardSchema = z.object({
  id: z.string().min(1),
});

export const inviteMemberSchema = z.object({
  boardId: z.string().min(1),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email("Enter a valid email")),
});

export const removeMemberSchema = z.object({
  boardId: z.string().min(1),
  userId: z.string().min(1),
});

export const leaveBoardSchema = z.object({
  boardId: z.string().min(1),
});

export const createColumnSchema = z.object({
  boardId: z.string().min(1),
  name: z.string().trim().min(1, "Column name is required").max(40),
});

// PATCH /api/columns/:id is rename and/or reorder; require at least one field.
export const updateColumnSchema = z
  .object({
    name: z.string().trim().min(1, "Column name is required").max(40).optional(),
    sortOrder: z.string().min(1, "Sort order is required").optional(),
  })
  .refine((d) => d.name !== undefined || d.sortOrder !== undefined, {
    message: "Nothing to update",
  });

export const createCardSchema = z.object({
  columnId: z.string().min(1),
  title: z.string().trim().min(1, "Card title is required").max(200),
  // Optional at create so the AI-prefilled description persists in one request.
  description: z.string().max(5000, "Description is too long").optional(),
});

// PATCH /api/cards/:id covers both a move (columnId + sortOrder) and modal field
// edits (title/description/dueDate/assignee). Every field is optional; require at
// least one. `description`/`dueDate`/`assigneeId` accept null to clear, so the
// "something to update" check tests for any key that is not `undefined`.
export const updateCardSchema = z
  .object({
    columnId: z.string().min(1).optional(),
    sortOrder: z.string().min(1, "Sort order is required").optional(),
    title: z.string().trim().min(1, "Card title is required").max(200).optional(),
    description: z.string().max(5000, "Description is too long").nullable().optional(),
    dueDate: z.string().datetime("Invalid date").nullable().optional(),
    assigneeId: z.string().min(1).nullable().optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: "Nothing to update",
  });

export const archiveCardSchema = z.object({ isArchived: z.boolean() });

const LABEL_COLOR_RE = BG_COLOR_RE;

export const createLabelSchema = z.object({
  boardId: z.string().min(1),
  name: z.string().trim().min(1, "Label name is required").max(30),
  color: z.string().regex(LABEL_COLOR_RE, "Invalid color"),
});

export const updateLabelSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Label name is required").max(30),
  color: z.string().regex(LABEL_COLOR_RE, "Invalid color"),
});

export const deleteLabelSchema = z.object({ id: z.string().min(1) });

// Apply/remove a label on a card. The card id comes from the route param.
export const cardLabelSchema = z.object({ labelId: z.string().min(1) });

// Create a comment on a card. The card id comes from the route param.
export const createCommentSchema = z.object({
  content: z.string().trim().min(1, "Comment cannot be empty").max(2000),
});

// AI card generator request body (SPEC §3.5 / §5.3). Pre-fill only — never creates.
export const aiCardGenerateSchema = z.object({
  idea: z.string().trim().min(1, "Describe an idea first").max(500),
  boardContext: z.string().max(500).optional(),
});

// Shape `generateObject()` must return (SPEC §5.3). Lives here so the AI route and
// its unit test share one schema instead of duplicating it.
export const aiCardOutputSchema = z.object({
  title: z.string(),
  description: z.string(),
  acceptanceCriteria: z.array(z.string()).max(5),
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type RenameBoardInput = z.infer<typeof renameBoardSchema>;
export type DeleteBoardInput = z.infer<typeof deleteBoardSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
export type LeaveBoardInput = z.infer<typeof leaveBoardSchema>;
export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type ArchiveCardInput = z.infer<typeof archiveCardSchema>;
export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;
export type DeleteLabelInput = z.infer<typeof deleteLabelSchema>;
export type CardLabelInput = z.infer<typeof cardLabelSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type AiCardGenerateInput = z.infer<typeof aiCardGenerateSchema>;
