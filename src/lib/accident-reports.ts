import { memberDisplayName } from "@/lib/auth";
import { initials } from "@/lib/names";

/** Initials used as the report-number prefix (Tom Robert → TR). */
export function reportNumberPrefix(name: string): string {
  return initials(name) || "XX";
}

/**
 * Which tagged member the report number belongs to. Several people can be
 * involved; the number is still one person's (TR001, then TR002).
 */
export function numberedForMemberId(
  involvedMemberIds: string[],
  requested: string | undefined,
): { ok: true; userId: string | null } | { ok: false; error: string } {
  if (involvedMemberIds.length === 0) return { ok: true, userId: null };
  if (involvedMemberIds.length === 1) return { ok: true, userId: involvedMemberIds[0] };
  if (!requested || !involvedMemberIds.includes(requested)) {
    return { ok: false, error: "Pick who this report is numbered for." };
  }
  return { ok: true, userId: requested };
}

/** Next number for those initials: TR001, then TR002. Other people's numbers are ignored. */
export function nextAccidentReportNumber(prefix: string, existing: string[]): string {
  let highest = 0;
  for (const value of existing) {
    if (!value.startsWith(prefix)) continue;
    const digits = value.slice(prefix.length);
    if (!/^\d+$/.test(digits)) continue;
    highest = Math.max(highest, Number(digits));
  }
  return `${prefix}${String(highest + 1).padStart(3, "0")}`;
}

/** Combines the free-text "who was involved" field and tagged members into
 * one line — for the alert email and the printed report, which show plain
 * text rather than the admin UI's separate badges + free text. */
export function involvedSummaryText(
  whoInvolved: string | null | undefined,
  involvedMembers: { user: { firstName: string | null; lastName: string | null } }[],
): string {
  const names = involvedMembers.map((row) => memberDisplayName(row.user));
  return [...names, whoInvolved].filter(Boolean).join(", ");
}
