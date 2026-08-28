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
