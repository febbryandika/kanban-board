import { getSession } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

// Placeholder authenticated landing — replaced by the real board list in the
// CRUD phase. Exists now so login/logout is verifiable end-to-end.
export default async function BoardsPage() {
  const session = await getSession();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Boards</h1>
        <LogoutButton />
      </div>
      <p className="text-sm text-muted-foreground">
        Signed in as {session?.user.email}.
      </p>
    </main>
  );
}
