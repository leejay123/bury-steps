import type { User } from "@prisma/client";
import { prisma } from "./db";

/**
 * Create or refresh the local User row for a Clerk account.
 * The first person in an empty group becomes organiser — including when
 * Clerk’s webhook arrives before they open the site.
 */
export async function syncLocalUser(input: {
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}): Promise<User> {
  return prisma.$transaction(async (tx) => {
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
    if (isFirst) {
      // Worth a clear log line — this is a security-relevant, one-time
      // event (whoever signs up first on an empty database becomes the
      // organiser) and it should be easy to spot in server logs if it ever
      // happens unexpectedly (e.g. after the database is wiped or migrated).
      console.warn(
        `[local-user] Bootstrapping the first account as ADMIN (clerkId=${input.clerkId}, email=${input.email}).`,
      );
    }
    return tx.user.create({
      data: {
        clerkId: input.clerkId,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: isFirst ? "ADMIN" : "MEMBER",
      },
    });
  });
}
