"use server";

import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { requireAdmin } from "@/lib/auth";
import { permissionDenied } from "./shared";

export type SummarizeResult = { ok: true; summary: string } | { ok: false; error: string };

const MIN_LENGTH_TO_SUMMARIZE = 200;

// Flash, not Pro — plenty for shortening a walk description, and Google's
// free tier gives Flash models a far more generous daily quota than Pro.
// Uses a direct Google API key (GOOGLE_GENERATIVE_AI_API_KEY), not Vercel AI
// Gateway — the point is to stay on Google's own free tier with no Vercel
// usage billing layered on top.
// Tried in order: Google often answers "high demand" (503) for the main
// Flash models on the free tier while the lighter Flash-Lite ones are fine,
// so those come next, and Pro (smaller daily quota, but rarely busy) last.
// A model Google has retired answers 404 straight away and is just skipped
// (gemini-2.5-flash went this way). Each model gets one quick attempt, not
// the SDK's three with back-off, which kept the button spinning for ages;
// if every model was only busy, one more round after a short pause.
const SUMMARIZE_MODELS = [
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-3.8-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-pro-latest",
] as const;
const RETRY_PAUSE_MS = 2_000;
const PER_MODEL_TIMEOUT_MS = 15_000;

function statusOf(err: unknown): number | undefined {
  const status = (err as { statusCode?: number; lastError?: { statusCode?: number } } | null) ?? null;
  return status?.statusCode ?? status?.lastError?.statusCode;
}

function isBusyError(err: unknown): boolean {
  const code = statusOf(err);
  const name = err instanceof Error ? err.name : "";
  return code === 503 || code === 429 || code === 500 || name === "AbortError" || name === "TimeoutError";
}

/** Tidies a walk description into flowing prose for someone deciding
 * whether to join — used by the Summarize button next to the description
 * field in the admin walk form. Trims filler and repeated labels, but keeps
 * every practical detail (start point, distance, duration, meeting time,
 * grade, what to bring, …) rather than compressing to a headline — an
 * earlier version forced "2-3 sentences" and lost exactly the details a
 * member actually needs before turning up. */
export async function summarizeWalkDescription(description: string): Promise<SummarizeResult> {
  const admin = await requireAdmin();
  if (!admin.permWalksCreate && !admin.permWalksEdit) return permissionDenied("permWalksEdit");

  const trimmed = description.trim();
  if (!trimmed) return { ok: false, error: "Write a description first." };
  if (trimmed.length < MIN_LENGTH_TO_SUMMARIZE) {
    return { ok: false, error: "Too short to summarize — it's already brief." };
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return { ok: false, error: "AI summarizing isn't set up yet — ask an admin to add the API key." };
  }

  const prompt = `Rewrite the following walking-group walk description as tidy, easy-to-read prose for a member deciding whether to join and what to bring. Keep every practical detail — start point/address, distance, duration, grade, meeting time, walk leader, what to bring, and any safety notes — just cut repeated labels and filler wording. Aim for roughly half the original length, not a one-line summary. Plain text only — no markdown, no headings, no bullet points.\n\n${trimmed}`;

  let busy = false;
  for (let round = 0; round < 2; round += 1) {
    if (round > 0) {
      if (!busy) break;
      await new Promise((resolve) => setTimeout(resolve, RETRY_PAUSE_MS));
    }
    for (const model of SUMMARIZE_MODELS) {
      try {
        const { text } = await generateText({
          model: google(model),
          prompt,
          maxRetries: 0,
          abortSignal: AbortSignal.timeout(PER_MODEL_TIMEOUT_MS),
        });
        const summary = text.trim();
        if (summary) return { ok: true, summary };
      } catch (err) {
        if (isBusyError(err)) {
          busy = true;
          // Expected on Google's free tier — a one-line note, not a stack trace.
          console.warn(`[actions:summarizeWalkDescription] ${model} busy, trying the next model`);
        } else if (statusOf(err) === 404) {
          console.warn(`[actions:summarizeWalkDescription] ${model} not available, skipped`);
        } else {
          console.error(`[actions:summarizeWalkDescription] ${model}`, err);
        }
      }
    }
  }
  return {
    ok: false,
    error: busy
      ? "Google's AI is very busy right now. Try Summarize again in a minute."
      : "Could not summarize that. Try again.",
  };
}
