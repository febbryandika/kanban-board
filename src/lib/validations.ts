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
});

// PATCH /api/cards/:id is move (columnId + sortOrder) this phase; field editing
// (title/description/dueDate/assignee/labels) lands with the card modal.
export const updateCardSchema = z
  .object({
    columnId: z.string().min(1).optional(),
    sortOrder: z.string().min(1, "Sort order is required").optional(),
  })
  .refine((d) => d.columnId !== undefined || d.sortOrder !== undefined, {
    message: "Nothing to update",
  });

export const archiveCardSchema = z.object({ isArchived: z.boolean() });

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type RenameBoardInput = z.infer<typeof renameBoardSchema>;
export type DeleteBoardInput = z.infer<typeof deleteBoardSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type ArchiveCardInput = z.infer<typeof archiveCardSchema>;
