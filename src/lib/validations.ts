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

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type RenameBoardInput = z.infer<typeof renameBoardSchema>;
export type DeleteBoardInput = z.infer<typeof deleteBoardSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
