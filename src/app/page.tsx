import { redirect } from "next/navigation";

export default function Home() {
  // Unauthenticated users are bounced to /login by the (app) route guard.
  redirect("/boards");
}
