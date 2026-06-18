import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

import { requireSession, errorResponse } from "@/lib/auth";
import { withApiLogging } from "@/lib/api-logging";
import { logger, serializeError } from "@/lib/logger";
import { checkAiRateLimit } from "@/lib/ratelimit";
import { aiCardGenerateSchema, aiCardOutputSchema } from "@/lib/validations";

const MODEL = "gpt-4.1-mini";

export const POST = withApiLogging("ai.card_generate", generateCard);

/**
 * POST /api/ai/card-generate — turn a rough idea into a card draft (SPEC §3.5/§5.3).
 * Session-required, but NOT board-gated: it touches no board data and only returns
 * a draft for the client to pre-fill the add-card form (never auto-creates a card).
 */
async function generateCard(req: Request) {
  const start = Date.now();
  try {
    const session = await requireSession(); // 401 via errorResponse if unauthenticated

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

    // Per-user rate limit (SPEC §8) — guards the OpenAI quota from spam.
    const rl = await checkAiRateLimit(session.user.id);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many AI requests. Try again later.",
          },
        },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      );
    }

    const { idea, boardContext } = parsed.data;

    // 15s budget (SPEC §9). `signal.aborted` lets us distinguish a timeout from
    // a malformed/provider failure in the catch below.
    const signal = AbortSignal.timeout(15_000);
    try {
      const { object } = await generateObject({
        model: openai(MODEL),
        schema: aiCardOutputSchema,
        abortSignal: signal,
        prompt: `You are a project-management assistant. Turn a rough task idea into a clear card.
Board context: ${boardContext ?? "General project"}
Task idea: "${idea}"
Return a concise title, a 2–3 sentence description, and 3–5 acceptance criteria.`,
      });

      logger.info("ai.card_generate.ok", {
        ms: Date.now() - start,
        userId: session.user.id,
        ideaLen: idea.length,
        model: MODEL,
      });
      return NextResponse.json(object);
    } catch (aiErr) {
      const ms = Date.now() - start;
      if (signal.aborted) {
        logger.warn("ai.card_generate.timeout", { ms, userId: session.user.id });
        return NextResponse.json(
          { error: { code: "AI_TIMEOUT", message: "AI request timed out" } },
          { status: 504 },
        );
      }
      // Malformed output (rejected by the Zod schema) or a provider error —
      // fail safely with a structured response (SPEC §9).
      logger.error("ai.card_generate.failed", {
        ms,
        userId: session.user.id,
        error: serializeError(aiErr),
      });
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
