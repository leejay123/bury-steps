import { memberDisplayName } from "@/lib/auth";
import { initials } from "@/lib/names";

/** Initials used as the report-number prefix (Tom Robert → TR). */
export function reportNumberPrefix(name: string): string {
  return initials(name) || "XX";
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
