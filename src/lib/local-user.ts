import type { User } from "@prisma/client";
import { prisma } from "./db";

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

  const user = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(847291)`;

    const existing = await tx.user.findUnique({ where: { clerkId: input.clerkId } });
    if (existing) {
      return tx.user.update({
        where: { clerkId: input.clerkId },
        data: {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
        },
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
    return tx.user.create({
      data: {
        clerkId: input.clerkId,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: bootstrapAsAdmin ? "ADMIN" : "MEMBER",
      },
    });
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

  return user;
}
