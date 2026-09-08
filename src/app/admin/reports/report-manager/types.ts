export type InvolvedMember = { id: string; name: string };

export type ReportView = {
  id: string;
  happenedAt: string;
  walkId: string | null;
  walkTitle: string | null;
  walkLocation: string | null;
  whatHappened: string;
  whoInvolved: string;
  involvedMembers: InvolvedMember[];
  whatWeDid: string;
  organiserNotes: string | null;
};

export type WalkOption = { id: string; title: string; startsAt: string };

export function matchesReportQuery(report: ReportView, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    report.whatHappened,
    report.whoInvolved,
    ...report.involvedMembers.map((member) => member.name),
    report.whatWeDid,
    report.organiserNotes ?? "",
    report.walkTitle ?? "",
    report.walkLocation ?? "",
  ]
    .join("\n")
    .toLowerCase();
  return haystack.includes(needle);
}
