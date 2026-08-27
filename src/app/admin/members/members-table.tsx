"use client";

import { useState, useTransition } from "react";
import { ChevronRight, Footprints } from "lucide-react";
import { toast } from "sonner";
import { getMemberHistory, type MemberHistoryItem } from "@/server/actions";
import { formatDate, formatMembershipAge } from "@/lib/dates";
import { DeleteMemberButton } from "./delete-member-button";
import { EmptyState } from "@/components/empty-state";
import { AttendanceHistory } from "@/components/attendance-history";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type MemberRow = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  createdAt: string;
  attendanceCount: number;
  walkCount: number;
  isYou: boolean;
};

export function MembersTable({ members }: { members: MemberRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [history, setHistory] = useState<{
    name: string;
    email: string;
    role: "ADMIN" | "MEMBER";
    createdAt: string;
    items: MemberHistoryItem[];
  } | null>(null);
  const [pending, startTransition] = useTransition();

  function openMember(id: string) {
    setOpenId(id);
    setHistory(null);
    startTransition(async () => {
      try {
        const result = await getMemberHistory(id);
        if (!result) {
          toast.error("Could not find that member.");
          setOpenId(null);
          return;
        }
        setHistory(result);
      } catch {
        toast.error("Could not load that member’s walks.");
        setOpenId(null);
      }
    });
  }

  const selected = members.find((member) => member.id === openId);
  const joinedAt = history?.createdAt ?? selected?.createdAt;

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Clock-ins</TableHead>
            <TableHead className="w-20 text-right">
              <span className="sr-only">Remove</span>
            </TableHead>
            <TableHead className="w-8">
              <span className="sr-only">Open</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            return (
              <TableRow
                className="cursor-pointer"
                key={member.id}
                onClick={() => openMember(member.id)}
              >
                <TableCell className="font-medium">
                  {member.name}
                  {member.isYou ? (
                    <span className="ml-2 text-xs text-muted-foreground">You</span>
                  ) : null}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {member.email || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>
                    {member.role === "ADMIN" ? "Organiser" : "Member"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <div className="flex flex-col">
                    <span className="whitespace-nowrap tabular-nums">
                      {formatDate(new Date(member.createdAt))}
                    </span>
                    <span className="whitespace-nowrap text-xs">
                      {formatMembershipAge(new Date(member.createdAt))}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{member.attendanceCount}</TableCell>
                <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                  {member.isYou ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <DeleteMemberButton
                      attendanceCount={member.attendanceCount}
                      name={member.name}
                      userId={member.id}
                      walkCount={member.walkCount}
                    />
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <ChevronRight className="size-4" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Drawer
        direction="right"
        onOpenChange={(open) => {
          if (!open) {
            setOpenId(null);
            setHistory(null);
          }
        }}
        open={openId !== null}
      >
        <DrawerContent className="data-[vaul-drawer-direction=right]:sm:max-w-2xl">
          <DrawerHeader>
            <DrawerTitle>{history?.name ?? selected?.name ?? "Member"}</DrawerTitle>
            <DrawerDescription>
              {joinedAt
                ? `Joined ${formatDate(new Date(joinedAt))} · member for ${formatMembershipAge(new Date(joinedAt))}.`
                : "Walk history."}
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-6">
            {pending && !history ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : null}
            {history && history.items.length === 0 ? (
              <EmptyState
                description="When they clock in to a walk, it will show here."
                icon={Footprints}
                title="No walks yet"
              />
            ) : null}
            {history && history.items.length > 0 ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  {history.email || "No email"}
                  {" · "}
                  {history.items.length === 1
                    ? "1 walk"
                    : `${history.items.length} walks`}
                  {" · First clock-in "}
                  {formatDate(new Date(history.items[history.items.length - 1].clockedInAt))}
                </p>
                <AttendanceHistory
                  layout="list"
                  rows={history.items.map((item) => ({
                    id: item.id,
                    title: item.walkTitle,
                    location: item.location,
                    startsAt: item.startsAt,
                    durationMins: item.durationMins,
                    cancelledAt: item.cancelledAt,
                    clockedInAt: item.clockedInAt,
                    clockedOutAt: item.clockedOutAt,
                    clockedOutReason: item.clockedOutReason,
                    href: `/admin/walks/${item.walkId}`,
                  }))}
                />
              </div>
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
