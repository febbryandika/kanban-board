import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

import { requireSession, errorResponse } from "@/lib/auth";
import { aiCardGenerateSchema } from "@/lib/validations";

/**
 * POST /api/ai/card-generate — turn a rough idea into a card draft (SPEC §3.5/§5.3).
 * Session-required, but NOT board-gated: it touches no board data and only returns
 * a draft for the client to pre-fill the add-card form (never auto-creates a card).
 */
export async function POST(req: Request) {
  const start = Date.now();
  try {
    await requireSession(); // 401 via errorResponse if unauthenticated

    const parsed = aiCardGenerateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION",
            message: parsed.error.issues[0]?.message ?? "Invalid input",
          },
        },
        { status: 400 },
      );
    }

    const { idea, boardContext } = parsed.data;

    // 15s budget (SPEC §9). `signal.aborted` lets us distinguish a timeout from
    // a malformed/provider failure in the catch below.
    const signal = AbortSignal.timeout(15_000);
    try {
      const { object } = await generateObject({
        model: openai("gpt-4.1-mini"),
        schema: z.object({
          title: z.string(),
          description: z.string(),
          acceptanceCriteria: z.array(z.string()).max(5),
        }),
        abortSignal: signal,
        prompt: `You are a project-management assistant. Turn a rough task idea into a clear card.
Board context: ${boardContext ?? "General project"}
Task idea: "${idea}"
Return a concise title, a 2–3 sentence description, and 3–5 acceptance criteria.`,
      });

      console.info("[ai/card-generate] ok", { ms: Date.now() - start });
      return NextResponse.json(object);
    } catch (aiErr) {
      const ms = Date.now() - start;
      if (signal.aborted) {
        console.error("[ai/card-generate] timeout", { ms });
        return NextResponse.json(
          { error: { code: "AI_TIMEOUT", message: "AI request timed out" } },
          { status: 504 },
        );
      }
      // Malformed output (rejected by the Zod schema) or a provider error —
      // fail safely with a structured response (SPEC §9).
      console.error("[ai/card-generate] failed", { ms, error: aiErr });
      return NextResponse.json(
        {
          error: {
            code: "AI_GENERATION_FAILED",
            message: "Could not generate a card. Try again.",
          },
        },
        { status: 502 },
      );
    }
  } catch (e) {
    return errorResponse(e);
  }
}
