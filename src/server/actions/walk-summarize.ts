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
const SUMMARIZE_MODEL = "gemini-3.8-flash";

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

  try {
    const { text } = await generateText({
      model: google(SUMMARIZE_MODEL),
      prompt: `Rewrite the following walking-group walk description as tidy, easy-to-read prose for a member deciding whether to join and what to bring. Keep every practical detail — start point/address, distance, duration, grade, meeting time, walk leader, what to bring, and any safety notes — just cut repeated labels and filler wording. Aim for roughly half the original length, not a one-line summary. Plain text only — no markdown, no headings, no bullet points.\n\n${trimmed}`,
    });
    const summary = text.trim();
    if (!summary) return { ok: false, error: "Could not summarize that. Try again." };
    return { ok: true, summary };
  } catch (err) {
    console.error("[actions:summarizeWalkDescription]", err);
    return { ok: false, error: "Could not summarize that. Try again." };
  }
}
