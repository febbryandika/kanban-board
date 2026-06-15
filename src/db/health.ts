import { sql } from "drizzle-orm";
import { db } from "./index";

/** Runs `select 1` against the database; returns false if the query fails. */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}
