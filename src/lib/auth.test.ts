import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from "vitest";

// Stub env so importing auth.ts (which builds betterAuth) doesn't trip env validation.
vi.mock("@/lib/env", () => ({
  env: {
    BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-1234",
    BETTER_AUTH_URL: "http://localhost:3000",
    DATABASE_URL: "postgres://test",
    NODE_ENV: "test",
  },
}));

// Replace the real DB (a pg pool) with a controllable select() stub.
vi.mock("@/db", () => ({ db: { select: vi.fn() } }));

// headers() only needs to be awaitable; the session is driven via the spy below.
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));

import { db } from "@/db";
import { auth, AuthError, requireSession, requireMember, requireOwner } from "@/lib/auth";

/** Drive what `auth.api.getSession` resolves to (null = signed out). */
function mockSession(session: unknown) {
  vi.spyOn(auth.api, "getSession").mockResolvedValue(session as never);
}

/** Drive the `db.select()...limit(1)` chain to return the given rows. */
function mockMembershipRows(rows: unknown[]) {
  const chain = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    limit: vi.fn(() => Promise.resolve(rows)),
  };
  (db.select as Mock).mockReturnValue(chain);
}

const session = { user: { id: "u1" } };

beforeEach(() => {
  (db.select as Mock).mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("requireSession", () => {
  it("throws 401 when signed out", async () => {
    mockSession(null);
    const err = await requireSession().catch((e) => e);
    expect(err).toBeInstanceOf(AuthError);
    expect(err).toMatchObject({ code: "UNAUTHORIZED", status: 401 });
  });

  it("returns the session when authenticated", async () => {
    mockSession(session);
    await expect(requireSession()).resolves.toEqual(session);
  });
});

describe("requireMember", () => {
  it("throws 401 when signed out", async () => {
    mockSession(null);
    const err = await requireMember("b1").catch((e) => e);
    expect(err).toMatchObject({ code: "UNAUTHORIZED", status: 401 });
  });

  it("throws 403 when authenticated but not a member", async () => {
    mockSession(session);
    mockMembershipRows([]);
    const err = await requireMember("b1").catch((e) => e);
    expect(err).toBeInstanceOf(AuthError);
    expect(err).toMatchObject({ code: "FORBIDDEN", status: 403 });
  });

  it("returns the session and membership for a member", async () => {
    mockSession(session);
    const membership = { boardId: "b1", userId: "u1", role: "member" };
    mockMembershipRows([membership]);
    await expect(requireMember("b1")).resolves.toEqual({ session, membership });
  });
});

describe("requireOwner", () => {
  it("throws 403 when the user is a member but not the owner", async () => {
    mockSession(session);
    mockMembershipRows([{ boardId: "b1", userId: "u1", role: "member" }]);
    const err = await requireOwner("b1").catch((e) => e);
    expect(err).toBeInstanceOf(AuthError);
    expect(err).toMatchObject({ code: "FORBIDDEN", status: 403 });
  });

  it("returns the result for the owner", async () => {
    mockSession(session);
    const membership = { boardId: "b1", userId: "u1", role: "owner" };
    mockMembershipRows([membership]);
    const result = await requireOwner("b1");
    expect(result.membership.role).toBe("owner");
  });
});
