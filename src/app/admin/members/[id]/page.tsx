import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMemberHistory } from "@/server/actions";
import { formatDate, formatMembershipAge } from "@/lib/dates";
import { walkStatus } from "@/lib/walk-window";
import { SITE_SETTING_ID } from "@/lib/theme";
import { AttendanceHistory } from "@/components/attendance-history";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteMemberButton } from "../delete-member-button";
import { ImpersonateButton } from "../impersonate-button";
import { MemberRoleButton } from "../member-role-button";
import { CancelInviteButton, ResendInviteButton } from "../pending-invite-actions";

export const dynamic = "force-dynamic";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [member, setting] = await Promise.all([
    getMemberHistory(id),
    prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: { organiserInviteRequired: true },
    }),
  ]);
  if (!member) notFound();

  const joinedAt = new Date(member.createdAt);
  const attendanceCount = member.attendanceCount;
  const cancelledCount = member.items.filter((item) => item.cancelledAt).length;

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <Link className="text-sm text-muted-foreground hover:text-foreground" href="/admin/members">
        &larr; All members
      </Link>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-2xl">{member.name}</CardTitle>
              {member.pendingInvite ? (
                // Plain text, not a Badge — an outline badge next to the
                // outline Resend/Cancel buttons below read as a third
                // (non-working) button rather than a status label.
                <span className="text-sm font-medium text-muted-foreground">
                  {member.pendingInvite.expired ? "Invite expired" : "Invited"}
                </span>
              ) : (
                <Badge className="h-7 px-2" variant={member.role === "ADMIN" ? "default" : "secondary"}>
                  {member.role === "ADMIN" ? "Organiser" : "Member"}
                </Badge>
              )}
            </div>
            <CardDescription className="flex flex-col gap-1">
              <span className="wrap-break-word">{member.email || "No email"}</span>
              <span>
                Joined {formatDate(joinedAt)} · member for {formatMembershipAge(joinedAt)}
              </span>
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">
            {member.role === "MEMBER" && !member.pendingInvite ? (
              <ImpersonateButton name={member.name} userId={id} />
            ) : null}
            {member.pendingInvite ? (
              <>
                <ResendInviteButton userId={id} />
                <CancelInviteButton userId={id} />
              </>
            ) : (
              /* Changing your own role here would be easy to hit by mistake
                 and immediately cost you organiser access to fix it — same
                 reasoning as hiding your own Remove button below. Another
                 organiser can change it for you instead. */
              !member.isYou && (
                <MemberRoleButton
                  inviteRequired={setting?.organiserInviteRequired ?? false}
                  name={member.name}
                  role={member.role}
                  userId={id}
                />
              )
            )}
            {!member.isYou ? (
              <DeleteMemberButton
                attendanceCount={attendanceCount}
                name={member.name}
                redirectTo="/admin/members"
                userId={id}
                walkCount={member.walkCount}
              />
            ) : null}
          </div>
        </CardHeader>
      </Card>

      {/*
        A short, fixed-size summary of this person's activity that never grows
        no matter how long their history is — the opposite of the old drawer,
        which just kept getting taller as more rows were added. The full,
        searchable, paginated table below is still there for the detail; this
        is the "at a glance" answer to "what has this person been doing".
      */}
      <div className={`grid gap-3 ${member.role === "ADMIN" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        <StatCard label="Total walks" value={attendanceCount} />
        {/* Only organisers create walks — showing this for a member is
            always a confusing "0" that looks like a broken stat. */}
        {member.role === "ADMIN" ? <StatCard label="Walks created" value={member.walkCount} /> : null}
        <StatCard label="Cancelled after clock-in" value={cancelledCount} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {attendanceCount === 0
            ? "Walk history"
            : attendanceCount === 1
              ? "1 walk"
              : `${attendanceCount} walks`}
        </h2>
        {member.items.length < attendanceCount ? (
          <p className="text-xs text-muted-foreground">
            Showing the {member.items.length.toLocaleString("en-GB")} most recent.
          </p>
        ) : null}
        <AttendanceHistory
          rows={member.items.map((item) => ({
            id: item.id,
            title: item.walkTitle,
            location: item.location,
            startsAt: item.startsAt,
            durationMins: item.durationMins,
            cancelledAt: item.cancelledAt,
            clockedInAt: item.clockedInAt,
            clockedOutAt: item.clockedOutAt,
            clockedOutReason: item.clockedOutReason,
            completed:
              walkStatus({
                cancelledAt: item.cancelledAt ? new Date(item.cancelledAt) : null,
                startsAt: new Date(item.startsAt),
                durationMins: item.durationMins,
              }) === "completed",
            href: `/admin/walks/${item.walkId}`,
          }))}
        />
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="gap-1 py-4">
      <CardHeader className="gap-0 px-4">
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
    </Card>
  );
}
