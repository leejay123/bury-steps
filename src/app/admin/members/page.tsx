import { Prisma } from "@prisma/client";
import { Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { displayName, requireAdmin } from "@/lib/auth";
import { MembersTable } from "./members-table";
import { AdminPageIntro } from "../admin-page-intro";
import { EmptyState } from "@/components/empty-state";

type RoleFilter = "all" | "ADMIN" | "MEMBER";

/** Cap for client-side search — enough for a small group without putting PII in ?q=. */
const MEMBERS_FETCH_LIMIT = 500;

function parseRoleFilter(raw: string | undefined): RoleFilter {
  if (raw === "ADMIN" || raw === "MEMBER") return raw;
  return "all";
}

function buildWhere(role: RoleFilter): Prisma.UserWhereInput | undefined {
  if (role === "all") return undefined;
  return { role };
}

export const dynamic = "force-dynamic";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; role?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const role = parseRoleFilter(params.role);
  const where = buildWhere(role);

  const [totalMembers, members] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: MEMBERS_FETCH_LIMIT,
      include: {
        _count: { select: { attendances: true, walksCreated: true } },
      },
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
          members={members.map((member) => ({
            id: member.id,
            name: displayName(member),
            email: member.email,
            role: member.role,
            createdAt: member.createdAt.toISOString(),
            attendanceCount: member._count.attendances,
            walkCount: member._count.walksCreated,
            isYou: member.id === admin.id,
          }))}
          roleFilter={role}
          totalMembers={totalMembers}
        />
      )}
    </div>
  );
}
