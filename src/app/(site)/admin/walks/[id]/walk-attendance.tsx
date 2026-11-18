"use client";

import { Fragment, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { formatTime, formatWalkDate } from "@/lib/dates";
import { emergencyPhoneHref } from "@/lib/emergency-contact";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import {
  DataList,
  DataListActions,
  DataListBody,
  DataListGroupHeader,
  DataListItem,
  DataListItemMain,
  dataListActionsStackClassName,
  dataListItemStackClassName,
} from "@/components/data-list";
import { ListPagination } from "@/components/list-pagination";
import { usePagedList } from "@/hooks/use-paged-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { RemoveAttendanceButton } from "./remove-attendance-button";

export type WalkAttendanceRow = {
  id: string;
  name: string;
  email: string;
  initials: string;
  /** Their profile photo, if they have one (initials otherwise). */
  imageUrl?: string | null;
  clockedInAt: string;
  clockedOutAt: string | null;
  clockedOutReason: string | null;
  conditions: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
};

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

/**
 * Label for someone who never clocked out. While the walk is still open,
 * that genuinely means they're out there right now. Once the walk itself
 * has finished (its clock-in window has closed), it just means they walked
 * the whole thing without bothering to clock out — "On the walk" would be
 * actively wrong at that point, since the walk is over.
 */
function stillInLabel(walkCompleted: boolean) {
  return walkCompleted ? "Attended" : "On the walk";
}

export function WalkAttendanceTable({
  canRemove = false,
  canSeeEmergencyContact = false,
  canSeeHealthNotes = false,
  heading,
  more = null,
  note = null,
  rows,
  walkCompleted = false,
}: {
  /** A second group (Clocked out) in the same list, under its own header strip —
   * one list, so one line between the groups and no gap (two lists stacked left a
   * missing line and a blank strip between them). */
  more?: { heading: { count: number; label: string }; rows: WalkAttendanceRow[] } | null;
  /** Organiser can delete a mistaken clock-in (not on cancelled walks). */
  canRemove?: boolean;
  /** Attendance access — name and phone from clock-in. Hidden entirely
   * otherwise, including for someone who only opened this walk from Members. */
  canSeeEmergencyContact?: boolean;
  /** permWalksHealth — hides the health-notes row in the detail drawer
   * entirely for an organiser without it, rather than showing an empty
   * or placeholder value. */
  canSeeHealthNotes?: boolean;
  /** Grouped-header strip at the top of the list, same style as the
   * Members list's role sections (see DataListGroupHeader) — "Attendance"
   * or "Clocked out", with a live count. */
  heading: { count: number; label: string };
  /** A line under the header strip, inside the list (e.g. "1 member has
   * reported a condition · Read these before setting off…"). */
  note?: { title: string; text: string } | null;
  rows: WalkAttendanceRow[];
  /** Pass true once the walk's clock-in window has fully closed. */
  walkCompleted?: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  // A-Z by name, same ordering the Members list uses — clock time is still
  // visible per-row, just not what determines row order any more.
  const byName = (a: WalkAttendanceRow, b: WalkAttendanceRow) => a.name.localeCompare(b.name);
  const sortedRows = [
    ...[...rows].sort(byName).map((row) => ({ row, group: 0 })),
    ...[...(more?.rows ?? [])].sort(byName).map((row) => ({ row, group: 1 })),
  ];
  const selected = sortedRows.find((item) => item.row.id === openId)?.row ?? null;
  const listRef = useRef<HTMLDivElement>(null);
  const paging = usePagedList(sortedRows);

  useResetOnChange([openId, rows, more?.rows], () => {
    if (openId && !sortedRows.some((item) => item.row.id === openId)) {
      setOpenId(null);
    }
  });

  return (
    <div className="flex flex-col gap-4" ref={listRef}>
      <DataList>
        {paging.page === 1 || paging.paged[0]?.group === 0 ? (
          <DataListGroupHeader count={heading.count} label={heading.label} />
        ) : null}
        {note && paging.page === 1 ? (
          // One line: the title, then the rest (no dot between them).
          <li className="border-b px-3 py-2 text-sm">
            <span className="font-medium">{note.title}.</span>{" "}
            <span className="text-muted-foreground">{note.text}</span>
          </li>
        ) : null}
        {paging.paged.map(({ row, group }, index) => (
          <Fragment key={row.id}>
          {group === 1 && more && (index === 0 || paging.paged[index - 1]?.group !== 1) ? (
            <DataListGroupHeader count={more.heading.count} label={more.heading.label} />
          ) : null}
          <DataListItem
            className={dataListItemStackClassName}
            onClick={() => setOpenId(row.id)}
          >
            <DataListItemMain className="items-center">
              <Avatar className="size-7 shrink-0">
                {row.imageUrl ? <AvatarImage alt="" src={row.imageUrl} /> : null}
                <AvatarFallback className="text-xs">{row.initials}</AvatarFallback>
              </Avatar>
              <DataListBody>
                <p className="font-medium">{row.name}</p>
                <p className="text-sm text-muted-foreground wrap-break-word">{row.email}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatTime(new Date(row.clockedInAt))}
                </p>
              </DataListBody>
              {/* Easy to spot on a long list: who reported a condition
                  (only for those allowed to read health notes). */}
              {canSeeHealthNotes && row.conditions ? (
                <Badge variant="secondary">Condition</Badge>
              ) : null}
              {row.clockedOutAt ? (
                <Badge variant="secondary">Clocked out</Badge>
              ) : (
                <Badge variant="outline">{stillInLabel(walkCompleted)}</Badge>
              )}
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </DataListItemMain>
            {canRemove ? (
              <DataListActions className={dataListActionsStackClassName}>
                <RemoveAttendanceButton
                  attendanceId={row.id}
                  memberName={row.name}
                  onRemoved={() =>
                    setOpenId((current) => (current === row.id ? null : current))
                  }
                />
              </DataListActions>
            ) : null}
          </DataListItem>
          </Fragment>
        ))}
      </DataList>
      <ListPagination
        noun="people"
        onPageChange={paging.setPage}
        page={paging.page}
        pageCount={paging.pageCount}
        pageSize={paging.pageSize}
        scrollToRef={listRef}
        total={paging.total}
      />

      <Drawer
        onOpenChange={(open) => {
          if (!open) setOpenId(null);
        }}
        open={openId !== null}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{selected?.name ?? "Member"}</DrawerTitle>
            <DrawerDescription>
              {canSeeHealthNotes
                ? "Clock-in details for this walk. Health notes are only for organisers with that permission. The emergency contact is for organisers."
                : "Clock-in details for this walk. The emergency contact is for organisers."}
            </DrawerDescription>
          </DrawerHeader>
          {selected ? (
            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-y-contain px-4 pb-6">
              <Detail label="Email">{selected.email || "—"}</Detail>
              <Detail label="Status">
                {selected.clockedOutAt ? (
                  <Badge variant="secondary">Clocked out</Badge>
                ) : (
                  <Badge variant="outline">{stillInLabel(walkCompleted)}</Badge>
                )}
              </Detail>
              <Detail label="Clocked in">{formatWalkDate(selected.clockedInAt)}</Detail>
              <Detail label="Clocked out">
                {selected.clockedOutAt
                  ? formatWalkDate(selected.clockedOutAt)
                  : walkCompleted
                    ? "Stayed for the whole walk"
                    : "Still on the walk"}
              </Detail>
              {selected.clockedOutReason ? (
                <Detail label="Clock-out reason">{selected.clockedOutReason}</Detail>
              ) : null}
              {canSeeHealthNotes ? (
                <Detail label="Health notes">
                  {selected.conditions ? selected.conditions : "No conditions reported"}
                </Detail>
              ) : null}
              {canSeeEmergencyContact ? (
                <Detail label="Emergency contact">
                  {selected.emergencyContactName && selected.emergencyContactPhone ? (
                    <p>
                      {selected.emergencyContactName}
                      {" · "}
                      <a
                        className="underline underline-offset-2"
                        href={emergencyPhoneHref(selected.emergencyContactPhone)}
                      >
                        {selected.emergencyContactPhone}
                      </a>
                    </p>
                  ) : (
                    "None on file"
                  )}
                </Detail>
              ) : null}
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
