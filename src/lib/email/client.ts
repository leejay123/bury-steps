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

/** Resend's own cap on how many distinct emails a single `/emails/batch`
 * call can carry — see
 * https://resend.com/docs/api-reference/emails/send-batch-emails. */
const BATCH_CHUNK_SIZE = 100;

/**
 * A short pause between chunks of a multi-chunk fan-out. Resend's default
 * rate limit is about 10 requests/second per account (see
 * https://resend.com/docs/api-reference/rate-limit); one `/emails/batch`
 * call already carries up to 100 emails, so this only matters once a
 * fan-out spans more than BATCH_CHUNK_SIZE recipients, and even a modest
 * pause between chunks stays comfortably under that limit.
 */
const BATCH_CHUNK_PACE_MS = 350;

export type BatchSendResult = { sent: number; failed: number };

/**
 * Best-effort fan-out to many distinct recipients using Resend's batch
 * endpoint — one API call delivers up to 100 separate, individually
 * personalized emails, instead of one call (and one slice of the rate
 * limit) per recipient. Used for "notify every opted-in member" sends
 * (new walk, cancelled walk, new notice, monthly progress) — never for a
 * single email with everyone in `to:`, which would leak every member's
 * address to every other member; each item here is still its own
 * separate email, Resend just accepts many in one request.
 *
 * Chunks inputs larger than BATCH_CHUNK_SIZE and paces between chunks to
 * stay under Resend's rate limit. Runs with `batchValidation: "permissive"`
 * so one bad recipient (an invalid address, say) doesn't take the rest of
 * its chunk down with it — Resend reports that one as a per-item error
 * instead of rejecting the whole call.
 *
 * `idempotencyKeyPrefix`, if given, becomes `${prefix}/${chunkIndex}` —
 * one key per chunk (Resend's batch idempotency is per-call, not
 * per-email inside it), so a retry with the same inputs in the same order
 * re-sends nothing rather than double-sending a whole chunk.
 */
export async function sendEmailBatch(
  inputs: SendEmailInput[],
  options?: { idempotencyKeyPrefix?: string },
): Promise<BatchSendResult> {
  if (inputs.length === 0) return { sent: 0, failed: 0 };

  const resend = getClient();
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipped a batch of ${inputs.length} emails.`);
    return { sent: 0, failed: inputs.length };
  }

  let sent = 0;
  let failed = 0;

  for (let start = 0; start < inputs.length; start += BATCH_CHUNK_SIZE) {
    const chunk = inputs.slice(start, start + BATCH_CHUNK_SIZE);
    const chunkIndex = start / BATCH_CHUNK_SIZE;

    try {
      const { data, error } = await resend.batch.send(
        chunk.map((input) => ({
          from: fromAddress(),
          to: Array.isArray(input.to) ? input.to : [input.to],
          subject: input.subject,
          react: input.react,
          ...(input.replyTo ? { replyTo: input.replyTo } : {}),
        })),
        {
          batchValidation: "permissive",
          ...(options?.idempotencyKeyPrefix
            ? { idempotencyKey: `${options.idempotencyKeyPrefix}/${chunkIndex}` }
            : {}),
        },
      );

      if (error) {
        console.error(`[email] Resend rejected a batch of ${chunk.length} emails:`, error);
        failed += chunk.length;
        continue;
      }

      sent += data?.data.length ?? 0;
      for (const failure of data?.errors ?? []) {
        failed += 1;
        console.error(
          `[email] Resend rejected one email in a batch (recipient: ${chunk[failure.index]?.to}):`,
          failure.message,
        );
      }
    } catch (err) {
      console.error(`[email] Failed to send a batch of ${chunk.length} emails:`, err);
      failed += chunk.length;
    }

    if (start + BATCH_CHUNK_SIZE < inputs.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_CHUNK_PACE_MS));
    }
  }

  return { sent, failed };
}
