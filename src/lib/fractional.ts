import { generateKeyBetween } from "fractional-indexing";

/** The single ordering entry point (SPEC §3.4). `sortOrder` is a string key, so
 * a move/insert only writes the moved row — siblings are never renumbered.
 * Pure, so it runs on both the server (create) and the client (optimistic move). */

/** Key to append after the last item (or the first key when the list is empty). */
export function keyForAppend(last: string | null): string {
  return generateKeyBetween(last, null);
}

/** Key to place an item between two neighbors (either may be null at an edge). */
export function keyBetween(prev: string | null, next: string | null): string {
  return generateKeyBetween(prev, next);
}
