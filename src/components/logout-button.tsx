"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="outline" disabled={pending} onClick={handleLogout}>
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
