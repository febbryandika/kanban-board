import { describe, it, expect } from "vitest";

import {
  createBoardSchema,
  createColumnSchema,
  updateColumnSchema,
  createCardSchema,
  updateCardSchema,
  createCommentSchema,
  createLabelSchema,
  inviteMemberSchema,
} from "@/lib/validations";

describe("createBoardSchema", () => {
  it("trims the name and applies the default bgColor", () => {
    const parsed = createBoardSchema.parse({ name: "  My Board  " });
    expect(parsed.name).toBe("My Board");
    expect(parsed.bgColor).toBe("#6366f1");
  });

  it("enforces the 1–60 name bounds", () => {
    expect(createBoardSchema.safeParse({ name: "" }).success).toBe(false);
    expect(createBoardSchema.safeParse({ name: "a".repeat(61) }).success).toBe(false);
  });

  it("rejects a non-hex bgColor", () => {
    expect(createBoardSchema.safeParse({ name: "ok", bgColor: "red" }).success).toBe(false);
  });
});

describe("createColumnSchema", () => {
  it("enforces the 1–40 name bound", () => {
    expect(createColumnSchema.safeParse({ boardId: "b1", name: "To Do" }).success).toBe(true);
    expect(createColumnSchema.safeParse({ boardId: "b1", name: "a".repeat(41) }).success).toBe(false);
  });
});

describe("updateColumnSchema", () => {
  it("rejects an empty patch (nothing to update)", () => {
    expect(updateColumnSchema.safeParse({}).success).toBe(false);
  });

  it("accepts a single field", () => {
    expect(updateColumnSchema.safeParse({ sortOrder: "a0" }).success).toBe(true);
  });
});

describe("createCardSchema", () => {
  it("enforces the 1–200 title bound", () => {
    expect(createCardSchema.safeParse({ columnId: "c1", title: "Task" }).success).toBe(true);
    expect(createCardSchema.safeParse({ columnId: "c1", title: "" }).success).toBe(false);
    expect(createCardSchema.safeParse({ columnId: "c1", title: "a".repeat(201) }).success).toBe(false);
  });

  it("caps the description at 5000 chars", () => {
    expect(
      createCardSchema.safeParse({ columnId: "c1", title: "x", description: "a".repeat(5001) }).success,
    ).toBe(false);
  });
});

describe("updateCardSchema", () => {
  it("rejects an empty patch", () => {
    expect(updateCardSchema.safeParse({}).success).toBe(false);
  });

  it("accepts a partial move patch", () => {
    expect(updateCardSchema.safeParse({ columnId: "c2", sortOrder: "a1" }).success).toBe(true);
  });

  it("rejects an invalid dueDate", () => {
    expect(updateCardSchema.safeParse({ dueDate: "not-a-date" }).success).toBe(false);
  });
});

describe("createCommentSchema", () => {
  it("trims and enforces the 1–2000 bound", () => {
    expect(createCommentSchema.parse({ content: "  hi  " }).content).toBe("hi");
    expect(createCommentSchema.safeParse({ content: "   " }).success).toBe(false);
    expect(createCommentSchema.safeParse({ content: "a".repeat(2001) }).success).toBe(false);
  });
});

describe("createLabelSchema", () => {
  it("enforces the 30-char name limit and hex color", () => {
    expect(createLabelSchema.safeParse({ boardId: "b1", name: "Bug", color: "#ff0000" }).success).toBe(true);
    expect(createLabelSchema.safeParse({ boardId: "b1", name: "a".repeat(31), color: "#ff0000" }).success).toBe(false);
    expect(createLabelSchema.safeParse({ boardId: "b1", name: "Bug", color: "ff0000" }).success).toBe(false);
  });
});

describe("inviteMemberSchema", () => {
  it("lowercases and validates the email", () => {
    expect(inviteMemberSchema.parse({ boardId: "b1", email: "USER@X.COM" }).email).toBe("user@x.com");
    expect(inviteMemberSchema.safeParse({ boardId: "b1", email: "nope" }).success).toBe(false);
  });
});
