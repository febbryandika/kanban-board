import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const session = await getSession();
  if (session) redirect("/boards");

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border bg-background p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground">
            Start organizing your work with Kanban boards.
          </p>
        </div>
        <SignupForm />
      </div>
    </main>
  );
}
