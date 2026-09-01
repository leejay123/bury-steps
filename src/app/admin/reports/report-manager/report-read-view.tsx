import { formatWalkDay, formatTime } from "@/lib/dates";
import type { ReportView } from "./types";

export function ReportReadView({ report }: { report: ReportView }) {
  const at = new Date(report.happenedAt);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-y-contain px-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">When</p>
        <p className="text-sm">
          {formatWalkDay(at)} · {formatTime(at)}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">Walk</p>
        <p className="text-sm">{report.walkTitle || "No linked walk"}</p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">What happened</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed wrap-break-word">
          {report.whatHappened}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">Who was involved</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed wrap-break-word">
          {report.whoInvolved}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">What we did</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed wrap-break-word">
          {report.whatWeDid}
        </p>
      </div>
      {report.organiserNotes ? (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">Organiser notes</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed wrap-break-word">
            {report.organiserNotes}
          </p>
        </div>
      ) : null}
    </div>
  );
}
