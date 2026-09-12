import Link from "next/link";
import { Crown } from "lucide-react";
import type React from "react";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMemberHistory } from "@/server/actions";
import { formatDate, formatMembershipAge, formatRelativeDays } from "@/lib/dates";
import { initials } from "@/lib/names";
import { walkStatus } from "@/lib/walk-window";
import { getOwnerId } from "@/lib/site-owner";
import { SITE_SETTING_ID } from "@/lib/theme";
import { AttendanceHistory } from "@/components/attendance-history";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteMemberButton } from "../delete-member-button";
import { EditPermissionsButton } from "../edit-permissions-button";
import { ImpersonateButton } from "../impersonate-button";
import { MemberRoleButton } from "../member-role-button";
import { MemberRowActionsMenu } from "../member-row-actions-menu";
import { TransferOwnershipButton } from "../transfer-ownership-button";
import { CancelInviteButton, ResendInviteButton } from "../pending-invite-actions";

export const dynamic = "force-dynamic";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await requirePermission("permMembers");
  const { id } = await params;

  const [member, setting, ownerId] = await Promise.all([
    getMemberHistory(id),
    prisma.siteSetting.findUnique({
      where: { id: SITE_SETTING_ID },
      select: { organiserInviteRequired: true },
    }),
    getOwnerId(),
  ]);
  if (!member) notFound();
  const viewerIsOwner = viewer.id === ownerId;

  const joinedAt = new Date(member.createdAt);
  const attendanceCount = member.attendanceCount;
  const cancelledCount = member.items.filter((item) => item.cancelledAt).length;

  // One "primary" action shown as a direct button — the one someone's most
  // likely to want next — plus whatever else applies collapsed behind a
  // single "⋯" menu, so the owner viewing an organiser's page doesn't get a
  // wall of buttons (Make member/Edit permissions/Make owner/Remove). A lone
  // secondary action is still shown as a plain button rather than hidden
  // behind a one-item menu — each factory takes `asMenuItem` so that choice
  // can be made once the full count is known, below. Impersonate stays a
  // direct button on its own — it's unrelated to role changes and only ever
  // appears for a plain member.
  let primaryAction: React.ReactNode = null;
  const secondaryActions: ((asMenuItem: boolean) => React.ReactNode)[] = [];

  if (member.pendingInvite) {
    primaryAction = <ResendInviteButton key="resend" userId={id} />;
    secondaryActions.push((asMenuItem) => (
      <CancelInviteButton asMenuItem={asMenuItem} key="cancel" userId={id} />
    ));
    if (viewerIsOwner) {
      secondaryActions.push((asMenuItem) => (
        <EditPermissionsButton
          asMenuItem={asMenuItem}
          initialPermissions={member.permissions}
          key="edit-permissions"
          name={member.name}
          userId={id}
        />
      ));
    }
  } else if (
    // Changing your own role here would be easy to hit by mistake and
    // immediately cost you organiser access to fix it — same reasoning as
    // hiding your own Remove button below. Another organiser can change it
    // for you instead. Promoting, demoting, editing permissions, and
    // transferring ownership are all owner-only regardless of whose page
    // this is.
    !member.isYou &&
    viewerIsOwner
  ) {
    primaryAction = (
      <MemberRoleButton
        initialPermissions={member.permissions}
        inviteRequired={setting?.organiserInviteRequired ?? false}
        key="role"
        name={member.name}
        role={member.role}
        userId={id}
      />
    );
    if (member.role === "ADMIN") {
      secondaryActions.push(
        (asMenuItem) => (
          <EditPermissionsButton
            asMenuItem={asMenuItem}
            initialPermissions={member.permissions}
            key="edit-permissions"
            name={member.name}
            userId={id}
          />
        ),
        (asMenuItem) => (
          <TransferOwnershipButton asMenuItem={asMenuItem} key="transfer" name={member.name} userId={id} />
        ),
      );
    }
  }

  if (!member.isYou && (member.role !== "ADMIN" || viewerIsOwner)) {
    secondaryActions.push((asMenuItem) => (
      <DeleteMemberButton
        asMenuItem={asMenuItem}
        attendanceCount={attendanceCount}
        key="delete"
        name={member.name}
        redirectTo="/admin/members"
        userId={id}
        walkCount={member.walkCount}
      />
    ));
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <Link className="text-sm text-muted-foreground hover:text-foreground" href="/admin/members">
        &larr; All members
      </Link>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <Avatar className="size-12 shrink-0">
              <AvatarFallback>{initials(member.name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-2xl">{member.name}</CardTitle>
                {member.pendingInvite ? (
                  // Plain text, not a Badge — an outline badge next to the
                  // outline Resend/Cancel buttons below read as a third
                  // (non-working) button rather than a status label.
                  <span className="text-sm font-medium text-muted-foreground">
                    {member.pendingInvite.expired
                      ? `Invite expired ${formatRelativeDays(new Date(member.pendingInvite.expiresAt))}`
                      : `Invited ${formatRelativeDays(new Date(member.pendingInvite.sentAt))}`}
                  </span>
                ) : (
                  <Badge className="h-7 border-border px-2" variant="secondary">
                    {member.isOwner ? <Crown /> : null}
                    {member.isOwner ? "Owner" : member.role === "ADMIN" ? "Organiser" : "Member"}
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
          </div>
          <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">
            {member.role === "MEMBER" && !member.pendingInvite ? (
              <ImpersonateButton name={member.name} userId={id} />
            ) : null}
            {primaryAction}
            {secondaryActions.length === 0
              ? null
              : secondaryActions.length === 1
                ? secondaryActions[0](false)
                : (
                    <MemberRowActionsMenu>
                      {secondaryActions.map((render) => render(true))}
                    </MemberRowActionsMenu>
                  )}
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
                endedAt: item.endedAt ? new Date(item.endedAt) : null,
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
