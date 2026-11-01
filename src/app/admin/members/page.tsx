import { Suspense } from "react";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import { MemberRowsSkeleton } from "@/components/list-skeletons";
import { Users } from "lucide-react";
import { MembersFilterChrome } from "@/components/list-chrome";
import { membersListRows } from "@/lib/list-counts";
import { RememberListCount } from "@/components/remember-list-count";
import { prisma } from "@/lib/db";
import { getOptionalAdmin } from "@/lib/auth";
import { notFound } from "next/navigation";
import { cacheLife } from "next/cache";
import { SITE_SETTING_ID } from "@/lib/theme";
import type { MemberRoleFilter } from "@/server/actions";
import { loadMembersPage } from "@/lib/members-search";
import { MembersTable } from "./members-table";
import { AdminPageIntro } from "../admin-page-intro";
import { EmptyState } from "@/components/empty-state";

function parseRoleFilter(raw: string | undefined): MemberRoleFilter {
  if (raw === "ADMIN" || raw === "MEMBER") return raw;
  return "all";
}


/**
 * Owners only: proxy.ts turns everyone else away; getMembersView checks too.
 * Fetched ahead from the menu (navLinkPrefetch), so it opens with the list there.
 */
export const prefetch = "partial";

export default function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <AdminPageIntro
        description="Everyone who has signed up. Filter by role, search by name or email, and click a row for walk history. Removing someone deletes their login and clock-in records. Walks they created stay with the group."
        title="Members"
      />
      {/* The heading shows straight away; only the list waits for data. */}
      <Suspense fallback={<MembersListSkeleton />}>
        <PlaceholderPreview fallback={<MembersListSkeleton />}>
          <MembersForViewer searchParams={searchParams} />
        </PlaceholderPreview>
      </Suspense>
    </div>
  );
}

/**
 * The Members list for one role filter, as a private saved copy: kept in
 * this browser only for five minutes (never on the server), so the page
 * fetched ahead from the menu can carry it and opens with no placeholder.
 * Any change to a member refreshes it at once. See node_modules/next/dist/
 * docs/01-app/02-guides/optimizing-prefetching.md.
 */
async function getMembersView(role: MemberRoleFilter) {
  "use cache: private";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  const admin = await getOptionalAdmin();
  if (!admin?.permMembersView) return null;
  const adminId = admin.id;
  // Only the first page loads here — search and later pages are fetched
  // live from searchMembers, so this stays fast and correct no matter how
  // many members the group has.
  const [{ rows, total, groupTotals }, totalMembers, setting] = await Promise.all([
    loadMembersPage({ role }),
    prisma.user.count(),
    prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: { organiserInviteRequired: true },
    }),
  ]);
  return {
    adminId,
    rows,
    total,
    groupTotals,
    totalMembers,
    inviteRequired: setting?.organiserInviteRequired ?? false,
    viewerIsOwner: admin.isOwner,
    // "Member for…" and "invited… ago" are worked out from this, not from
    // reading the clock while the rows are drawn (see MembersNow).
    now: new Date().toISOString(),
  };
}

async function MembersForViewer({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const role = parseRoleFilter((await searchParams).role);
  const view = await getMembersView(role);
  if (!view) notFound();
  return <MembersBody role={role} view={view} />;
}

function MembersBody({
  role,
  view,
}: {
  role: MemberRoleFilter;
  view: NonNullable<Awaited<ReturnType<typeof getMembersView>>>;
}) {
  const { adminId, rows, total, groupTotals, totalMembers, inviteRequired, viewerIsOwner, now } = view;

  return (
    <>
      <RememberListCount count={totalMembers === 0 ? 0 : rows.length} id="members" />
      {totalMembers === 0 ? (
        <EmptyState
          description="When someone signs up, they will show here."
          icon={Users}
          title="No members yet"
        />
      ) : (
        <MembersTable
          initialGroupTotals={groupTotals}
          initialRows={rows.map((member) => ({ ...member, isYou: member.id === adminId }))}
          initialTotal={total}
          inviteRequired={inviteRequired}
          now={now}
          roleFilter={role}
          viewerId={adminId}
          viewerIsOwner={viewerIsOwner}
        />
      )}

    </>
  );
}

/** The real filter bar, then member-shaped rows — exactly as many as the
 * first page has (list-counts.ts), from the first paint. */
async function MembersListSkeleton() {
  const rows = await membersListRows();
  return (
    <div data-page-loading="" aria-busy="true" className="flex flex-col gap-4">
      <MembersFilterChrome />
      <MemberRowsSkeleton known={rows} remember="members" />
    </div>
  );
}
