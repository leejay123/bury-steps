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

/** Shared with resend-audience.ts and the newsletter campaign sender — same
 * lazy client, same "not configured" semantics as sendEmail() below. */
export function getResendClient(): Resend | null {
  return getClient();
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
export function fromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || "Bury Steps Walking Group <onboarding@resend.dev>";
}

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  react: ReactElement;
  /** Lets a recipient reply straight to an admin inbox instead of the no-reply sending address. */
  replyTo?: string;
  /**
   * Passed through as Resend's `Idempotency-Key` header — a retried call
   * with the same key (e.g. a server action retry, or a double form
   * submit) returns the original send instead of dispatching a second
   * real email. Resend keeps keys for 24h. Format as `<event>/<entity-id>`
   * per https://resend.com/docs/api-reference/idempotency-keys — omit for
   * sends where a duplicate isn't a real risk.
   */
  idempotencyKey?: string;
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
    const { error } = await resend.emails.send(
      {
        from: fromAddress(),
        to: recipients,
        subject: input.subject,
        react: input.react,
        ...(input.replyTo ? { replyTo: input.replyTo } : {}),
      },
      input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined,
    );
    if (error) {
      console.error(`[email] Resend rejected "${input.subject}" to ${recipients.join(", ")}:`, error);
    }
  } catch (err) {
    console.error(`[email] Failed to send "${input.subject}" to ${recipients.join(", ")}:`, err);
  }
}
