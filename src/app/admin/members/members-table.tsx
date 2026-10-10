"use client";

import { Fragment, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useQueryChoice, useQueryText } from "@/hooks/use-filter-query";
import type React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronRight, Search } from "lucide-react";
import { toast } from "sonner";
import { ACTION_NETWORK_ERROR } from "@/lib/action-errors";
import { formatDate, formatMembershipAge, formatRelativeDays } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/names";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { rememberedRowsCookie, writeClientCookie } from "@/lib/remembered-rows-key";
import {
  searchMembers,
  type MemberGroupTotals,
  type MemberRoleFilter,
  type MemberRow,
  type MemberSort,
} from "@/server/actions";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { AddOwnerButton } from "./add-owner-button";
import { DeleteMemberButton } from "./delete-member-button";
import { MemberRoleButton } from "./member-role-button";
import { MemberRowActionsMenu } from "./member-row-actions-menu";
import { RemoveOwnerButton } from "./remove-owner-button";
import { TransferOwnershipButton } from "./transfer-ownership-button";
import { CancelInviteButton, ResendInviteButton } from "./pending-invite-actions";
import { EmptyState } from "@/components/empty-state";
import {
  DataList,
  DataListActions,
  DataListBody,
  DataListGroupHeader,
  DataListItem,
  DataListItemMain,
  dataListActionsStackClassName,
  dataListItemStackClassName,
} from "@/components/data-list";
import { ListPagination } from "@/components/list-pagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { SkeletonReveal } from "@/components/spectrumui/skeleton-reveal";
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
export function MemberRowSkeleton() {
  return null;
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
  /** Organisers have no Members access at all — this table only ever
   * renders for the owner, so this is really always true, but every
   * action below still names it explicitly (matching the server actions'
   * own checks) rather than assuming. */
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
    // Resend/cancel are owner-only on the server — hide the menu items for
    // plain organisers so a stale UI does not advertise actions that fail.
    if (viewerIsOwner) {
      actions.push({
        key: "resend",
        menuItem: <ResendInviteButton asMenuItem key="resend" onDone={onChanged} userId={member.id} />,
      });
      actions.push({
        key: "cancel",
        menuItem: <CancelInviteButton asMenuItem key="cancel" onDone={onChanged} userId={member.id} />,
      });
    }
  } else if (
    // Changing your own role here would be easy to hit by
    // mistake and immediately cost you organiser access to
    // fix it — same reasoning as hiding your own Remove
    // action below. Another organiser can change it for you
    // instead. Promoting/demoting and managing owner access is
    // also owner-only regardless of whose row this is.
    !member.isYou &&
    viewerIsOwner
  ) {
    if (member.role === "ADMIN" && member.isOwner) {
      // Already one of the group's owners — the only thing left to offer
      // is removing that access (setMemberRole refuses to demote them to
      // a plain member while it's still set, and they're already an
      // owner, so neither the role toggle nor Add/Make owner apply).
      const removeOwnerRef: { current: HTMLButtonElement | null } = { current: null };
      actions.push({
        key: "remove-owner",
        menuItem: (
          <DropdownMenuItem key="remove-owner" onSelect={() => removeOwnerRef.current?.click()}>
            Remove as owner
          </DropdownMenuItem>
        ),
        hiddenWidget: (
          <RemoveOwnerButton
            hideTrigger
            key="remove-owner-hidden"
            name={member.name}
            onChanged={onChanged}
            triggerRef={removeOwnerRef}
            userId={member.id}
          />
        ),
      });
    } else {
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
        const addOwnerRef: { current: HTMLButtonElement | null } = { current: null };
        actions.push({
          key: "add-owner",
          menuItem: (
            <DropdownMenuItem key="add-owner" onSelect={() => addOwnerRef.current?.click()}>
              Add as co-owner
            </DropdownMenuItem>
          ),
          hiddenWidget: (
            <AddOwnerButton
              hideTrigger
              key="add-owner-hidden"
              name={member.name}
              onChanged={onChanged}
              triggerRef={addOwnerRef}
              userId={member.id}
            />
          ),
        });
        const transferRef: { current: HTMLButtonElement | null } = { current: null };
        actions.push({
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
        });
      }
    }
  }

  if (!member.isYou && !member.isOwner && viewerIsOwner) {
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
    <DataListItem
      className={cn("relative", member.isYou && "bg-muted/40", dataListItemStackClassName)}
      data-stagger-item=""
    >
      <DataListItemMain>
        <Avatar className="size-9 shrink-0">
          {member.imageUrl ? <AvatarImage alt="" src={member.imageUrl} /> : null}
          <AvatarFallback className="text-xs">{initials(member.name)}</AvatarFallback>
        </Avatar>
        <DataListBody>
          <p className="flex items-center gap-1.5 font-medium">
            <Link
              className="after:absolute after:inset-0"
              href={`/admin/members/${member.id}`}
              // Their page's placeholder then draws exactly as many walk
              // rows as they have (MemberDetailSkeleton).
              onClick={() =>
                writeClientCookie(
                  rememberedRowsCookie("member-detail"),
                  String(Math.min(member.attendanceCount, LIST_PAGE_SIZE)),
                )
              }
            >
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
 * Search, sort, and Needs attention stay in the address so a refresh or the
 * back button keeps them. The words are still sent to searchMembers, which
 * is what actually filters the list.
 */
const MEMBER_SORTS = ["oldest", "newest", "name", "clockins"] as const;
const ATTENTION = ["0", "1"] as const;

export function MembersTable(props: {
  initialGroupTotals: MemberGroupTotals;
  initialRows: ViewMember[];
  initialTotal: number;
  inviteRequired: boolean;
  roleFilter: MemberRoleFilter;
  viewerId: string;
  viewerIsOwner: boolean;
}) {
  return (
    <NuqsAdapter>
      <MembersTableInner {...props} />
    </NuqsAdapter>
  );
}

function MembersTableInner({
  initialGroupTotals,
  initialRows,
  initialTotal,
  inviteRequired,
  roleFilter,
  viewerId,
  viewerIsOwner,
}: {
  initialGroupTotals: MemberGroupTotals;
  initialRows: ViewMember[];
  initialTotal: number;
  inviteRequired: boolean;
  roleFilter: MemberRoleFilter;
  viewerId: string;
  /** Whether the signed-in organiser is one of the site's owners (see
   * src/lib/site-owner.ts — there can be more than one) —
   * promoting/demoting an organiser, editing an organiser's permissions,
   * removing an organiser's account, and granting/transferring/removing
   * ownership are all owner-only, regardless of what permissions the
   * viewer otherwise holds. */
  viewerIsOwner: boolean;
}) {
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useQueryText("q");
  const [sort, setSort] = useQueryChoice("sort", MEMBER_SORTS, "oldest");
  const [attention, setAttention] = useQueryChoice("attention", ATTENTION, "0");
  const needsAttention = attention === "1";
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [groupTotals, setGroupTotals] = useState(initialGroupTotals);
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

  // The server renders the unfiltered first page. Skip the first fetch when
  // the address has no search, sort, or Needs attention. When those are in
  // the address, fetch them on mount so a refresh shows the filtered list.
  const filtersFromAddress = query !== "" || sort !== "oldest" || needsAttention;
  const skipNextFetchRef = useRef(!filtersFromAddress);

  // A full navigation changes roleFilter/initialRows. Keep the search, sort,
  // and Needs attention that are already in the address, and show the
  // server-rendered rows until the effect below loads that role with those
  // filters.
  useResetOnChange([roleFilter], () => {
    setPage(1);
    setRows(initialRows);
    setTotal(initialTotal);
    setGroupTotals(initialGroupTotals);
    skipNextFetchRef.current = query === "" && sort === "oldest" && !needsAttention;
  });

  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }
    const handle = setTimeout(
      () => {
        startTransition(async () => {
          // A failed lookup keeps the current rows and says so, instead of
          // throwing to the error page.
          const result = await searchMembers({ needsAttention, page, query, role: roleFilter, sort }).catch(
            () => null,
          );
          if (!result) {
            toast.error(ACTION_NETWORK_ERROR);
            return;
          }
          setRows(result.rows.map((row) => ({ ...row, isYou: row.id === viewerId })));
          setTotal(result.total);
          setGroupTotals(result.groupTotals);
        });
      },
      0,
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
    void setAttention(needsAttention ? "0" : "1");
    setPage(1);
  }

  const filtersActive = query !== "" || sort !== "oldest" || needsAttention || roleFilter !== "all";

  function clearFilters() {
    void setQuery("");
    void setSort("oldest");
    void setAttention("0");
    setPage(1);
    if (roleFilter !== "all") router.push("/admin/members");
  }

  const pageCount = Math.max(1, Math.ceil(total / LIST_PAGE_SIZE));

  // Group the current page's rows into Owner / Organisers / Members
  // sections, in that fixed order, keeping each group's own current sort
  // order intact. The server sorts by group first, so a group only runs on
  // to the next page when it's longer than a page, and each heading's count
  // is the group's total, not just what's on this page. This is what replaced the old per-row role badge — see
  // DataListGroupHeader. With a role filter active there's usually only one
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
              const params = new URLSearchParams(window.location.search);
              if (value === "all") params.delete("role");
              else params.set("role", value);
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
      ) : rows.length === 0 ? null : (
        <>
          <SkeletonReveal
            loading={isPending}
            skeleton={
              <DataList>
                {Array.from({ length: Math.min(rows.length, LIST_PAGE_SIZE) }, (_, i) => (
                  <MemberRowSkeleton key={i} />
                ))}
              </DataList>
            }
          >
            <DataList>
              {groupedRows.map((group) => (
                <Fragment key={group.key}>
                  {showGroupHeaders ? (
                    <DataListGroupHeader count={groupTotals[group.key]} label={group.label} />
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
          </SkeletonReveal>
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
