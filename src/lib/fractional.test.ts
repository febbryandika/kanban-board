import { describe, it, expect } from "vitest";

import { keyForAppend, keyBetween } from "@/lib/fractional";

describe("keyForAppend", () => {
  it("returns a valid first key for an empty list", () => {
    expect(keyForAppend(null)).toBe("a0");
  });

  it("returns a key strictly after the last item", () => {
    const first = keyForAppend(null);
    const second = keyForAppend(first);
    expect(second > first).toBe(true);
  });
});

describe("keyBetween", () => {
  it("returns the first key when both bounds are null", () => {
    expect(keyBetween(null, null)).toBe("a0");
  });

  it("returns a key strictly between two neighbors", () => {
    const k = keyBetween("a0", "a1");
    expect("a0" < k && k < "a1").toBe(true);
  });

  it("returns a key after prev when next is open-ended", () => {
    const k = keyBetween("a0", null);
    expect(k > "a0").toBe(true);
  });

  it("returns a key before next when prev is open-ended", () => {
    const k = keyBetween(null, "a1");
    expect(k < "a1").toBe(true);
  });

  it("throws when bounds are out of order", () => {
    expect(() => keyBetween("a1", "a0")).toThrow();
  });
});

describe("ordering invariants", () => {
  it("keeps appended keys strictly ascending", () => {
    const keys: string[] = [];
    let last: string | null = null;
    for (let i = 0; i < 25; i++) {
      last = keyForAppend(last);
      keys.push(last);
    }
    const sorted = [...keys].sort();
    expect(keys).toEqual(sorted);
  });

  it("preserves order when repeatedly inserting between two neighbors", () => {
    let lo = "a0";
    const hi = "a1";
    // Insert 20 times into the same gap; each new key must stay between lo and hi.
    for (let i = 0; i < 20; i++) {
      const mid = keyBetween(lo, hi);
      expect(lo < mid && mid < hi).toBe(true);
      lo = mid; // shrink the gap toward hi each round
    }
  });
});
