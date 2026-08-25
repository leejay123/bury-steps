import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import type { User } from "@prisma/client";

/**
 * Returns the local User row for the signed-in Clerk user, creating it on
 * first sight. This makes the app work even if the Clerk webhook is delayed
 * or misconfigured — the webhook is an optimisation, not a dependency.
 */
export async function requireUser(): Promise<User> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const existing = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (existing) return existing;

  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    "";

  return prisma.user.create({
    data: {
      clerkId: userId,
      email,
      firstName: clerkUser?.firstName ?? null,
      lastName: clerkUser?.lastName ?? null,
      // First account to sign up becomes the organiser. Everyone else is a member.
      role: (await prisma.user.count()) === 0 ? "ADMIN" : "MEMBER",
    },
  });
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
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
