"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { formatDate, formatMembershipAge } from "@/lib/dates";
import { DeleteMemberButton } from "./delete-member-button";
import { MemberRoleButton } from "./member-role-button";
import { EmptyState } from "@/components/empty-state";
import { DataList, DataListActions, DataListBody, DataListItem } from "@/components/data-list";
import { ListPagination } from "@/components/list-pagination";
import { useUrlListState } from "@/hooks/use-url-list-state";
import { Badge } from "@/components/ui/badge";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

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

export function MembersTable({
  members,
  page,
  pageCount,
  pageSize,
  total,
}: {
  /** Already the current page's rows, filtered and paginated on the server. */
  members: MemberRow[];
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const { query, setQuery, setPage, isPending } = useUrlListState();

  return (
    <div className="flex flex-col gap-4" ref={listRef}>
      <InputGroup className="max-w-md">
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

      {members.length === 0 ? (
        <EmptyState
          description="Try a different name, email, or role."
          icon={Search}
          title="No matching members"
        />
      ) : (
        <>
          <DataList aria-busy={isPending} className={isPending ? "opacity-60" : undefined}>
            {members.map((member) => (
              <DataListItem className="relative" key={member.id}>
                <DataListBody>
                  <p className="font-medium">
                    <Link className="after:absolute after:inset-0" href={`/admin/members/${member.id}`}>
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
                <Badge
                  className="h-7 px-2"
                  variant={member.role === "ADMIN" ? "default" : "secondary"}
                >
                  {member.role === "ADMIN" ? "Organiser" : "Member"}
                </Badge>
                {/* relative z-10: sits above the row's full-cover Link overlay so
                Remove stays clickable instead of triggering navigation. */}
                <DataListActions className="relative z-10">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <MemberRoleButton name={member.name} role={member.role} userId={member.id} />
                    {member.isYou ? null : (
                      <DeleteMemberButton
                        attendanceCount={member.attendanceCount}
                        name={member.name}
                        userId={member.id}
                        walkCount={member.walkCount}
                      />
                    )}
                  </div>
                </DataListActions>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </DataListItem>
            ))}
          </DataList>
          <ListPagination
            noun="members"
            onPageChange={setPage}
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            scrollToRef={listRef}
            total={total}
          />
        </>
      )}
    </div>
  );
}
