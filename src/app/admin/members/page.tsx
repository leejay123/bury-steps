import { Suspense } from "react";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
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

export const dynamic = "force-dynamic";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const admin = await requirePermission("permMembersView");
  const params = await searchParams;
  const role = parseRoleFilter(params.role);

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <AdminPageIntro
        description="Everyone who has signed up. Filter by role, search by name or email, and click a row for walk history. Removing someone deletes their login and clock-in records. Walks they created stay with the group."
        title="Members"
      />
      {/* The heading shows straight away; only the list waits for data. */}
      <Suspense fallback={<MembersListSkeleton />}>
        <MembersBody adminId={admin.id} role={role} />
      </Suspense>
    </div>
  );
}

async function MembersBody({ adminId, role }: { adminId: string; role: MemberRoleFilter }) {
  // Only the first page loads here — search and later pages are fetched
  // live from searchMembers, so this stays fast and correct no matter how
  // many members the group has.
  const [{ rows, total }, totalMembers, impersonations, setting, viewerIsOwner] = await Promise.all([
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
      {totalMembers === 0 ? (
        <EmptyState
          description="When someone signs up, they will show here."
          icon={Users}
          title="No members yet"
        />
      ) : (
        <MembersTable
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
                  <p className="text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</p>
                </DataListBody>
              </DataListItem>
            ))}
          </DataList>
        </section>
      ) : null}
    </>
  );
}

/** Same shape as the filter bar and member rows that replace it. */
function MembersListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-9 w-full rounded-md" />
      <ul className="flex flex-col overflow-hidden rounded-xl border bg-card">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <li className="flex items-center gap-3 border-b p-3 last:border-0" key={i}>
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-col gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3.5 w-44 max-w-full" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
