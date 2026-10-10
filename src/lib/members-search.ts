import type { Prisma } from "@prisma/client";
import { displayName } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { withMemberPhotos } from "@/lib/member-photos";
import { getOwnerIds } from "@/lib/site-owner";
import type { MemberGroupTotals, MemberRoleFilter, MemberRow, MemberSort } from "@/server/actions/members";

/** A plain member with no clock-ins yet and no invite in flight, or an
 * organiser invite that's expired — see MemberRow.needsAttention. */
function attentionWhere(now: Date): Prisma.UserWhereInput {
  return {
    OR: [
      { organiserInviteExpiresAt: { lt: now } },
      { role: "MEMBER", organiserInviteToken: null, attendances: { none: {} } },
    ],
  };
}

/**
 * Server-side search + pagination for the admin Members page. Matching and
 * paging both happen in Postgres (not on a fixed-size fetch filtered in the
 * browser), so the page stays correct — and fast, once the trigram index
 * from the 20260909140000_member_search_trgm migration is in place — at any
 * membership size, not just up to some fetch cap. Search text never reaches
 * the URL: the client calls searchMembers directly instead of navigating.
 *
 * Kept out of the server-action file so the Members page can use it inside
 * its private saved copy (calling a server action there stopped the page
 * being fetched ahead). Callers check the viewer may see Members first.
 */
export async function loadMembersPage({
  page = 1,
  query = "",
  role = "all",
  sort = "oldest",
  needsAttention = false,
}: {
  page?: number;
  query?: string;
  role?: MemberRoleFilter;
  sort?: MemberSort;
  /** Only members needing a look — see MemberRow.needsAttention. */
  needsAttention?: boolean;
}): Promise<{ rows: MemberRow[]; total: number; groupTotals: MemberGroupTotals }> {
  const needle = query.trim();
  let searchWhere: Prisma.UserWhereInput | undefined;
  if (needle) {
    // Every word has to match the name or email somewhere, so a full name
    // ("Mark Walker") finds them as well as either half does.
    const words = needle.split(/\s+/);
    const textMatch: Prisma.UserWhereInput = {
      AND: words.map((word) => ({
        OR: [
          { email: { contains: word, mode: "insensitive" as const } },
          { firstName: { contains: word, mode: "insensitive" as const } },
          { lastName: { contains: word, mode: "insensitive" as const } },
        ],
      })),
    };
    // Same "type a role name to filter by it" shortcut the old client-side
    // search had — typing "adm"/"organiser"/"member" also matches by role.
    const lower = needle.toLowerCase();
    const roleMatches: Prisma.UserWhereInput["role"][] = [];
    if (lower.length >= 3 && words.length === 1) {
      if ("organiser".startsWith(lower) || "admin".startsWith(lower)) roleMatches.push("ADMIN");
      if ("member".startsWith(lower)) roleMatches.push("MEMBER");
    }
    searchWhere =
      roleMatches.length > 0
        ? { OR: [textMatch, ...roleMatches.map((r) => ({ role: r }))] }
        : textMatch;
  }

  const now = new Date();
  const andConditions: Prisma.UserWhereInput[] = [];
  if (searchWhere) andConditions.push(searchWhere);
  if (needsAttention) andConditions.push(attentionWhere(now));

  const where: Prisma.UserWhereInput = {
    ...(role !== "all" ? { role } : {}),
    ...(andConditions.length > 0 ? { AND: andConditions } : {}),
  };

  // Owners, then organisers, then members — the groups the list shows under
  // headings — so a group is never split by paging, then the chosen sort
  // inside each group.
  const groupOrder: Prisma.UserOrderByWithRelationInput[] = [{ isOwner: "desc" }, { role: "desc" }];
  const sortOrder: Prisma.UserOrderByWithRelationInput[] =
    sort === "newest"
      ? [{ createdAt: "desc" }, { id: "desc" }]
      : sort === "name"
        ? [{ firstName: "asc" }, { lastName: "asc" }, { id: "asc" }]
        : sort === "clockins"
          ? [{ attendances: { _count: "desc" } }, { id: "asc" }]
          : // "oldest" (default) — id as a tiebreaker keeps pages stable even
            // when rows share a createdAt millisecond.
            [{ createdAt: "asc" }, { id: "asc" }];

  const orderBy = [...groupOrder, ...sortOrder];

  const skip = (Math.max(1, page) - 1) * LIST_PAGE_SIZE;

  const [total, ownersTotal, organisersTotal, members, ownerIds] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.count({ where: { AND: [where, { isOwner: true }] } }),
    prisma.user.count({ where: { AND: [where, { isOwner: false, role: "ADMIN" }] } }),
    prisma.user.findMany({
      where,
      orderBy,
      skip,
      take: LIST_PAGE_SIZE,
      select: {
        id: true,
        clerkId: true,
        imageUrl: true,
        imageCheckedAt: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        organiserInviteToken: true,
        organiserInviteSentAt: true,
        organiserInviteExpiresAt: true,
        _count: { select: { attendances: true, walksCreated: true } },
      },
    }),
    getOwnerIds(),
  ]);
  const ownerIdSet = new Set(ownerIds);
  const photos = await withMemberPhotos(members);

  const nowMs = now.getTime();
  return {
    total,
    groupTotals: { OWNER: ownersTotal, ADMIN: organisersTotal, MEMBER: total - ownersTotal - organisersTotal },
    rows: members.map((member) => {
      const inviteExpiresAtMs = member.organiserInviteExpiresAt?.getTime() ?? 0;
      const inviteExpired = member.organiserInviteSentAt ? inviteExpiresAtMs < nowMs : false;
      return {
        id: member.id,
        name: displayName(member),
        email: member.email,
        imageUrl: photos.get(member.id) ?? null,
        role: member.role,
        createdAt: member.createdAt.toISOString(),
        attendanceCount: member._count.attendances,
        walkCount: member._count.walksCreated,
        pendingInvite: member.organiserInviteSentAt
          ? {
              sentAt: member.organiserInviteSentAt.toISOString(),
              expiresAt: (member.organiserInviteExpiresAt ?? member.organiserInviteSentAt).toISOString(),
              expired: inviteExpired,
            }
          : null,
        isOwner: ownerIdSet.has(member.id),
        needsAttention:
          inviteExpired ||
          (member.role === "MEMBER" &&
            !member.organiserInviteToken &&
            member._count.attendances === 0),
      };
    }),
  };
}
