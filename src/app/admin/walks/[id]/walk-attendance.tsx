"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { formatDateTime, formatTime } from "@/lib/dates";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export function WalkAttendanceTable({ rows }: { rows: WalkAttendanceRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const selected = rows.find((row) => row.id === openId) ?? null;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24 text-right">Time</TableHead>
            <TableHead className="w-8">
              <span className="sr-only">Open</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} onClick={() => setOpenId(row.id)}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-7">
                    <AvatarFallback className="text-xs">{row.initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{row.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{row.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {row.clockedOutAt ? (
                  <Badge variant="secondary">Clocked out</Badge>
                ) : (
                  <Badge variant="outline">On the walk</Badge>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatTime(new Date(row.clockedInAt))}
              </TableCell>
              <TableCell className="text-muted-foreground">
                <ChevronRight className="size-4" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Drawer
        direction="right"
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
            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-6">
              <Detail label="Email">{selected.email || "—"}</Detail>
              <Detail label="Status">
                {selected.clockedOutAt ? (
                  <Badge variant="secondary">Clocked out</Badge>
                ) : (
                  <Badge variant="outline">On the walk</Badge>
                )}
              </Detail>
              <Detail label="Clocked in">{formatDateTime(new Date(selected.clockedInAt))}</Detail>
              <Detail label="Clocked out">
                {selected.clockedOutAt
                  ? formatDateTime(new Date(selected.clockedOutAt))
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
    </>
  );
}
