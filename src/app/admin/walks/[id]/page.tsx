import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin, displayName } from "@/lib/auth";
import { formatWalkDate, formatDateTime, formatTime } from "@/lib/dates";
import { windowState } from "@/lib/walk-window";
import { appUrl } from "@/lib/urls";
import { ShareLink } from "@/components/share-link";
import { EmptyState } from "@/components/empty-state";
import { CancelWalkButton } from "./cancel-walk-button";
import { ReopenWalkButton } from "./reopen-walk-button";
import { DeleteWalkButton } from "./delete-walk-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function WalkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const walk = await prisma.walk.findUnique({
    where: { id },
    select: {
      id: true,
      token: true,
      title: true,
      description: true,
      location: true,
      startsAt: true,
      durationMins: true,
      cancelledAt: true,
      cancelledReason: true,
      attendances: {
        orderBy: [{ clockedOutAt: "asc" }, { clockedInAt: "asc" }],
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      },
    },
  });

  if (!walk) notFound();

  const state = windowState(walk.startsAt, walk.durationMins);
  const stillIn = walk.attendances.filter((a) => !a.clockedOutAt);
  const clockedOut = walk.attendances.filter((a) => a.clockedOutAt);
  const withConditions = walk.attendances.filter((a) => a.conditions).length;

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-8">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; All walks
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <CardTitle className="text-2xl">{walk.title}</CardTitle>
            <CardDescription>
              {formatWalkDate(walk.startsAt)}
              {walk.location ? ` · ${walk.location}` : ""} · {walk.durationMins} min
            </CardDescription>
          </div>
          {walk.cancelledAt ? (
            <Badge variant="destructive">Cancelled</Badge>
          ) : state === "open" ? (
            <Badge>Clock-in open</Badge>
          ) : state === "too-early" ? (
            <Badge variant="secondary">Upcoming</Badge>
          ) : (
            <Badge variant="outline">Finished</Badge>
          )}
        </CardHeader>
        {walk.description || (walk.cancelledAt && walk.cancelledReason) ? (
          <CardContent className="flex flex-col gap-2">
            {walk.description ? (
              <p className="text-sm leading-relaxed">{walk.description}</p>
            ) : null}
            {walk.cancelledAt && walk.cancelledReason ? (
              <p className="text-sm text-destructive">Cancelled: {walk.cancelledReason}</p>
            ) : null}
          </CardContent>
        ) : null}
      </Card>

      <ShareLink url={`${appUrl()}/w/${walk.token}`} />

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <a href={`/admin/walks/${walk.id}/export`}>Download roster (CSV)</a>
        </Button>
        {!walk.cancelledAt && (
          <CancelWalkButton walkId={walk.id} attendanceCount={stillIn.length} />
        )}
        {walk.cancelledAt ? <ReopenWalkButton walkId={walk.id} /> : null}
        <DeleteWalkButton walkId={walk.id} attendanceCount={walk.attendances.length} />
      </div>

      <Separator />

      {withConditions > 0 && (
        <Alert>
          <AlertTitle>
            {withConditions} {withConditions === 1 ? "member has" : "members have"} reported a
            condition
          </AlertTitle>
          <AlertDescription>
            Read these before setting off. They are deleted 90 days after the walk.
          </AlertDescription>
        </Alert>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Attendance</h2>
          <span className="text-sm tabular-nums text-muted-foreground">
            {stillIn.length} on the walk
            {clockedOut.length > 0 ? ` · ${clockedOut.length} clocked out` : ""}
          </span>
        </div>

        {walk.attendances.length === 0 ? (
          <EmptyState
            description="Share the link above with the group."
            icon={ClipboardList}
            title="Nobody has clocked in yet"
          />
        ) : (
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24 text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {walk.attendances.map((a) => {
                  const name = displayName(a.user);
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="align-top">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="size-7">
                              <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{name}</p>
                              <p className="truncate text-xs text-muted-foreground">{a.user.email}</p>
                            </div>
                          </div>
                          {a.clockedOutAt && a.clockedOutReason ? (
                            <p className="rounded-md bg-muted px-2.5 py-1.5 text-xs leading-relaxed">
                              Clock-out: {a.clockedOutReason}
                            </p>
                          ) : null}
                          {a.conditions ? (
                            <p className="rounded-md bg-accent px-2.5 py-1.5 text-xs leading-relaxed">
                              {a.conditions}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">No conditions reported</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        {a.clockedOutAt ? (
                          <Badge variant="secondary">Clocked out</Badge>
                        ) : (
                          <Badge variant="outline">On the walk</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right align-top">
                        <span className="text-sm tabular-nums" title={formatDateTime(a.clockedInAt)}>
                          {formatTime(a.clockedInAt)}
                        </span>
                        {a.clockedOutAt ? (
                          <p
                            className="text-xs tabular-nums text-muted-foreground"
                            title={formatDateTime(a.clockedOutAt)}
                          >
                            Left {formatTime(a.clockedOutAt)}
                          </p>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
        )}
      </section>
    </div>
  );
}
