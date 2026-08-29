import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { prisma } from "./db";
import type { User } from "@prisma/client";
import { SIGN_IN_URL } from "./urls";
import { syncLocalUser } from "./local-user";

/** Clerk throws this when auth() runs on a request that skipped middleware. */
export function isClerkMiddlewareMissingError(error: unknown): boolean {
  return (
    error instanceof Error && error.message.includes("can't detect usage of clerkMiddleware()")
  );
}

/**
 * Returns the local User row for the signed-in Clerk user, creating it on
 * first sight. This makes the app work even if the Clerk webhook is delayed
 * or misconfigured — the webhook is an optimisation, not a dependency.
 *
 * Cached per request so the header and the page share one database lookup.
 */
export const getOptionalUser = cache(async (): Promise<User | null> => {
  let userId: string | null;
  try {
    ({ userId } = await auth());
  } catch (error) {
    // Missing static files (favicon.ico, apple-touch-icon.png, …) are
    // excluded from the middleware matcher, 404 into the root layout, and
    // would otherwise 500 the not-found page from the nav calling auth().
    if (isClerkMiddlewareMissingError(error)) return null;
    throw error;
  }
  if (!userId) return null;

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (existing) return existing;

  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    "";

  try {
    return await syncLocalUser({
      clerkId: userId,
      email,
      firstName: clerkUser?.firstName ?? null,
      lastName: clerkUser?.lastName ?? null,
    });
  } catch {
    return prisma.user.findUnique({ where: { clerkId: userId } });
  }
});

export async function requireUser(): Promise<User> {
  const user = await getOptionalUser();
  if (!user) redirect(SIGN_IN_URL);
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await getOptionalUser();
  if (!user || user.role !== "ADMIN") notFound();
  return user;
}

export function displayName(user: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email;
}

/** First and last name only. Never email — used where members can see each other. */
export function memberDisplayName(user: {
  firstName: string | null;
  lastName: string | null;
}): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || "Member";
}
