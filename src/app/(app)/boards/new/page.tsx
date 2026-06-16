import Link from "next/link";

import { CreateBoardForm } from "@/components/boards/create-board-form";

// Auth is enforced by the (app) route-group layout.
export default function NewBoardPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/boards"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← Back to boards
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New board</h1>
      </div>
      <CreateBoardForm />
    </main>
  );
}
