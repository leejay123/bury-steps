import { Resend } from "resend";
import type { ReactElement } from "react";

let cachedClient: Resend | null | undefined;

/**
 * Lazily constructed — `RESEND_API_KEY` is optional (see env.ts), so
 * building this at module load would crash every import in dev/preview
 * environments that don't have it set yet.
 */
function getClient(): Resend | null {
  if (cachedClient !== undefined) return cachedClient;
  const apiKey = process.env.RESEND_API_KEY?.trim();
  cachedClient = apiKey ? new Resend(apiKey) : null;
  return cachedClient;
}

export function isEmailConfigured(): boolean {
  return getClient() !== null;
}

/**
 * Falls back to Resend's own unverified test sender so a fresh checkout
 * without EMAIL_FROM set still sends *something* while a domain is being
 * verified — resend.dev addresses only deliver to the Resend account
 * owner's own inbox, so production deploys should always set EMAIL_FROM to
 * a verified address on the group's own domain.
 */
function fromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || "Bury Steps Walking Group <onboarding@resend.dev>";
}

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  react: ReactElement;
  /** Lets a recipient reply straight to an admin inbox instead of the no-reply sending address. */
  replyTo?: string;
};

/**
 * Best-effort send. Every call site treats email as a side effect that must
 * never fail the action it's attached to — an account is still deleted, a
 * role still changes, a contact message is still saved, whether or not the
 * email about it goes out. Logs and returns rather than throwing when
 * Resend isn't configured or the API call fails.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const resend = getClient();
  const recipients = Array.isArray(input.to) ? input.to : [input.to];

  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY not set — skipped "${input.subject}" to ${recipients.join(", ")}.`,
    );
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: fromAddress(),
      to: recipients,
      subject: input.subject,
      react: input.react,
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });
    if (error) {
      console.error(`[email] Resend rejected "${input.subject}" to ${recipients.join(", ")}:`, error);
    }
  } catch (err) {
    console.error(`[email] Failed to send "${input.subject}" to ${recipients.join(", ")}:`, err);
  }
}
