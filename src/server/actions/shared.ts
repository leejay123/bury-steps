// Not a "use server" module — these are plain helpers imported by the
// "use server" action files in this directory. A "use server" file may only
// export async functions, so anything used across more than one domain file
// (or that isn't itself an action) lives here instead.

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { HOMEPAGE_CACHE_TAG } from "@/lib/homepage-cache";
import { isAllowedImageMime, sniffImageMime } from "@/lib/image-bytes";
import { stripImageMetadata } from "@/lib/strip-image-metadata";

export type ActionResult =
  | { ok: true; message?: string; href?: string }
  | { ok: false; error: string };

/** Thrown by a locked count-check to signal "this would exceed the
 * configured limit" — told apart from a genuine, unexpected DB error so it
 * can be reported with its own message instead of the generic
 * logActionError fallback. */
export class LimitReachedError extends Error {}

/**
 * Serializes a "count existing rows, reject if at the limit, otherwise
 * create one" operation across concurrent admin requests. Under the
 * default Read Committed isolation level, two admins hitting "Add" at the
 * same instant can each see a count under the limit and both insert,
 * exceeding it (and, for sortOrder-by-count callers, colliding on the same
 * sortOrder value) — the same class of race `syncLocalUser`'s advisory
 * lock solves for the admin-bootstrap check. `fn` must do all of its reads
 * and writes through the given transaction client, not the top-level
 * `prisma`, since the lock is scoped to (and released at the end of) this
 * transaction.
 */
export async function withCountLimitLock<T>(
  lockKey: number,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${lockKey})`);
    return fn(tx);
  });
}

export function revalidateWalkShare(walk: { token: string; slug?: string | null }) {
  revalidatePath(`/w/${walk.token}`);
  if (walk.slug) revalidatePath(`/w/${walk.slug}`);
}

export function isPrismaCode(err: unknown, code: string): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === code
  );
}

export function isNotFoundStatus(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    (err as { status?: unknown }).status === 404
  );
}

/**
 * Logs the real error server-side (Next.js otherwise only shows the caller a
 * generic "something went wrong" for anything thrown out of a server
 * action) and returns a friendly, generic failure for the UI. Never call
 * this around `requireAdmin()`/`requireUser()` — they use `notFound()` /
 * `redirect()`, which work by throwing, and that throw must keep propagating.
 */
export function logActionError(
  context: string,
  err: unknown,
  fallback = "Something went wrong. Try again.",
): ActionResult {
  console.error(`[actions:${context}]`, err);
  return { ok: false, error: fallback };
}

export function revalidateHomepage() {
  revalidateTag(HOMEPAGE_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/admin/homepage");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/hero-photos");
  revalidatePath("/admin/settings/testimonials");
  revalidatePath("/admin/settings/faqs");
}

/**
 * Reorder actions are called directly as server actions (not through a
 * `<form>`/FormData submission), so — unlike everywhere else in this file —
 * there is no schema parsing step forcing the payload's shape before it
 * reaches here. `ids` is typed `string[]` for our own call sites, but a
 * request hitting the action's endpoint directly can send anything; check
 * it actually is a reasonably-sized array of strings before doing anything
 * with it. `maxLength` should be comfortably above the resource's own
 * configured limit so a legitimate reorder is never rejected.
 */
export function validateReorderIds(ids: unknown, maxLength: number): string[] | { error: string } {
  const invalid = { error: "Could not save that order. Try again." };
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > maxLength) return invalid;
  if (!ids.every((id) => typeof id === "string" && id.length > 0 && id.length <= 100)) return invalid;
  return ids;
}

export async function applySortOrder(
  ids: string[],
  existing: { id: string }[],
  update: (id: string, sortOrder: number) => Prisma.PrismaPromise<unknown>,
) {
  const allowed = new Set(existing.map((row) => row.id));
  const next = [...new Set(ids.filter((id) => allowed.has(id)))];
  for (const row of existing) {
    if (!next.includes(row.id)) next.push(row.id);
  }
  if (next.length === 0) return;
  await prisma.$transaction(next.map((id, index) => update(id, index)));
}

const MAX_SLIDE_BYTES = 4 * 1024 * 1024;

/** Shared by homepage slides and testimonials — both accept an uploaded photo. */
export async function readSlideImage(
  formData: FormData,
): Promise<{ data: Uint8Array<ArrayBuffer>; mime: string } | { error: string }> {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }
  if (file.size > MAX_SLIDE_BYTES) {
    return { error: "Keep the image under 4 MB." };
  }
  const raw = new Uint8Array(await file.arrayBuffer()) as Uint8Array<ArrayBuffer>;
  const mime = sniffImageMime(raw);
  if (!mime || !isAllowedImageMime(mime)) {
    return { error: "Use a JPEG, PNG or WebP image." };
  }
  // These are public-facing photos — strip EXIF/XMP metadata (which on a
  // phone photo usually includes exact GPS coordinates) before it's ever
  // written to the database.
  const data = stripImageMetadata(raw, mime) as Uint8Array<ArrayBuffer>;
  return { data, mime };
}

/** Same as `readSlideImage`, but treats a not-yet-chosen file as "keep the
 * existing image" instead of an error — for edit forms where a new photo is
 * optional. */
export async function readOptionalImage(formData: FormData) {
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return null;
  return readSlideImage(formData);
}
