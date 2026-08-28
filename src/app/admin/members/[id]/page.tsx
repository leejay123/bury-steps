import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getMemberHistory } from "@/server/actions";
import { formatCompactDateTime, formatDate, formatMembershipAge, formatWalkDate } from "@/lib/dates";
import { AttendanceHistory } from "@/components/attendance-history";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteMemberButton } from "../delete-member-button";

export const dynamic = "force-dynamic";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const member = await getMemberHistory(id);
  if (!member) notFound();

  const joinedAt = new Date(member.createdAt);
  const attendanceCount = member.attendanceCount;
  // Clocked in, not clocked out, and the walk itself was not cancelled out
  // from under them — the walks they are on right now, at a glance, rather
  // than the admin having to scan the whole table below to notice.
  const stillOn = member.items.filter((item) => !item.clockedOutAt && !item.cancelledAt);
  const cancelledCount = member.items.filter((item) => item.cancelledAt).length;

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-6">
      <Link className="text-sm text-muted-foreground hover:text-foreground" href="/admin/members">
        &larr; All members
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <CardTitle className="text-2xl">{member.name}</CardTitle>
            <CardDescription className="flex flex-col gap-1">
              <span className="wrap-break-word">{member.email || "No email"}</span>
              <span>
                Joined {formatDate(joinedAt)} · member for {formatMembershipAge(joinedAt)}
              </span>
            </CardDescription>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Badge variant={member.role === "ADMIN" ? "default" : "secondary"}>
              {member.role === "ADMIN" ? "Organiser" : "Member"}
            </Badge>
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

      {stillOn.length > 0 ? (
        <Alert>
          <AlertTitle>
            {stillOn.length === 1
              ? "Currently clocked in to a walk"
              : `Currently clocked in to ${stillOn.length} walks`}
          </AlertTitle>
          <AlertDescription>
            <ul className="flex flex-col gap-1">
              {stillOn.map((item) => (
                <li key={item.id}>
                  <Link className="underline hover:no-underline" href={`/admin/walks/${item.walkId}`}>
                    {item.walkTitle}
                  </Link>
                  {" · "}
                  {formatWalkDate(new Date(item.startsAt))}
                  {" · clocked in "}
                  {formatCompactDateTime(new Date(item.clockedInAt))}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

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
