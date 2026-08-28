"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronRight, Footprints, Search } from "lucide-react";
import { toast } from "sonner";
import { getMemberHistory, type MemberHistoryItem } from "@/server/actions";
import { formatDate, formatMembershipAge } from "@/lib/dates";
import { DeleteMemberButton } from "./delete-member-button";
import { EmptyState } from "@/components/empty-state";
import { AttendanceHistory } from "@/components/attendance-history";
import { DataList, DataListActions, DataListBody, DataListItem } from "@/components/data-list";
import { ListPagination } from "@/components/list-pagination";
import { usePagedList } from "@/hooks/use-paged-list";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<{
    name: string;
    email: string;
    role: "ADMIN" | "MEMBER";
    createdAt: string;
    items: MemberHistoryItem[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const requestRef = useRef(0);

  async function openMember(id: string) {
    const request = ++requestRef.current;
    setOpenId(id);
    setHistory(null);
    setLoading(true);
    try {
      const result = await getMemberHistory(id);
      if (request !== requestRef.current) return;
      if (!result) {
        toast.error("Could not find that member.");
        setOpenId(null);
        return;
      }
      setHistory(result);
    } catch {
      if (request !== requestRef.current) return;
      toast.error("Could not load that member’s walks.");
      setOpenId(null);
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }

  const selected = members.find((member) => member.id === openId);
  const joinedAt = history?.createdAt ?? selected?.createdAt;
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return members;
    return members.filter((member) => {
      const hay = `${member.name} ${member.email} ${member.role === "ADMIN" ? "organiser" : "member"}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [members, query]);

  const paging = usePagedList(filtered, { resetKey: query });

  return (
    <div className="flex flex-col gap-4" ref={listRef}>
      <InputGroup className="max-w-md">
        <InputGroupInput
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, email, or role…"
          value={query}
        />
        <InputGroupAddon>
          <Search data-icon="inline-start" />
        </InputGroupAddon>
      </InputGroup>

      {filtered.length === 0 ? (
        <EmptyState
          description="Try a different name, email, or role."
          icon={Search}
          title="No matching members"
        />
      ) : (
        <>
          <DataList>
            {paging.paged.map((member) => (
          <DataListItem key={member.id} onClick={() => openMember(member.id)}>
            <DataListBody>
              <p className="font-medium">
                {member.name}
                {member.isYou ? (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">You</span>
                ) : null}
              </p>
              <p className="text-sm text-muted-foreground wrap-break-word">
                {member.email || "No email"}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(new Date(member.createdAt))} ·{" "}
                {formatMembershipAge(new Date(member.createdAt))} · {member.attendanceCount}{" "}
                {member.attendanceCount === 1 ? "clock-in" : "clock-ins"}
              </p>
            </DataListBody>
            <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>
              {member.role === "ADMIN" ? "Organiser" : "Member"}
            </Badge>
            <DataListActions>
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
            </DataListActions>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </DataListItem>
            ))}
          </DataList>
          <ListPagination
            noun="members"
            onPageChange={paging.setPage}
            page={paging.page}
            pageCount={paging.pageCount}
            pageSize={paging.pageSize}
            scrollToRef={listRef}
            total={paging.total}
          />
        </>
      )}

      <Drawer
        onOpenChange={(open) => {
          if (!open) {
            requestRef.current += 1;
            setLoading(false);
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
            {loading && !history ? (
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
    </div>
  );
}
