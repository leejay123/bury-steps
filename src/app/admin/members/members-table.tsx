"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { formatDate, formatMembershipAge } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { DeleteMemberButton } from "./delete-member-button";
import { MemberRoleButton } from "./member-role-button";
import { EmptyState } from "@/components/empty-state";
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
import { useUrlListState } from "@/hooks/use-url-list-state";
import { Badge } from "@/components/ui/badge";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

function matchesMemberQuery(member: MemberRow, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  if (member.name.toLowerCase().includes(needle)) return true;
  if (member.email.toLowerCase().includes(needle)) return true;
  if (needle.length >= 3) {
    if (
      ("organiser".startsWith(needle) || "admin".startsWith(needle)) &&
      member.role === "ADMIN"
    ) {
      return true;
    }
    if ("member".startsWith(needle) && member.role === "MEMBER") return true;
  }
  return false;
}

export function MembersTable({
  members,
  roleFilter,
  totalMembers,
}: {
  /** Role-filtered rows — search is client-only (no PII in the URL). */
  members: MemberRow[];
  roleFilter: "all" | "ADMIN" | "MEMBER";
  totalMembers: number;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const { query, setQuery, setFilter } = useUrlListState({ syncQueryToUrl: false });
  const filtered = useMemo(
    () => members.filter((member) => matchesMemberQuery(member, query)),
    [members, query],
  );
  const paging = usePagedList(filtered, { resetKey: `${roleFilter}:${query}` });

  return (
    <div className="flex flex-col gap-4" ref={listRef}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <InputGroup className="w-full min-w-0 sm:flex-1">
          <InputGroupInput
            aria-label="Search members"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email, or role…"
            value={query}
          />
          <InputGroupAddon>
            <Search data-icon="inline-start" />
          </InputGroupAddon>
        </InputGroup>
        <div className="flex shrink-0 flex-col gap-1.5">
          <Label htmlFor="member-role-filter">Role</Label>
          <Select onValueChange={(value) => setFilter("role", value, "all")} value={roleFilter}>
            <SelectTrigger className="w-full sm:w-[11rem]" id="member-role-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="ADMIN">Organisers</SelectItem>
              <SelectItem value="MEMBER">Members</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          description={
            totalMembers === 0
              ? "When someone signs up, they will show here."
              : "Try a different name, email, or role."
          }
          icon={Search}
          title="No matching members"
        />
      ) : (
        <>
          <DataList>
            {paging.paged.map((member) => (
              <DataListItem
                className={cn("relative", dataListItemStackClassName)}
                key={member.id}
              >
                <DataListItemMain>
                  <DataListBody>
                    <p className="font-medium">
                      <Link
                        className="after:absolute after:inset-0"
                        href={`/admin/members/${member.id}`}
                      >
                        {member.name}
                      </Link>
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
                  <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground sm:mt-0" />
                </DataListItemMain>
                {/* relative z-10: sits above the row's full-cover Link overlay so
                Remove stays clickable instead of triggering navigation. */}
                <DataListActions
                  className={cn("relative z-10 flex-wrap gap-2", dataListActionsStackClassName)}
                >
                  <Badge
                    className="h-7 px-2"
                    variant={member.role === "ADMIN" ? "default" : "secondary"}
                  >
                    {member.role === "ADMIN" ? "Organiser" : "Member"}
                  </Badge>
                  <MemberRoleButton name={member.name} role={member.role} userId={member.id} />
                  {member.isYou ? null : (
                    <DeleteMemberButton
                      attendanceCount={member.attendanceCount}
                      name={member.name}
                      userId={member.id}
                      walkCount={member.walkCount}
                    />
                  )}
                </DataListActions>
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
    </div>
  );
}
