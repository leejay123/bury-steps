import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin, displayName } from "@/lib/auth";
import { formatWalkDate, formatDateTime, formatTime } from "@/lib/dates";
import { windowState } from "@/lib/walk-window";
import { ShareLink } from "@/components/share-link";
import { CancelWalkButton } from "./cancel-walk-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    include: {
      attendances: {
        orderBy: { clockedInAt: "asc" },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      },
    },
  });

  if (!walk) notFound();

  const state = windowState(walk.startsAt, walk.durationMins);
  const withConditions = walk.attendances.filter((a) => a.conditions).length;

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
        &larr; All walks
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{walk.title}</h1>
          {walk.cancelledAt ? (
            <Badge variant="destructive">Cancelled</Badge>
          ) : state === "open" ? (
            <Badge>Clock-in open</Badge>
          ) : state === "too-early" ? (
            <Badge variant="secondary">Upcoming</Badge>
          ) : (
            <Badge variant="outline">Finished</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {formatWalkDate(walk.startsAt)}
          {walk.location ? ` \u00B7 ${walk.location}` : ""} &middot; {walk.durationMins} min
        </p>
        {walk.description && <p className="text-sm leading-relaxed">{walk.description}</p>}
      </header>

      <ShareLink url={`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/w/${walk.token}`} />

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <a href={`/admin/walks/${walk.id}/export`}>Download roster (CSV)</a>
        </Button>
        {!walk.cancelledAt && (
          <CancelWalkButton walkId={walk.id} attendanceCount={walk.attendances.length} />
        )}
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

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Attendance</h2>
          <span className="text-sm tabular-nums text-muted-foreground">
            {walk.attendances.length} clocked in
          </span>
        </div>

        {walk.attendances.length === 0 ? (
          <p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">
            Nobody has clocked in yet. Share the link above with the group.
          </p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead className="w-24 text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {walk.attendances.map((a) => {
                  const name = displayName(a.user);
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="space-y-1.5 align-top">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="size-7">
                            <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{name}</p>
                            <p className="truncate text-xs text-muted-foreground">{a.user.email}</p>
                          </div>
                        </div>
                        {a.conditions ? (
                          <p className="rounded-md bg-accent px-2.5 py-1.5 text-xs leading-relaxed">
                            {a.conditions}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">No conditions reported</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right align-top">
                        <span className="text-sm tabular-nums" title={formatDateTime(a.clockedInAt)}>
                          {formatTime(a.clockedInAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
