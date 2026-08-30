"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { formatDateTime, formatTime } from "@/lib/dates";
import {
  DataList,
  DataListActions,
  DataListBody,
  DataListItem,
  DataListItemMain,
  dataListActionsStackClassName,
  dataListItemStackClassName,
} from "@/components/data-list";
import { ListPagination } from "@/components/list-pagination";
import { usePagedList } from "@/hooks/use-paged-list";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  clockedInAt: string;
  clockedOutAt: string | null;
  clockedOutReason: string | null;
  conditions: string | null;
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
  rows,
  walkCompleted = false,
  canRemove = false,
}: {
  rows: WalkAttendanceRow[];
  /** Pass true once the walk's clock-in window has fully closed. */
  walkCompleted?: boolean;
  /** Organiser can delete a mistaken clock-in (not on cancelled walks). */
  canRemove?: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const selected = rows.find((row) => row.id === openId) ?? null;
  const listRef = useRef<HTMLDivElement>(null);
  const paging = usePagedList(rows);

  useEffect(() => {
    if (openId && !rows.some((row) => row.id === openId)) {
      setOpenId(null);
    }
  }, [openId, rows]);

  return (
    <div className="flex flex-col gap-4" ref={listRef}>
      <DataList>
        {paging.paged.map((row) => (
          <DataListItem
            className={dataListItemStackClassName}
            key={row.id}
            onClick={() => setOpenId(row.id)}
          >
            <DataListItemMain className="items-center">
              <Avatar className="size-7 shrink-0">
                <AvatarFallback className="text-xs">{row.initials}</AvatarFallback>
              </Avatar>
              <DataListBody>
                <p className="font-medium">{row.name}</p>
                <p className="text-sm text-muted-foreground wrap-break-word">{row.email}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatTime(new Date(row.clockedInAt))}
                </p>
              </DataListBody>
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
        <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-lg">
          <DrawerHeader>
            <DrawerTitle>{selected?.name ?? "Member"}</DrawerTitle>
            <DrawerDescription>
              Clock-in details for this walk. Health notes and clock-out reasons are only for
              organisers.
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
              <Detail label="Clocked in">{formatDateTime(new Date(selected.clockedInAt))}</Detail>
              <Detail label="Clocked out">
                {selected.clockedOutAt
                  ? formatDateTime(new Date(selected.clockedOutAt))
                  : walkCompleted
                    ? "Stayed for the whole walk"
                    : "Still on the walk"}
              </Detail>
              {selected.clockedOutReason ? (
                <Detail label="Clock-out reason">{selected.clockedOutReason}</Detail>
              ) : null}
              <Detail label="Health notes">
                {selected.conditions ? selected.conditions : "No conditions reported"}
              </Detail>
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
