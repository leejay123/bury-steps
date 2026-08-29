import { Prisma } from "@prisma/client";
import { Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { displayName, requireAdmin } from "@/lib/auth";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { MembersTable } from "./members-table";
import { AdminPageIntro } from "../admin-page-intro";
import { EmptyState } from "@/components/empty-state";

function buildWhere(query: string): Prisma.UserWhereInput | undefined {
  if (!query) return undefined;
  const or: Prisma.UserWhereInput[] = [
    { firstName: { contains: query, mode: "insensitive" } },
    { lastName: { contains: query, mode: "insensitive" } },
    { email: { contains: query, mode: "insensitive" } },
  ];
  // The role column is shown as "Organiser"/"Member" text, not "ADMIN"/
  // "MEMBER", so let a search for those words match it too. Require a
  // prefix of at least 3 characters so short needles like "a" / "e" do
  // not match every organiser or member.
  const needle = query.toLowerCase();
  if (needle.length >= 3) {
    if ("organiser".startsWith(needle) || "admin".startsWith(needle)) {
      or.push({ role: "ADMIN" });
    }
    if ("member".startsWith(needle)) {
      or.push({ role: "MEMBER" });
    }
  }
  return { OR: or };
}

export const dynamic = "force-dynamic";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const requestedPage = Math.max(1, Number(params.page ?? "1") || 1);
  const where = buildWhere(query);

  const [totalMembers, matchedTotal] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where }),
  ]);

  const pageCount = Math.max(1, Math.ceil(matchedTotal / LIST_PAGE_SIZE));
  const page = Math.min(requestedPage, pageCount);

  const members = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "asc" },
    skip: (page - 1) * LIST_PAGE_SIZE,
    take: LIST_PAGE_SIZE,
    include: {
      _count: { select: { attendances: true, walksCreated: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <AdminPageIntro
        description="Everyone who has signed up. Joined shows the date and how long they have been a member. Click a row for their walk history. Removing someone deletes their login and clock-in records. Walks they created stay with the group."
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
          page={page}
          pageCount={pageCount}
          pageSize={LIST_PAGE_SIZE}
          total={matchedTotal}
        />
      )}
    </div>
  );
}
