"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronRight, Crown, Search } from "lucide-react";
import { formatDate, formatMembershipAge, formatRelativeDays } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/names";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { searchMembers, type MemberRoleFilter, type MemberRow, type MemberSort } from "@/server/actions";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { DeleteMemberButton } from "./delete-member-button";
import { EditPermissionsButton } from "./edit-permissions-button";
import { MemberRoleButton } from "./member-role-button";
import { MemberRowActionsMenu } from "./member-row-actions-menu";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
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
  const [sort, setSort] = useState<MemberSort>("oldest");
  const [needsAttention, setNeedsAttention] = useState(false);
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
  // no search, the default sort, no attention filter, and the fresh
  // server-rendered rows for that role (which the server always fetches
  // with that same default view).
  useResetOnChange([roleFilter], () => {
    setQuery("");
    setSort("oldest");
    setNeedsAttention(false);
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
          const result = await searchMembers({ needsAttention, page, query, role: roleFilter, sort });
          setRows(result.rows.map((row) => ({ ...row, isYou: row.id === viewerId })));
          setTotal(result.total);
        });
      },
      query === "" && page === 1 ? 0 : 300,
    );
    return () => clearTimeout(handle);
  }, [query, sort, needsAttention, page, roleFilter, viewerId, refreshNonce]);

  function handleQueryChange(next: string) {
    setQuery(next);
    setPage(1);
  }

  function handleSortChange(next: MemberSort) {
    setSort(next);
    setPage(1);
  }

  function toggleNeedsAttention() {
    setNeedsAttention((value) => !value);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(total / LIST_PAGE_SIZE));

  return (
    <div className="flex flex-col gap-4" ref={listRef}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <InputGroup className="w-full min-w-0 sm:min-w-56 sm:flex-1">
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
            <SelectTrigger className="w-full sm:w-44" id="member-role-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="ADMIN">Organisers</SelectItem>
              <SelectItem value="MEMBER">Members</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          <Label htmlFor="member-sort">Sort by</Label>
          <Select onValueChange={(value) => handleSortChange(value as MemberSort)} value={sort}>
            <SelectTrigger className="w-full sm:w-44" id="member-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
              <SelectItem value="clockins">Most clock-ins</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Surfaces the two things on this list most worth a look: a member
            who's never clocked in, and an organiser invite that's expired —
            see MemberRow.needsAttention. Rows matching either are also
            marked individually (see the AlertCircle below) even with this
            off, so switching it on is only for isolating them. */}
        <Button
          aria-pressed={needsAttention}
          className={cn(
            "shrink-0 gap-1.5",
            needsAttention &&
              "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200 dark:hover:bg-amber-900",
          )}
          onClick={toggleNeedsAttention}
          type="button"
          variant="outline"
        >
          <AlertCircle />
          Needs attention
        </Button>
      </div>

      {rows.length === 0 && !isPending ? (
        <EmptyState
          description={
            total === 0 && needsAttention && !query
              ? "Nobody needs attention right now."
              : total === 0 && !query
                ? "When someone signs up, they will show here."
                : "Try a different name, email, or role."
          }
          icon={Search}
          title="No matching members"
        />
      ) : (
        <>
          <DataList className={cn(isPending && "opacity-60")}>
            {rows.map((member) => {
              // One "primary" action shown as a direct button — the one
              // someone's most likely to want next — plus whatever else
              // applies collapsed behind a single "⋯" menu, so an owner
              // looking at an organiser's row doesn't get a wall of four
              // buttons (Make member/Edit permissions/Make owner/Remove).
              // A lone secondary action is still shown as a plain button
              // rather than hidden behind a one-item menu.
              //
              // For an action that opens a dialog/drawer, `menuItem` never
              // renders that widget itself — it only proxies a click to the
              // real (always-mounted, visually hidden) trigger rendered by
              // `hiddenWidget`, which lives outside MemberRowActionsMenu
              // entirely. See that component's own doc comment for why.
              // Resend/Cancel invite have no dialog to protect, so their
              // `menuItem` is just their own real DropdownMenuItem form.
              let primary: React.ReactNode = null;
              const secondary: {
                key: string;
                menuItem: React.ReactNode;
                standalone: React.ReactNode;
                hiddenWidget?: React.ReactNode;
              }[] = [];

              if (member.pendingInvite) {
                primary = <ResendInviteButton key="resend" onDone={refetch} userId={member.id} />;
                secondary.push({
                  key: "cancel",
                  menuItem: <CancelInviteButton asMenuItem key="cancel" onDone={refetch} userId={member.id} />,
                  standalone: <CancelInviteButton key="cancel" onDone={refetch} userId={member.id} />,
                });
                if (viewerIsOwner) {
                  const editPermissionsRef: { current: HTMLButtonElement | null } = { current: null };
                  secondary.push({
                    key: "edit-permissions",
                    menuItem: (
                      <DropdownMenuItem
                        key="edit-permissions"
                        onSelect={() => editPermissionsRef.current?.click()}
                      >
                        Edit permissions
                      </DropdownMenuItem>
                    ),
                    standalone: (
                      <EditPermissionsButton
                        initialPermissions={member.permissions}
                        key="edit-permissions"
                        name={member.name}
                        onChanged={refetch}
                        userId={member.id}
                      />
                    ),
                    hiddenWidget: (
                      <EditPermissionsButton
                        hideTrigger
                        initialPermissions={member.permissions}
                        key="edit-permissions-hidden"
                        name={member.name}
                        onChanged={refetch}
                        triggerRef={editPermissionsRef}
                        userId={member.id}
                      />
                    ),
                  });
                }
              } else if (
                // Changing your own role here would be easy to hit by
                // mistake and immediately cost you organiser access to fix
                // it — same reasoning as hiding your own Remove button
                // below. Another organiser can change it for you instead.
                // Promoting/demoting/editing permissions is also owner-only
                // regardless of whose row this is.
                !member.isYou &&
                viewerIsOwner
              ) {
                primary = (
                  <MemberRoleButton
                    initialPermissions={member.permissions}
                    inviteRequired={inviteRequired}
                    key="role"
                    name={member.name}
                    onChanged={refetch}
                    role={member.role}
                    userId={member.id}
                  />
                );
                if (member.role === "ADMIN") {
                  const editPermissionsRef: { current: HTMLButtonElement | null } = { current: null };
                  const transferRef: { current: HTMLButtonElement | null } = { current: null };
                  secondary.push(
                    {
                      key: "edit-permissions",
                      menuItem: (
                        <DropdownMenuItem
                          key="edit-permissions"
                          onSelect={() => editPermissionsRef.current?.click()}
                        >
                          Edit permissions
                        </DropdownMenuItem>
                      ),
                      standalone: (
                        <EditPermissionsButton
                          initialPermissions={member.permissions}
                          key="edit-permissions"
                          name={member.name}
                          onChanged={refetch}
                          userId={member.id}
                        />
                      ),
                      hiddenWidget: (
                        <EditPermissionsButton
                          hideTrigger
                          initialPermissions={member.permissions}
                          key="edit-permissions-hidden"
                          name={member.name}
                          onChanged={refetch}
                          triggerRef={editPermissionsRef}
                          userId={member.id}
                        />
                      ),
                    },
                    {
                      key: "transfer",
                      menuItem: (
                        <DropdownMenuItem key="transfer" onSelect={() => transferRef.current?.click()}>
                          Make owner
                        </DropdownMenuItem>
                      ),
                      standalone: (
                        <TransferOwnershipButton
                          key="transfer"
                          name={member.name}
                          onChanged={refetch}
                          userId={member.id}
                        />
                      ),
                      hiddenWidget: (
                        <TransferOwnershipButton
                          hideTrigger
                          key="transfer-hidden"
                          name={member.name}
                          onChanged={refetch}
                          triggerRef={transferRef}
                          userId={member.id}
                        />
                      ),
                    },
                  );
                }
              }

              if (!member.isYou && (member.role !== "ADMIN" || viewerIsOwner)) {
                const deleteRef: { current: HTMLButtonElement | null } = { current: null };
                secondary.push({
                  key: "delete",
                  menuItem: (
                    <DropdownMenuItem
                      key="delete"
                      onSelect={() => deleteRef.current?.click()}
                      variant="destructive"
                    >
                      Remove
                    </DropdownMenuItem>
                  ),
                  standalone: (
                    <DeleteMemberButton
                      attendanceCount={member.attendanceCount}
                      key="delete"
                      name={member.name}
                      onDeleted={refetch}
                      userId={member.id}
                      walkCount={member.walkCount}
                    />
                  ),
                  hiddenWidget: (
                    <DeleteMemberButton
                      attendanceCount={member.attendanceCount}
                      hideTrigger
                      key="delete-hidden"
                      name={member.name}
                      onDeleted={refetch}
                      triggerRef={deleteRef}
                      userId={member.id}
                      walkCount={member.walkCount}
                    />
                  ),
                });
              }

              return (
                <DataListItem
                  className={cn("relative", member.isYou && "bg-muted/40", dataListItemStackClassName)}
                  key={member.id}
                >
                  <DataListItemMain>
                    <Avatar className="size-9 shrink-0">
                      <AvatarFallback className="text-xs">{initials(member.name)}</AvatarFallback>
                    </Avatar>
                    <DataListBody>
                      <p className="font-medium">
                        <Link className="after:absolute after:inset-0" href={`/admin/members/${member.id}`}>
                          {member.name}
                        </Link>
                        {member.isYou ? (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">You</span>
                        ) : null}
                        {member.needsAttention && !member.pendingInvite ? (
                          <AlertCircle
                            aria-label="Never clocked in"
                            className="ml-1.5 inline size-3.5 align-text-bottom text-amber-600 dark:text-amber-400"
                          />
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
                      // right next to the outline Resend button below reads
                      // as a third (non-working) button rather than a
                      // status label.
                      <span className="flex h-7 items-center text-xs font-medium text-muted-foreground">
                        {member.pendingInvite.expired
                          ? `Invite expired ${formatRelativeDays(new Date(member.pendingInvite.expiresAt))}`
                          : `Invited ${formatRelativeDays(new Date(member.pendingInvite.sentAt))}`}
                      </span>
                    ) : (
                      <Badge className="h-7 border-border px-2" variant="secondary">
                        {member.isOwner ? <Crown /> : null}
                        {member.isOwner ? "Owner" : member.role === "ADMIN" ? "Organiser" : "Member"}
                      </Badge>
                    )}
                    {primary}
                    {secondary.length === 0
                      ? null
                      : secondary.length === 1
                        ? secondary[0].standalone
                        : (
                            <MemberRowActionsMenu>
                              {secondary.map((s) => s.menuItem)}
                            </MemberRowActionsMenu>
                          )}
                    {/* Always-mounted, visually hidden widgets for whichever
                        secondary actions the menu above is proxying clicks
                        to — never rendered while that action shows as the
                        lone standalone button instead. */}
                    {secondary.length > 1 ? secondary.map((s) => s.hiddenWidget) : null}
                  </DataListActions>
                </DataListItem>
              );
            })}
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
