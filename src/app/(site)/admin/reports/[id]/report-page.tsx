"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Pencil, Printer } from "lucide-react";
import { DescriptionText } from "@/components/description-text";
import { EDGE_FILTER, EdgeBar } from "@/components/edge-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatTime, formatWalkDay } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { AdminPageIntro } from "../../admin-page-intro";
import { SettingsSection } from "../../settings/settings-page";
import { EditForm } from "../report-manager/report-form";
import { ReportRetentionToggle } from "../report-manager/report-retention-toggle";
import type { ReportView, WalkOption } from "../report-manager/types";

const TEXT = "typeset typeset-docs block wrap-break-word";

/**
 * One accident report as its own page (design A): the page top, a strip with the way back,
 * Edit and Print, the details as three cells, then a band per part of the write-up.
 */
export function ReportPage({
  canEdit,
  canViewMembers,
  createdBy,
  report,
  walks,
}: {
  canEdit: boolean;
  canViewMembers: boolean;
  createdBy: string;
  report: ReportView;
  walks: WalkOption[];
}) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const at = new Date(report.happenedAt);
  const when = `${formatWalkDay(at)} · ${formatTime(at)}`;

  return (
    <>
      <AdminPageIntro description={`${report.walkTitle || "Not linked to a walk"} · ${when}`} title="Accident report" />
      {/* One block under the page top, so the strip and bands sit right under it, edge to edge. */}
      <div className="flex flex-col">
      <EdgeBar edgeTop>
        <Link
          className={cn(EDGE_FILTER, "inline-flex items-center gap-2 border-l-0! px-4 text-sm hover:bg-accent")}
          href="/admin/reports"
        >
          <ChevronLeft aria-hidden className="size-4" />
          All reports
        </Link>
        <div className="ms-auto flex">
          {canEdit ? (
            <Button className={cn(EDGE_FILTER, "px-4")} onClick={() => setEditing(true)} type="button" variant="ghost">
              <Pencil />
              Edit
            </Button>
          ) : null}
          <Button asChild className={cn(EDGE_FILTER, "px-4")} variant="ghost">
            <a href={`/admin/reports/${report.id}/print`} rel="noreferrer" target="_blank">
              <Printer />
              Print / Save PDF
            </a>
          </Button>
        </div>
      </EdgeBar>

      <div className="grid gap-4 sm:grid-cols-3" data-edge-stats="">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">When</p>
          <p className="font-medium">{when}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Walk</p>
          <p className="font-medium">{report.walkTitle || "Not linked to a walk"}</p>
          {report.walkLocation ? <p className="text-sm text-muted-foreground">{report.walkLocation}</p> : null}
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Recorded by</p>
          <p className="font-medium">{createdBy}</p>
        </div>
      </div>

      <SettingsSection title="What happened">
        <DescriptionText className={TEXT} text={report.whatHappened} />
      </SettingsSection>
      <SettingsSection title="Who was involved">
        {report.involvedMembers.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {report.involvedMembers.map((member) =>
              canViewMembers ? (
                <Badge asChild key={member.id} variant="secondary">
                  <Link href={`/admin/members/${member.id}`}>{member.name}</Link>
                </Badge>
              ) : (
                <Badge key={member.id} variant="secondary">
                  {member.name}
                </Badge>
              ),
            )}
          </div>
        ) : null}
        {report.whoInvolved ? <DescriptionText className={TEXT} text={report.whoInvolved} /> : null}
      </SettingsSection>
      <SettingsSection title="What we did">
        <DescriptionText className={TEXT} text={report.whatWeDid} />
      </SettingsSection>
      {report.organiserNotes ? (
        <SettingsSection title="Organiser notes">
          <DescriptionText className={TEXT} text={report.organiserNotes} />
        </SettingsSection>
      ) : null}
      {canEdit ? (
        <SettingsSection title="Automatic deletion">
          <ReportRetentionToggle locked={report.retentionLocked} reportId={report.id} />
        </SettingsSection>
      ) : null}

      </div>

      {canEdit ? (
        <Drawer closeDisabled={pending} onOpenChange={setEditing} open={editing} variant="form">
          <DrawerContent className="min-h-0">
            <DrawerHeader className="shrink-0">
              <DrawerTitle>Edit report</DrawerTitle>
              <DrawerDescription>Change the details, then save.</DrawerDescription>
            </DrawerHeader>
            {editing ? (
              <EditForm
                onCancel={() => setEditing(false)}
                onPendingChange={setPending}
                onSaved={() => setEditing(false)}
                report={report}
                walks={walks}
              />
            ) : null}
          </DrawerContent>
        </Drawer>
      ) : null}
    </>
  );
}
