import { Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { displayName, requireAdmin } from "@/lib/auth";
import { MembersTable } from "./members-table";
import { AdminPageIntro } from "../admin-page-intro";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const admin = await requireAdmin();

  const members = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { attendances: true, walksCreated: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <AdminPageIntro
        description="Everyone who has signed up. Click a row to see their walk history. Removing someone deletes their login and clock-in records. Walks they created stay with the group."
        title="Members"
      />
      {members.length === 0 ? (
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
        />
      )}
    </div>
  );
}
