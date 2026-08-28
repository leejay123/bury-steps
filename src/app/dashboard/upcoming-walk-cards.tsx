"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronRight, Clock, MapPin } from "lucide-react";
import type { WindowState } from "@/lib/walk-window";
import { formatDateTime, formatWalkDate } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClockOutButton } from "@/components/clock-out-button";
import { WalkMembers } from "@/components/walk-members";

export type UpcomingWalkCard = {
  id: string;
  token: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  durationMins: number;
  cancelledAt: string | null;
  clockedInAt: string | null;
  state: WindowState;
  memberNames: string[];
};

function stopCardNavigation(event: React.SyntheticEvent) {
  event.stopPropagation();
}

export function UpcomingWalkCards({ walks }: { walks: UpcomingWalkCard[] }) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      {walks.map((walk) => (
        <Card
          className="cursor-pointer gap-3 transition-colors hover:bg-muted/40"
          key={walk.id}
          onClick={() => router.push(`/w/${walk.token}`)}
        >
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1.5">
              <CardTitle className="text-base">{walk.title}</CardTitle>
              <CardDescription className="flex flex-col gap-1">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  {formatWalkDate(new Date(walk.startsAt))}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  {walk.durationMins} min
                  {walk.location ? (
                    <>
                      <MapPin className="ml-1.5 size-3.5" />
                      {walk.location}
                    </>
                  ) : null}
                </span>
              </CardDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {walk.cancelledAt ? (
                <Badge variant="destructive">Cancelled</Badge>
              ) : walk.clockedInAt ? (
                <Badge variant="secondary">Clocked in</Badge>
              ) : walk.state === "open" ? (
                <Badge>Clock-in open</Badge>
              ) : null}
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {walk.description ? (
              <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {walk.description}
              </p>
            ) : null}
            {walk.cancelledAt ? (
              <p className="text-sm text-destructive">This walk has been cancelled.</p>
            ) : null}
            {!walk.cancelledAt && !walk.clockedInAt ? (
              <div onClick={stopCardNavigation} onPointerDown={stopCardNavigation}>
                <Button asChild disabled={walk.state === "closed"} size="sm">
                  <Link href={`/w/${walk.token}`}>
                    {walk.state === "open" ? "Clock in" : "Open pre-walk check"}
                  </Link>
                </Button>
              </div>
            ) : null}
            {walk.clockedInAt && !walk.cancelledAt ? (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  Clocked in at {formatDateTime(new Date(walk.clockedInAt))}
                </p>
                <div onClick={stopCardNavigation} onPointerDown={stopCardNavigation}>
                  <ClockOutButton token={walk.token} />
                </div>
                <WalkMembers names={walk.memberNames} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
