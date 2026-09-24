import type { User } from "@prisma/client";
import { prisma } from "./db";
import { DEFAULT_PRIMARY_COLOR, SITE_SETTING_ID } from "./theme";

/**
 * Optional allowlist for the one-time "first account becomes organiser"
 * bootstrap. Without this, anyone who happens to sign up first against an
 * empty database — a fresh deploy, a wiped preview environment, a botched
 * migration — gets full organiser access, including member PII and health
 * notes. Set to the intended organiser's email so an empty database can
 * only ever bootstrap *that* account; leave unset to keep the old
 * (unguarded) behaviour for local development.
 */
function initialAdminEmail(): string | null {
  const value = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  return value || null;
}

/**
 * Create or refresh the local User row for a Clerk account.
 * The first person in an empty group becomes organiser — including when
 * Clerk’s webhook arrives before they open the site — unless
 * INITIAL_ADMIN_EMAIL is set, in which case only that address may bootstrap.
 */
export async function syncLocalUser(input: {
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}): Promise<User> {
  let isNewUser = false;
  let previousEmail: string | null = null;

  const user = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(847291)`;

    const existing = await tx.user.findUnique({ where: { clerkId: input.clerkId } });
    if (existing) {
      const nextEmail = input.email.trim();
      // Blank Clerk email must not wipe a known address (and skip newsletter
      // opt-out of the old one). Treat empty as "no email change".
      const data: {
        email?: string;
        firstName: string | null;
        lastName: string | null;
      } = {
        firstName: input.firstName,
        lastName: input.lastName,
      };
      if (nextEmail) {
        if (existing.email.trim().toLowerCase() !== nextEmail.toLowerCase()) {
          previousEmail = existing.email;
        }
        data.email = nextEmail;
      }
      return tx.user.update({
        where: { clerkId: input.clerkId },
        data,
      });
    }

    const isFirst = (await tx.user.count()) === 0;
    const allowlisted = initialAdminEmail();
    const bootstrapAsAdmin =
      isFirst && (!allowlisted || allowlisted === input.email.trim().toLowerCase());

    if (isFirst) {
      if (bootstrapAsAdmin) {
        // Worth a clear log line — this is a security-relevant, one-time
        // event (whoever signs up first on an empty database becomes the
        // organiser) and it should be easy to spot in server logs if it
        // ever happens unexpectedly (e.g. after the database is wiped or
        // migrated).
        console.warn(
          `[local-user] Bootstrapping the first account as ADMIN (clerkId=${input.clerkId}, email=${input.email}).`,
        );
      } else {
        // INITIAL_ADMIN_EMAIL is set and this signup doesn't match it — the
        // guardrail this whole function exists for. Refuse to hand out
        // organiser access and log loudly so it's obvious the group has no
        // organiser yet and needs one promoted manually (via Prisma Studio
        // or a direct DB update).
        console.error(
          `[local-user] First account signed up (clerkId=${input.clerkId}, email=${input.email}) but does not match INITIAL_ADMIN_EMAIL — created as MEMBER instead of auto-promoting. Promote the intended organiser's account to ADMIN manually.`,
        );
      }
    }

    isNewUser = true;
    const created = await tx.user.create({
      data: {
        clerkId: input.clerkId,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: bootstrapAsAdmin ? "ADMIN" : "MEMBER",
        // The first organiser is also the site's first owner — see
        // src/lib/site-owner.ts. Plain field on this row now, not a
        // separate SiteSetting pointer, since more than one account can
        // hold it from here on (addOwner/transferOwnership).
        isOwner: bootstrapAsAdmin,
      },
    });

    if (bootstrapAsAdmin) {
      // Ensure the SiteSetting row exists at all — this may be the very
      // first time it's ever touched. Ownership itself no longer lives
      // here (see above); this is just the row's own bootstrap.
      await tx.siteSetting.upsert({
        where: { id: SITE_SETTING_ID },
        create: { id: SITE_SETTING_ID, primaryColor: DEFAULT_PRIMARY_COLOR },
        update: {},
      });
    }

    return created;
  });

  // Outside the transaction — this makes an external network call, which
  // has no business holding the advisory lock (or the DB connection) open
  // while it runs. Never blocks account creation on the email actually
  // sending: sendWelcomeEmail already swallows its own failures.
  //
  // Imported dynamically rather than at module scope: this file is loaded
  // as a real (unmocked) dependency of @/lib/auth in several server action
  // test suites that only mock requireAdmin/requireUser, not the whole
  // module — a static import would drag the email/site-theme chain in at
  // module-evaluation time whether or not a new user is ever created.
  if (isNewUser) {
    const { sendWelcomeEmail } = await import("./email/mailer");
    await sendWelcomeEmail(user).catch((err) => {
      console.error("[local-user] Failed to send welcome email", err);
    });
  }

  // Clerk email change: clear the old address from footer + Resend so
  // campaigns do not keep mailing a vacated inbox, then align the new
  // address with the saved member newsletter preference.
  if (previousEmail) {
    const { optOutNewsletterEverywhere, syncNewsletterAudienceToPreference } = await import(
      "./email/newsletter-opt-out"
    );
    await optOutNewsletterEverywhere(previousEmail).catch((err) => {
      console.error("[local-user] Failed to opt old email out of newsletter after change", err);
    });
    await syncNewsletterAudienceToPreference(user.email, user.firstName).catch((err) => {
      console.error("[local-user] Failed to sync newsletter after email change", err);
    });
  }

  return user;
}
