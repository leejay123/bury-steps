"use server";

import { revalidatePath } from "next/cache";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/auth";
import { londonWallClockToUtc } from "@/lib/dates";
import { windowState } from "@/lib/walk-window";

/** No look-alike characters — organisers read these out loud. */
const makeToken = customAlphabet("abcdefghjkmnpqrstuvwxyz23456789", 12);

/** How long health information is kept after the walk, in days. */
const CONDITIONS_RETENTION_DAYS = 90;

function isPrismaCode(err: unknown, code: string): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === code
  );
}

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

// ---------------------------------------------------------------- create walk

const createWalkSchema = z.object({
  title: z.string().trim().min(3, "Give the walk a title of at least 3 characters.").max(120),
  description: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(200).optional(),
  startsAt: z.string().min(16, "Choose a date and time."),
  durationMins: z.coerce.number().int().min(15).max(600),
});

export async function createWalk(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = createWalkSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    location: formData.get("location") || undefined,
    startsAt: formData.get("startsAt"),
    durationMins: formData.get("durationMins") ?? 90,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  let startsAt: Date;
  try {
    startsAt = londonWallClockToUtc(parsed.data.startsAt);
  } catch {
    return { ok: false, error: "That date and time could not be read. Try again." };
  }

  const walk = await prisma.walk.create({
    data: {
      token: makeToken(),
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      location: parsed.data.location ?? null,
      startsAt,
      durationMins: parsed.data.durationMins,
      createdById: admin.id,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: true, message: `“${walk.title}” created. Share link is ready.` };
}

// ---------------------------------------------------------------- cancel walk

export async function cancelWalk(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("walkId") ?? "");
  if (!id) return { ok: false, error: "No walk selected." };

  await prisma.walk.update({ where: { id }, data: { cancelledAt: new Date() } });

  revalidatePath("/admin");
  revalidatePath(`/admin/walks/${id}`);
  revalidatePath("/dashboard");
  return { ok: true, message: "Walk cancelled. Members will see it marked as cancelled." };
}

// ------------------------------------------------------------------ clock in

const clockInSchema = z.object({
  token: z.string().min(1),
  medicalAck: z.literal("on", {
    errorMap: () => ({ message: "Please confirm the medical acknowledgement before clocking in." }),
  }),
  hasConditions: z.enum(["yes", "no"], {
    errorMap: () => ({ message: "Let us know whether you have any active conditions." }),
  }),
  conditions: z.string().trim().max(1000).optional(),
});

export async function clockIn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = clockInSchema.safeParse({
    token: formData.get("token"),
    medicalAck: formData.get("medicalAck"),
    hasConditions: formData.get("hasConditions"),
    conditions: formData.get("conditions") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  if (parsed.data.hasConditions === "yes" && !parsed.data.conditions) {
    return { ok: false, error: "Add a short note about your conditions, or select “No conditions to report”." };
  }

  const walk = await prisma.walk.findUnique({ where: { token: parsed.data.token } });
  if (!walk) return { ok: false, error: "This walk link is not valid." };
  if (walk.cancelledAt) return { ok: false, error: "This walk has been cancelled." };

  const state = windowState(walk.startsAt, walk.durationMins);
  if (state === "too-early") {
    return { ok: false, error: "Clock-in opens an hour before the walk starts." };
  }
  if (state === "closed") {
    return { ok: false, error: "Clock-in for this walk has closed. Speak to an organiser." };
  }

  const purgeAfter = new Date(
    walk.startsAt.getTime() + CONDITIONS_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );

  try {
    await prisma.attendance.create({
      data: {
        walkId: walk.id,
        userId: user.id,
        // clockedInAt is set by the database default — never by the browser.
        medicalAckAt: new Date(),
        conditions: parsed.data.hasConditions === "yes" ? parsed.data.conditions! : null,
        conditionsPurgeAfter: purgeAfter,
      },
    });
  } catch (err) {
    // P2002 = unique constraint violation, i.e. they already clocked in.
    if (isPrismaCode(err, "P2002")) {
      return { ok: false, error: "You are already clocked in for this walk." };
    }
    throw err;
  }

  revalidatePath(`/w/${walk.token}`);
  revalidatePath("/dashboard");
  revalidatePath(`/admin/walks/${walk.id}`);
  return { ok: true, message: "Clocked in. Enjoy the walk." };
}
