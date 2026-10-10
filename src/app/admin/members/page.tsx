import { Suspense } from "react";
import { PlaceholderPreview } from "@/components/placeholder-preview";
import { MemberRowsSkeleton } from "@/components/list-skeletons";
import { Users } from "lucide-react";
import { MembersFilterChrome } from "@/components/list-chrome";
import { RememberListCount } from "@/components/remember-list-count";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { formatCompactDateTime } from "@/lib/dates";
import { isOwner } from "@/lib/site-owner";
import { SITE_SETTING_ID } from "@/lib/theme";
import { searchMembers, type MemberRoleFilter } from "@/server/actions";
import { MembersTable } from "./members-table";
import { AdminPageIntro } from "../admin-page-intro";
import { EmptyState } from "@/components/empty-state";
import { DataList, DataListBody, DataListItem } from "@/components/data-list";

function parseRoleFilter(raw: string | undefined): MemberRoleFilter {
  if (raw === "ADMIN" || raw === "MEMBER") return raw;
  return "all";
}


// Access is checked in layout.tsx, before anything streams.
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

async function MembersForViewer({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const admin = await requirePermission("permMembersView");
  const role = parseRoleFilter((await searchParams).role);
  return <MembersBody adminId={admin.id} role={role} />;
}

async function MembersBody({ adminId, role }: { adminId: string; role: MemberRoleFilter }) {
  // Only the first page loads here — search and later pages are fetched
  // live from searchMembers, so this stays fast and correct no matter how
  // many members the group has.
  const [{ rows, total, groupTotals }, totalMembers, impersonations, setting, viewerIsOwner] = await Promise.all([
    searchMembers({ role }),
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
    isOwner(adminId),
  ]);

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
          inviteRequired={setting?.organiserInviteRequired ?? false}
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

/** The real filter bar, then member-shaped rows — as many as the list last
 * showed, from the first paint (one placeholder, on a refresh or a page change). */
function MembersListSkeleton() {
  return (
    <div data-page-loading="" aria-busy="true" className="flex flex-col gap-4">
      <MembersFilterChrome />
      <MemberRowsSkeleton remember="members" />
    </div>
  );
}
