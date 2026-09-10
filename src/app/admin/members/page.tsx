import { Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
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
  const admin = await requireAdmin();
  const params = await searchParams;
  const role = parseRoleFilter(params.role);

  // Only the first page loads here — search and later pages are fetched
  // live from searchMembers, so this stays fast and correct no matter how
  // many members the group has.
  const [{ rows, total }, totalMembers, impersonations, setting] = await Promise.all([
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
  ]);

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <AdminPageIntro
        description="Everyone who has signed up. Filter by role, search by name or email, and click a row for walk history. Removing someone deletes their login and clock-in records. Walks they created stay with the group."
        title="Members"
      />
      {totalMembers === 0 ? (
        <EmptyState
          description="When someone signs up, they will show here."
          icon={Users}
          title="No members yet"
        />
      ) : (
        <MembersTable
          initialRows={rows.map((member) => ({ ...member, isYou: member.id === admin.id }))}
          initialTotal={total}
          inviteRequired={setting?.organiserInviteRequired ?? false}
          roleFilter={role}
          viewerId={admin.id}
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
    </div>
  );
}
