"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { requireAdmin, displayName } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { type ActionResult, logActionError, permissionDenied } from "./shared";

/**
 * Signs the calling admin into a member's account via a Clerk actor token —
 * Clerk's official impersonation primitive (https://clerk.com/docs/guides/development/impersonation),
 * not a custom auth bypass. The resulting session carries an `act` claim
 * naming the real admin, which src/lib/auth.ts reads to show the
 * "Viewing as ..." banner (src/components/impersonation-banner.tsx) —
 * there is no silent, unbannered path into someone else's account.
 *
 * Restricted to MEMBER targets only: one admin should not be able to sign
 * in as another organiser. Every use is logged to ImpersonationEvent
 * (who, who-as, when) before the redirect happens, so the log is written
 * even if the admin never actually completes the sign-in.
 */
export async function startImpersonation(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin.permMembers) return permissionDenied("permMembers");
  const limited = checkRateLimit(`${admin.id}:startImpersonation`, 10, 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many attempts. Try again in ${limited.retryAfterSeconds}s.` };
  }

  const targetId = String(formData.get("targetId") ?? "");
  if (!targetId) return { ok: false, error: "No member selected." };
  if (targetId === admin.id) return { ok: false, error: "You can't log in as yourself." };

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) return { ok: false, error: "That member is no longer in the group." };
  if (target.role !== "MEMBER") {
    return { ok: false, error: "You can only log in as a member, not another organiser." };
  }

  try {
    const clerk = await clerkClient();
    const actorToken = await clerk.actorTokens.create({
      userId: target.clerkId,
      actor: { sub: admin.clerkId },
      // Short-lived on purpose — this is a one-time sign-in link, not a
      // standing credential.
      expiresInSeconds: 5 * 60,
    });

    await prisma.impersonationEvent.create({
      data: {
        adminId: admin.id,
        adminName: displayName(admin),
        adminEmail: admin.email,
        targetId: target.id,
        targetName: displayName(target),
        targetEmail: target.email,
      },
    });

    if (!actorToken.url) return { ok: false, error: "Clerk did not return a sign-in link. Try again." };
    return {
      ok: true,
      message: `Signed in as ${displayName(target)}.`,
      href: actorToken.url,
    };
  } catch (err) {
    // Clerk plans cap how many actor-token sign-ins can be created per
    // billing period (their own error already explains the reset timing
    // and current usage) — surface that directly rather than the generic
    // fallback, since "try again" would be actively misleading here.
    if (isClerkAPIResponseError(err)) {
      const limitError = err.errors.find((e) => e.code === "impersonation_limit_exceeded");
      if (limitError) return { ok: false, error: limitError.longMessage ?? limitError.message };
    }
    return logActionError("startImpersonation", err, "Could not log in as that member. Try again.");
  }
}
