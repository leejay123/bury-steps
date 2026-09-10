"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Search } from "lucide-react";
import { formatDate, formatMembershipAge } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { searchMembers, type MemberRoleFilter, type MemberRow } from "@/server/actions";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
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

type ViewMember = MemberRow & { isYou: boolean };

/**
 * Search and paging both run server-side via `searchMembers`, so this stays
 * correct — and, once the trigram search index is in, fast — no matter how
 * many members the group has, rather than only up to some fetch cap.
 * Search text is deliberately kept off the URL (it can be a name or email)
 * — it's only ever sent as a server action argument.
 */
export function MembersTable({
  initialRows,
  initialTotal,
  roleFilter,
  viewerId,
}: {
  initialRows: ViewMember[];
  initialTotal: number;
  roleFilter: MemberRoleFilter;
  viewerId: string;
}) {
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [isPending, startTransition] = useTransition();

  // A full navigation changes roleFilter/initialRows — drop back to page 1,
  // no search, and the fresh server-rendered rows for that role.
  useResetOnChange([roleFilter], () => {
    setQuery("");
    setPage(1);
    setRows(initialRows);
    setTotal(initialTotal);
  });

  useEffect(() => {
    const handle = setTimeout(
      () => {
        startTransition(async () => {
          const result = await searchMembers({ page, query, role: roleFilter });
          setRows(result.rows.map((row) => ({ ...row, isYou: row.id === viewerId })));
          setTotal(result.total);
        });
      },
      query === "" && page === 1 ? 0 : 300,
    );
    return () => clearTimeout(handle);
  }, [query, page, roleFilter, viewerId]);

  function handleQueryChange(next: string) {
    setQuery(next);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(total / LIST_PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4" ref={listRef}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <InputGroup className="w-full min-w-0 sm:flex-1">
          <InputGroupInput
            aria-label="Search members"
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder="Search by name, email, or role…"
            value={query}
          />
          <InputGroupAddon>
            <Search data-icon="inline-start" />
          </InputGroupAddon>
        </InputGroup>
        <div className="flex shrink-0 flex-col gap-1.5">
          <Label htmlFor="member-role-filter">Role</Label>
          <Select
            onValueChange={(value) => {
              const params = new URLSearchParams();
              if (value !== "all") params.set("role", value);
              const qs = params.toString();
              router.push(`/admin/members${qs ? `?${qs}` : ""}`);
            }}
            value={roleFilter}
          >
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

      {rows.length === 0 && !isPending ? (
        <EmptyState
          description={
            total === 0 && !query
              ? "When someone signs up, they will show here."
              : "Try a different name, email, or role."
          }
          icon={Search}
          title="No matching members"
        />
      ) : (
        <>
          <DataList className={cn(isPending && "opacity-60")}>
            {rows.map((member) => (
              <DataListItem className={cn("relative", dataListItemStackClassName)} key={member.id}>
                <DataListItemMain>
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
                  <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground sm:mt-0" />
                </DataListItemMain>
                <DataListActions
                  className={cn("relative z-10 flex-wrap gap-2", dataListActionsStackClassName)}
                >
                  <Badge className="h-7 px-2" variant={member.role === "ADMIN" ? "default" : "secondary"}>
                    {member.role === "ADMIN" ? "Organiser" : "Member"}
                  </Badge>
                  {/* Changing your own role here would be easy to hit by
                      mistake and immediately cost you organiser access to
                      fix it — same reasoning as hiding your own Remove
                      button below. Another organiser can change it for you
                      instead. */}
                  {member.isYou ? null : (
                    <MemberRoleButton name={member.name} role={member.role} userId={member.id} />
                  )}
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
            onPageChange={setPage}
            page={page}
            pageCount={pageCount}
            pageSize={LIST_PAGE_SIZE}
            scrollToRef={listRef}
            total={total}
          />
        </>
      )}
    </div>
  );
}
