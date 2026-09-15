"use client";

import { Fragment, useCallback, useEffect, useRef, useState, useTransition } from "react";
import type React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronRight, Search } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ViewMember = MemberRow & { isYou: boolean };

/** Owner, Organiser, Member — the fixed section order the list groups rows
 * into (see GROUP_ORDER below). Owner is its own group even though it's
 * also an ADMIN under the hood, matching the distinction the old per-row
 * badge used to draw with the crown icon. */
type MemberGroupKey = "OWNER" | "ADMIN" | "MEMBER";

const GROUP_ORDER: { key: MemberGroupKey; label: string }[] = [
  { key: "OWNER", label: "Owner" },
  { key: "ADMIN", label: "Organisers" },
  { key: "MEMBER", label: "Members" },
];

function memberGroupKey(member: ViewMember): MemberGroupKey {
  if (member.isOwner) return "OWNER";
  return member.role === "ADMIN" ? "ADMIN" : "MEMBER";
}

/** Stands in for a real row while a search/filter/sort/page change is in
 * flight — same shape as a loaded row, so the list doesn't jump size, and
 * shows up instantly instead of dimming stale rows for however long the
 * fetch takes. */
function MemberRowSkeleton() {
  return (
    <DataListItem className={dataListItemStackClassName}>
      <DataListItemMain>
        <Skeleton className="size-9 shrink-0 rounded-full" />
        <DataListBody className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-32 max-w-full" />
          <Skeleton className="h-3.5 w-44 max-w-full" />
          <Skeleton className="h-3 w-52 max-w-full" />
        </DataListBody>
      </DataListItemMain>
      <DataListActions className={cn("justify-end", dataListActionsStackClassName)}>
        <Skeleton className="h-7 w-20 rounded-md" />
      </DataListActions>
    </DataListItem>
  );
}

/** A section divider between role groups (Owner / Organisers / Members) —
 * only rendered when the current rows span more than one group, since the
 * whole point is to replace the old per-row role badge: with just one
 * group showing, a header would be redundant with the Role filter above. */
function MemberGroupHeader({ count, label }: { count: number; label: string }) {
  return (
    // No `border-t` here: every group but the last already ends on a row
    // with its own `border-b` (DataListItem), so adding one here as well
    // doubled up into two hairlines stacked back to back between groups.
    <li
      aria-hidden
      className="flex items-baseline gap-1.5 border-b bg-muted/50 px-3 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
    >
      {label}
      <span className="text-xs font-normal normal-case text-muted-foreground/80">({count})</span>
    </li>
  );
}

function MemberListRow({
  inviteRequired,
  member,
  onChanged,
  viewerIsOwner,
}: {
  inviteRequired: boolean;
  member: ViewMember;
  onChanged: () => void;
  viewerIsOwner: boolean;
}) {
  // Every applicable action collapses behind a single "⋯"
  // menu — even when there's only one — so a row's controls
  // are always just the role badge plus that one button.
  // Keeps the row visually consistent regardless of how many
  // actions apply, rather than sometimes a bare button and
  // sometimes a menu depending on the count.
  //
  // For an action that opens a dialog/drawer, `menuItem`
  // never renders that widget itself — it only proxies a
  // click to the real (always-mounted, visually hidden)
  // trigger rendered by `hiddenWidget`, which lives outside
  // MemberRowActionsMenu entirely. See that component's own
  // doc comment for why. Resend/Cancel invite have no
  // dialog to protect, so their `menuItem` is just their
  // own real DropdownMenuItem form.
  const actions: {
    key: string;
    menuItem: React.ReactNode;
    hiddenWidget?: React.ReactNode;
  }[] = [];

  if (member.pendingInvite) {
    actions.push({
      key: "resend",
      menuItem: <ResendInviteButton asMenuItem key="resend" onDone={onChanged} userId={member.id} />,
    });
    actions.push({
      key: "cancel",
      menuItem: <CancelInviteButton asMenuItem key="cancel" onDone={onChanged} userId={member.id} />,
    });
    if (viewerIsOwner) {
      const editPermissionsRef: { current: HTMLButtonElement | null } = { current: null };
      actions.push({
        key: "edit-permissions",
        menuItem: (
          <DropdownMenuItem key="edit-permissions" onSelect={() => editPermissionsRef.current?.click()}>
            Edit permissions
          </DropdownMenuItem>
        ),
        hiddenWidget: (
          <EditPermissionsButton
            hideTrigger
            initialPermissions={member.permissions}
            key="edit-permissions-hidden"
            name={member.name}
            onChanged={onChanged}
            triggerRef={editPermissionsRef}
            userId={member.id}
          />
        ),
      });
    }
  } else if (
    // Changing your own role here would be easy to hit by
    // mistake and immediately cost you organiser access to
    // fix it — same reasoning as hiding your own Remove
    // action below. Another organiser can change it for you
    // instead. Promoting/demoting/editing permissions is
    // also owner-only regardless of whose row this is.
    !member.isYou &&
    viewerIsOwner
  ) {
    const roleRef: { current: HTMLButtonElement | null } = { current: null };
    const promoting = member.role === "MEMBER";
    actions.push({
      key: "role",
      menuItem: (
        <DropdownMenuItem key="role" onSelect={() => roleRef.current?.click()}>
          {promoting ? (inviteRequired ? "Invite as organiser" : "Make organiser") : "Make member"}
        </DropdownMenuItem>
      ),
      hiddenWidget: (
        <MemberRoleButton
          hideTrigger
          initialPermissions={member.permissions}
          inviteRequired={inviteRequired}
          key="role-hidden"
          name={member.name}
          onChanged={onChanged}
          role={member.role}
          triggerRef={roleRef}
          userId={member.id}
        />
      ),
    });
    if (member.role === "ADMIN") {
      const editPermissionsRef: { current: HTMLButtonElement | null } = { current: null };
      const transferRef: { current: HTMLButtonElement | null } = { current: null };
      actions.push(
        {
          key: "edit-permissions",
          menuItem: (
            <DropdownMenuItem key="edit-permissions" onSelect={() => editPermissionsRef.current?.click()}>
              Edit permissions
            </DropdownMenuItem>
          ),
          hiddenWidget: (
            <EditPermissionsButton
              hideTrigger
              initialPermissions={member.permissions}
              key="edit-permissions-hidden"
              name={member.name}
              onChanged={onChanged}
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
          hiddenWidget: (
            <TransferOwnershipButton
              hideTrigger
              key="transfer-hidden"
              name={member.name}
              onChanged={onChanged}
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
    actions.push({
      key: "delete",
      menuItem: (
        <DropdownMenuItem key="delete" onSelect={() => deleteRef.current?.click()} variant="destructive">
          Remove
        </DropdownMenuItem>
      ),
      hiddenWidget: (
        <DeleteMemberButton
          attendanceCount={member.attendanceCount}
          hideTrigger
          key="delete-hidden"
          name={member.name}
          onDeleted={onChanged}
          triggerRef={deleteRef}
          userId={member.id}
          walkCount={member.walkCount}
        />
      ),
    });
  }

  return (
    <DataListItem className={cn("relative", member.isYou && "bg-muted/40", dataListItemStackClassName)}>
      <DataListItemMain>
        <Avatar className="size-9 shrink-0">
          <AvatarFallback className="text-xs">{initials(member.name)}</AvatarFallback>
        </Avatar>
        <DataListBody>
          <p className="flex items-center gap-1.5 font-medium">
            <Link className="after:absolute after:inset-0" href={`/admin/members/${member.id}`}>
              {member.name}
            </Link>
            {member.isYou ? <span className="text-xs font-normal text-muted-foreground">You</span> : null}
            {member.needsAttention && !member.pendingInvite ? (
              <AlertCircle
                aria-label="Never clocked in"
                className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
              />
            ) : null}
          </p>
          <p className="text-sm text-muted-foreground wrap-break-word">{member.email || "No email"}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(new Date(member.createdAt))} · {formatMembershipAge(new Date(member.createdAt))} ·{" "}
            {member.attendanceCount} {member.attendanceCount === 1 ? "clock-in" : "clock-ins"}
          </p>
        </DataListBody>
        <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground sm:mt-0" />
      </DataListItemMain>
      <DataListActions className={cn("relative z-10 flex-wrap gap-2", dataListActionsStackClassName)}>
        {member.pendingInvite ? (
          // The role badge used to sit here too — now that role is a group
          // header instead of a per-row badge, this is just the invite
          // status.
          <span className="flex h-7 items-center text-xs font-medium text-muted-foreground">
            {member.pendingInvite.expired
              ? `Invite expired ${formatRelativeDays(new Date(member.pendingInvite.expiresAt))}`
              : `Invited ${formatRelativeDays(new Date(member.pendingInvite.sentAt))}`}
          </span>
        ) : null}
        {actions.length > 0 ? (
          <MemberRowActionsMenu>{actions.map((a) => a.menuItem)}</MemberRowActionsMenu>
        ) : null}
        {/* Always-mounted, visually hidden widgets the menu
            above proxies clicks to — see
            MemberRowActionsMenu. */}
        {actions.map((a) => a.hiddenWidget)}
      </DataListActions>
    </DataListItem>
  );
}

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
  // Only an actual change to the typed query should wait out the debounce
  // below — a discrete click (role, sort, needs-attention, pagination)
  // is already a deliberate one-off action, not a keystroke that might be
  // followed by more keystrokes a moment later, so it should fetch right
  // away even while a search query is also active.
  const lastDebouncedQueryRef = useRef(query);

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
      lastDebouncedQueryRef.current = query;
      return;
    }
    const queryJustChanged = query !== lastDebouncedQueryRef.current;
    lastDebouncedQueryRef.current = query;
    const handle = setTimeout(
      () => {
        startTransition(async () => {
          const result = await searchMembers({ needsAttention, page, query, role: roleFilter, sort });
          setRows(result.rows.map((row) => ({ ...row, isYou: row.id === viewerId })));
          setTotal(result.total);
        });
      },
      queryJustChanged && query !== "" ? 300 : 0,
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

  const filtersActive = query !== "" || sort !== "oldest" || needsAttention || roleFilter !== "all";

  function clearFilters() {
    if (roleFilter !== "all") {
      // A full navigation back to the unfiltered URL — useResetOnChange
      // above picks up the roleFilter change and resets query/sort/
      // needsAttention/page too, so there's nothing left to do here.
      router.push("/admin/members");
      return;
    }
    setQuery("");
    setSort("oldest");
    setNeedsAttention(false);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(total / LIST_PAGE_SIZE));

  // Group the current page's rows into Owner / Organisers / Members
  // sections, in that fixed order, keeping each group's own current sort
  // order intact. This is what replaced the old per-row role badge — see
  // MemberGroupHeader. With a role filter active there's usually only one
  // group, so the header (redundant with the Role select above) is
  // skipped entirely.
  const groupedRows = GROUP_ORDER.map(({ key, label }) => ({
    key,
    label,
    members: rows.filter((member) => memberGroupKey(member) === key),
  })).filter((group) => group.members.length > 0);
  const showGroupHeaders = groupedRows.length > 1;

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
            off, so switching it on is only for isolating them. `title` is
            a plain hover tooltip — desktop-only, so the caption under the
            filter row (below) carries the same explanation for everyone
            once the filter is actually on. */}
        <Button
          aria-pressed={needsAttention}
          className={cn(
            "shrink-0 gap-1.5",
            needsAttention &&
              "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200 dark:hover:bg-amber-900",
          )}
          onClick={toggleNeedsAttention}
          title="Show only members who've never clocked in, or whose organiser invite has expired"
          type="button"
          variant="outline"
        >
          <AlertCircle />
          Needs attention
        </Button>
        {filtersActive ? (
          <Button className="shrink-0" onClick={clearFilters} size="sm" type="button" variant="ghost">
            Clear filters
          </Button>
        ) : null}
      </div>

      {needsAttention ? (
        <p className="-mt-2 text-xs text-muted-foreground">
          Showing members who&rsquo;ve never clocked in, or whose organiser invite has expired.
        </p>
      ) : null}

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
          <DataList>
            {isPending
              ? Array.from({ length: Math.min(rows.length || 5, LIST_PAGE_SIZE) }, (_, i) => (
                  <MemberRowSkeleton key={i} />
                ))
              : groupedRows.map((group) => (
                  <Fragment key={group.key}>
                    {showGroupHeaders ? (
                      <MemberGroupHeader count={group.members.length} label={group.label} />
                    ) : null}
                    {group.members.map((member) => (
                      <MemberListRow
                        inviteRequired={inviteRequired}
                        key={member.id}
                        member={member}
                        onChanged={refetch}
                        viewerIsOwner={viewerIsOwner}
                      />
                    ))}
                  </Fragment>
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
