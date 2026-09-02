"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { londonWallClockToUtc } from "@/lib/dates";
import { type ActionResult, isPrismaCode, logActionError } from "./shared";

const reportCopySchema = z.object({
  happenedAt: z.string().min(16, "Choose a date and time."),
  walkId: z.string().optional(),
  whatHappened: z.string().trim().min(3, "Say what happened.").max(4000),
  whoInvolved: z.string().trim().min(2, "Say who was involved.").max(1000),
  whatWeDid: z.string().trim().min(3, "Say what you did.").max(4000),
  organiserNotes: z.string().trim().max(4000).optional(),
});

function readReportCopy(formData: FormData) {
  return reportCopySchema.safeParse({
    happenedAt: formData.get("happenedAt"),
    walkId: (() => {
      const value = String(formData.get("walkId") ?? "").trim();
      return !value || value === "none" ? undefined : value;
    })(),
    whatHappened: formData.get("whatHappened"),
    whoInvolved: formData.get("whoInvolved"),
    whatWeDid: formData.get("whatWeDid"),
    organiserNotes: String(formData.get("organiserNotes") ?? "").trim() || undefined,
  });
}

export async function addAccidentReport(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = readReportCopy(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  let happenedAt: Date;
  try {
    happenedAt = londonWallClockToUtc(parsed.data.happenedAt);
  } catch {
    return { ok: false, error: "That date and time could not be read. Try again." };
  }

  try {
    await prisma.accidentReport.create({
      data: {
        happenedAt,
        walkId: parsed.data.walkId ?? null,
        whatHappened: parsed.data.whatHappened,
        whoInvolved: parsed.data.whoInvolved,
        whatWeDid: parsed.data.whatWeDid,
        organiserNotes: parsed.data.organiserNotes ?? null,
        createdById: admin.id,
      },
    });
  } catch (err) {
    // An invalid/stale walkId (e.g. the walk was deleted between loading
    // the form and submitting it) fails the foreign key here rather than
    // earlier, since it's optional and not re-checked above.
    return logActionError("addAccidentReport", err, "Could not save that report. Try again.");
  }

  revalidatePath("/admin/reports");
  return { ok: true, message: "Accident report saved." };
}

export async function updateAccidentReport(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("reportId") ?? "");
  if (!id) return { ok: false, error: "No report selected." };

  const parsed = readReportCopy(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  let happenedAt: Date;
  try {
    happenedAt = londonWallClockToUtc(parsed.data.happenedAt);
  } catch {
    return { ok: false, error: "That date and time could not be read. Try again." };
  }

  try {
    await prisma.accidentReport.update({
      where: { id },
      data: {
        happenedAt,
        walkId: parsed.data.walkId ?? null,
        whatHappened: parsed.data.whatHappened,
        whoInvolved: parsed.data.whoInvolved,
        whatWeDid: parsed.data.whatWeDid,
        organiserNotes: parsed.data.organiserNotes ?? null,
      },
    });
  } catch (err) {
    if (isPrismaCode(err, "P2025")) return { ok: false, error: "That report is no longer there." };
    return logActionError("updateAccidentReport", err, "Could not save that report. Try again.");
  }

  revalidatePath("/admin/reports");
  return { ok: true, message: "Accident report saved." };
}

export async function deleteAccidentReport(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("reportId") ?? "");
  if (!id) return { ok: false, error: "No report selected." };

  try {
    await prisma.accidentReport.delete({ where: { id } });
  } catch (err) {
    if (isPrismaCode(err, "P2025")) return { ok: false, error: "That report is no longer there." };
    return logActionError("deleteAccidentReport", err, "Could not delete that report. Try again.");
  }

  revalidatePath("/admin/reports");
  return { ok: true, message: "Accident report removed." };
}
