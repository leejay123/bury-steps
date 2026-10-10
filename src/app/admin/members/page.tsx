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
import { formatCompactDateTime } from "@/lib/dates";
import { SITE_SETTING_ID } from "@/lib/theme";
import type { MemberRoleFilter } from "@/server/actions";
import { loadMembersPage } from "@/lib/members-search";
import { MembersTable } from "./members-table";
import { AdminPageIntro } from "../admin-page-intro";
import { EmptyState } from "@/components/empty-state";
import { DataList, DataListBody, DataListItem } from "@/components/data-list";

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
  const [{ rows, total, groupTotals }, totalMembers, impersonations, setting] = await Promise.all([
    loadMembersPage({ role }),
    prisma.user.count(),
    prisma.impersonationEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, adminName: true, targetName: true, createdAt: true },
    }),
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
    impersonations,
    inviteRequired: setting?.organiserInviteRequired ?? false,
    viewerIsOwner: admin.isOwner,
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
  const { adminId, rows, total, groupTotals, totalMembers, impersonations, inviteRequired, viewerIsOwner } = view;

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
          roleFilter={role}
          viewerId={adminId}
          viewerIsOwner={viewerIsOwner}
        />
      )}

      {impersonations.length > 0 ? (
        <section className="flex flex-col gap-3">
          <AdminPageIntro
            as="h2"
            description="Every time an organiser has used “Log in as” on a member account. Most recent 20."
            title="Sign-in log"
          />
          <DataList>
            {impersonations.map((event) => (
              <DataListItem className="cursor-default hover:bg-transparent" key={event.id}>
                <DataListBody>
                  <p className="text-sm">
                    <span className="font-medium">{event.adminName}</span> logged in as{" "}
                    <span className="font-medium">{event.targetName}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{formatCompactDateTime(event.createdAt)}</p>
                </DataListBody>
              </DataListItem>
            ))}
          </DataList>
        </section>
      ) : null}
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
