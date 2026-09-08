import { memberDisplayName } from "@/lib/auth";

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
