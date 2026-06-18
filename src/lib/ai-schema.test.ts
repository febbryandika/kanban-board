import { describe, it, expect } from "vitest";

import { aiCardGenerateSchema, aiCardOutputSchema } from "@/lib/validations";

describe("aiCardOutputSchema (generateObject shape)", () => {
  const valid = {
    title: "Add login",
    description: "Build the login flow.",
    acceptanceCriteria: ["User can sign in", "Errors are shown"],
  };

  it("accepts a well-formed draft", () => {
    expect(aiCardOutputSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts an empty acceptanceCriteria array", () => {
    expect(aiCardOutputSchema.safeParse({ ...valid, acceptanceCriteria: [] }).success).toBe(true);
  });

  it("rejects more than 5 acceptance criteria", () => {
    const six = ["1", "2", "3", "4", "5", "6"];
    expect(aiCardOutputSchema.safeParse({ ...valid, acceptanceCriteria: six }).success).toBe(false);
  });

  it("rejects a missing or non-string title", () => {
    expect(aiCardOutputSchema.safeParse({ ...valid, title: undefined }).success).toBe(false);
    expect(aiCardOutputSchema.safeParse({ ...valid, title: 42 }).success).toBe(false);
  });
});

describe("aiCardGenerateSchema (request body)", () => {
  it("accepts a valid idea", () => {
    expect(aiCardGenerateSchema.safeParse({ idea: "ship dark mode" }).success).toBe(true);
  });

  it("rejects an empty or whitespace-only idea", () => {
    expect(aiCardGenerateSchema.safeParse({ idea: "" }).success).toBe(false);
    expect(aiCardGenerateSchema.safeParse({ idea: "   " }).success).toBe(false);
  });

  it("rejects an idea longer than 500 chars", () => {
    expect(aiCardGenerateSchema.safeParse({ idea: "a".repeat(501) }).success).toBe(false);
  });

  it("allows an optional boardContext capped at 500 chars", () => {
    expect(aiCardGenerateSchema.safeParse({ idea: "x", boardContext: "ctx" }).success).toBe(true);
    expect(
      aiCardGenerateSchema.safeParse({ idea: "x", boardContext: "c".repeat(501) }).success,
    ).toBe(false);
  });
});
