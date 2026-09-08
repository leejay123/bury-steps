"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, displayName } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime, londonWallClockToUtc } from "@/lib/dates";
import { sendAccidentReportAlertEmail } from "@/lib/email/mailer";
import { involvedSummaryText } from "@/lib/accident-reports";
import { getWalkAttendeesForReport } from "@/lib/walk-members";
import { type ActionResult, isPrismaCode, logActionError } from "./shared";

/** Powers the member checklist on the report form once a walk is picked —
 * a plain data fetch, not a mutation, but still gated on admin auth since
 * it's called directly from the client as a server action. */
export async function getWalkAttendeesForReportForm(
  walkId: string,
): Promise<{ id: string; name: string }[]> {
  await requireAdmin();
  if (!walkId) return [];
  return getWalkAttendeesForReport(walkId);
}

const reportCopySchema = z.object({
  happenedAt: z.string().min(16, "Choose a date and time."),
  walkId: z.string().optional(),
  whatHappened: z.string().trim().min(3, "Say what happened.").max(4000),
  // No .min() here — someone can be fully identified via involvedMemberIds
  // (the tagged-member checklist) with nothing left to type. Validated
  // together with involvedMemberIds below instead.
  whoInvolved: z.string().trim().max(1000).optional(),
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
    whoInvolved: String(formData.get("whoInvolved") ?? "").trim() || undefined,
    whatWeDid: formData.get("whatWeDid"),
    organiserNotes: String(formData.get("organiserNotes") ?? "").trim() || undefined,
  });
}

/** Tagged members plus free text must add up to *someone* — same rule the
 * old whoInvolved-only field enforced with its own .min(2). */
function readInvolvedMemberIds(formData: FormData): string[] {
  return [...new Set(formData.getAll("involvedMemberIds").map(String).filter(Boolean))];
}


export async function addAccidentReport(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const parsed = readReportCopy(formData);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const involvedMemberIds = readInvolvedMemberIds(formData);
  if (!parsed.data.whoInvolved && involvedMemberIds.length === 0) {
    return { ok: false, error: "Say who was involved, or tag at least one member." };
  }

  let happenedAt: Date;
  try {
    happenedAt = londonWallClockToUtc(parsed.data.happenedAt);
  } catch {
    return { ok: false, error: "That date and time could not be read. Try again." };
  }

  let walkTitle: string | null;
  let involvedSummary: string;
  try {
    const created = await prisma.accidentReport.create({
      data: {
        happenedAt,
        walkId: parsed.data.walkId ?? null,
        whatHappened: parsed.data.whatHappened,
        whoInvolved: parsed.data.whoInvolved ?? "",
        whatWeDid: parsed.data.whatWeDid,
        organiserNotes: parsed.data.organiserNotes ?? null,
        createdById: admin.id,
        involvedMembers: { create: involvedMemberIds.map((userId) => ({ userId })) },
      },
      select: {
        walk: { select: { title: true } },
        involvedMembers: { select: { user: { select: { firstName: true, lastName: true } } } },
      },
    });
    walkTitle = created.walk?.title ?? null;
    involvedSummary = involvedSummaryText(parsed.data.whoInvolved, created.involvedMembers);
  } catch (err) {
    // An invalid/stale walkId (e.g. the walk was deleted between loading
    // the form and submitting it) fails the foreign key here rather than
    // earlier, since it's optional and not re-checked above.
    return logActionError("addAccidentReport", err, "Could not save that report. Try again.");
  }

  revalidatePath("/admin/reports");

  await notifyOtherAdminsOfAccidentReport({
    whenText: formatDateTime(happenedAt),
    walkTitle,
    whoInvolved: involvedSummary,
    createdByName: displayName(admin),
    excludeAdminId: admin.id,
  });

  return { ok: true, message: "Accident report saved." };
}

async function notifyOtherAdminsOfAccidentReport(report: {
  whenText: string;
  walkTitle: string | null;
  whoInvolved: string;
  createdByName: string;
  excludeAdminId: string;
}): Promise<void> {
  try {
    const otherAdmins = await prisma.user.findMany({
      where: { role: "ADMIN", id: { not: report.excludeAdminId }, emailAccidentAlerts: true },
      select: { email: true },
    });
    await sendAccidentReportAlertEmail(report, otherAdmins.map((admin) => admin.email));
  } catch (err) {
    console.error("addAccidentReport: failed to notify other organisers", err);
  }
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

  const involvedMemberIds = readInvolvedMemberIds(formData);
  if (!parsed.data.whoInvolved && involvedMemberIds.length === 0) {
    return { ok: false, error: "Say who was involved, or tag at least one member." };
  }

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
        whoInvolved: parsed.data.whoInvolved ?? "",
        whatWeDid: parsed.data.whatWeDid,
        organiserNotes: parsed.data.organiserNotes ?? null,
        // Replace wholesale rather than diff — simplest correct way to
        // reconcile the checklist's current state with what's stored.
        involvedMembers: {
          deleteMany: {},
          create: involvedMemberIds.map((userId) => ({ userId })),
        },
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
