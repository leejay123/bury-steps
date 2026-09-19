"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isOwner } from "@/lib/site-owner";
import { checkRateLimit } from "@/lib/rate-limit";
import { readOrganiserPermissions } from "@/lib/organiser-permissions";
import { ROLE_PERMISSIONS_ID } from "@/lib/role-permissions";
import { type ActionResult, logActionError, ownerDenied } from "./shared";

/**
 * Changes the one shared set of capabilities every organiser has (see
 * Settings → Roles) — owner-only. Takes effect immediately for every
 * organiser at once; there's no per-person picker left to edit.
 */
export async function setRolePermissions(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!(await isOwner(admin.id))) return ownerDenied("change what organisers can do");
  const limited = checkRateLimit(`${admin.id}:setRolePermissions`, 20, 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many attempts. Try again in ${limited.retryAfterSeconds}s.` };
  }

  const permissions = readOrganiserPermissions(formData);

  try {
    await prisma.rolePermissions.upsert({
      where: { id: ROLE_PERMISSIONS_ID },
      create: { id: ROLE_PERMISSIONS_ID, ...permissions },
      update: permissions,
    });
  } catch (err) {
    return logActionError("setRolePermissions", err, "Could not save that. Try again.");
  }

  revalidatePath("/admin/settings/roles");
  // Nav (Members / Messages / Reports / Settings) and every admin page's
  // gating depend on this for every organiser at once.
  revalidatePath("/", "layout");

  return { ok: true, message: "Saved — every organiser now has this." };
}
