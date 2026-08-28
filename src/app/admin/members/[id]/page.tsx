import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getMemberHistory } from "@/server/actions";
import { formatDate, formatMembershipAge } from "@/lib/dates";
import { AttendanceHistory } from "@/components/attendance-history";
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
  const attendanceCount = member.items.length;

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

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {attendanceCount === 0
            ? "Walk history"
            : attendanceCount === 1
              ? "1 walk"
              : `${attendanceCount} walks`}
        </h2>
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
