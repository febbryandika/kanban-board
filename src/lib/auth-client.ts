import { createAuthClient } from "better-auth/react";

// No baseURL needed: the client defaults to the current origin, which is the
// same Next.js app that mounts the auth route handler.
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
