"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Search } from "lucide-react";
import { formatDate, formatMembershipAge } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { searchMembers, type MemberRoleFilter, type MemberRow } from "@/server/actions";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { DeleteMemberButton } from "./delete-member-button";
import { EditPermissionsButton } from "./edit-permissions-button";
import { MemberRoleButton } from "./member-role-button";
import { TransferOwnershipButton } from "./transfer-ownership-button";
import { CancelInviteButton, ResendInviteButton } from "./pending-invite-actions";
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
  inviteRequired,
  roleFilter,
  viewerId,
  viewerIsOwner,
}: {
  initialRows: ViewMember[];
  initialTotal: number;
  inviteRequired: boolean;
  roleFilter: MemberRoleFilter;
  viewerId: string;
  /** Whether the signed-in organiser is the site's single owner (see
   * src/lib/site-owner.ts) — promoting/demoting an organiser, editing an
   * organiser's permissions, removing an organiser's account, and
   * transferring ownership are all owner-only, regardless of what
   * permissions the viewer otherwise holds. */
  viewerIsOwner: boolean;
}) {
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [isPending, startTransition] = useTransition();
  // Bumped by a row action (resend/cancel invite, role change, remove) once
  // it succeeds, to re-run the fetch below with the *current* query/page —
  // `rows`/`total` are local state seeded once from `initialRows`/
  // `initialTotal`, so a server action's own router.refresh() alone doesn't
  // reach them (a fresh `initialRows` prop doesn't re-run a useState
  // initializer). Without this, a row's status only ever visually updated
  // after a manual page reload.
  const [refreshNonce, setRefreshNonce] = useState(0);
  const refetch = useCallback(() => setRefreshNonce((n) => n + 1), []);

  // `initialRows`/`initialTotal` are already the result of this exact
  // query (page 1, no search, current roleFilter) — the server component
  // fetches with `searchMembers({ role })` before ever rendering this
  // component. Without this, the effect below re-ran that identical fetch
  // on every mount (and again on every roleFilter change, since
  // `useResetOnChange` re-syncs rows/total to the fresh initialRows but
  // doesn't stop the effect from firing too), producing a visible
  // opacity fade over data that hadn't actually changed. Starts `true` so
  // the very first mount is skipped; set back to `true` whenever
  // useResetOnChange re-syncs to a fresh set of server-provided rows.
  const skipNextFetchRef = useRef(true);

  // A full navigation changes roleFilter/initialRows — drop back to page 1,
  // no search, and the fresh server-rendered rows for that role.
  useResetOnChange([roleFilter], () => {
    setQuery("");
    setPage(1);
    setRows(initialRows);
    setTotal(initialTotal);
    skipNextFetchRef.current = true;
  });

  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }
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
  }, [query, page, roleFilter, viewerId, refreshNonce]);

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
                  {member.pendingInvite ? (
                    // Plain text, not a Badge — an outline badge sitting
                    // right next to the outline Resend/Cancel buttons below
                    // read as a third (non-working) button rather than a
                    // status label.
                    <span className="flex h-7 items-center text-xs font-medium text-muted-foreground">
                      {member.pendingInvite.expired ? "Invite expired" : "Invited"}
                    </span>
                  ) : (
                    <Badge className="h-7 px-2" variant={member.role === "ADMIN" ? "outline" : "secondary"}>
                      {member.isOwner ? "Owner" : member.role === "ADMIN" ? "Organiser" : "Member"}
                    </Badge>
                  )}
                  {member.pendingInvite ? (
                    <>
                      <ResendInviteButton onDone={refetch} userId={member.id} />
                      <CancelInviteButton onDone={refetch} userId={member.id} />
                      {viewerIsOwner ? (
                        <EditPermissionsButton
                          initialPermissions={member.permissions}
                          name={member.name}
                          onChanged={refetch}
                          userId={member.id}
                        />
                      ) : null}
                    </>
                  ) : /* Changing your own role here would be easy to hit by
                         mistake and immediately cost you organiser access to
                         fix it — same reasoning as hiding your own Remove
                         button below. Another organiser can change it for you
                         instead. Promoting/demoting/editing permissions is
                         also owner-only regardless of whose row this is. */
                  member.isYou || !viewerIsOwner ? null : (
                    <>
                      <MemberRoleButton
                        initialPermissions={member.permissions}
                        inviteRequired={inviteRequired}
                        name={member.name}
                        onChanged={refetch}
                        role={member.role}
                        userId={member.id}
                      />
                      {member.role === "ADMIN" ? (
                        <>
                          <EditPermissionsButton
                            initialPermissions={member.permissions}
                            name={member.name}
                            onChanged={refetch}
                            userId={member.id}
                          />
                          <TransferOwnershipButton
                            name={member.name}
                            onChanged={refetch}
                            userId={member.id}
                          />
                        </>
                      ) : null}
                    </>
                  )}
                  {member.isYou || (member.role === "ADMIN" && !viewerIsOwner) ? null : (
                    <DeleteMemberButton
                      attendanceCount={member.attendanceCount}
                      name={member.name}
                      onDeleted={refetch}
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
