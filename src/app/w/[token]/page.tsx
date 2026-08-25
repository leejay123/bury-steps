import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatWalkDate, formatDateTime } from "@/lib/dates";
import { windowState } from "@/lib/walk-window";
import { accountPortalHref } from "@/lib/urls";
import { ClockInForm } from "./clock-in-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function WalkLinkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { userId } = await auth();
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const proto = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const walkUrl = `${proto}://${host}/w/${token}`;

  const walk = await prisma.walk.findUnique({
    where: { token },
    select: {
      id: true,
      token: true,
      title: true,
      description: true,
      location: true,
      startsAt: true,
      durationMins: true,
      cancelledAt: true,
    },
  });

  if (!walk) notFound();

  const alreadyIn = userId
    ? await prisma.attendance.findFirst({
        where: { walkId: walk.id, user: { clerkId: userId } },
        select: { clockedInAt: true },
      })
    : null;

  const state = windowState(walk.startsAt, walk.durationMins);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-xl">{walk.title}</CardTitle>
            {walk.cancelledAt && <Badge variant="destructive">Cancelled</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            {formatWalkDate(walk.startsAt)}
            {walk.location ? ` \u00B7 ${walk.location}` : ""}
          </p>
        </CardHeader>
        {walk.description && (
          <CardContent className="pt-0">
            <p className="text-sm leading-relaxed">{walk.description}</p>
          </CardContent>
        )}
      </Card>

      {walk.cancelledAt ? (
        <Alert variant="destructive">
          <AlertTitle>This walk has been cancelled</AlertTitle>
          <AlertDescription>
            Check the walks list for the next one.
          </AlertDescription>
        </Alert>
      ) : !userId ? (
        <div className="space-y-4 rounded-lg border bg-muted/40 p-5">
          <div className="space-y-1">
            <p className="font-medium">You need to sign in to join this walk</p>
            <p className="text-sm text-muted-foreground">
              Clock-in is only for signed-in members. If you do not have an account yet, create one
              first. If you already have an account, sign in. You will come back to this walk
              afterwards.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <a href={accountPortalHref("sign-up", walkUrl)}>Create an account</a>
            </Button>
            <Button asChild size="sm" variant="outline">
              <a href={accountPortalHref("sign-in", walkUrl)}>Sign in</a>
            </Button>
          </div>
        </div>
      ) : alreadyIn ? (
        <div className="space-y-4 rounded-lg border bg-muted/40 p-5">
          <div className="space-y-1">
            <p className="font-medium">You are clocked in</p>
            <p className="text-sm tabular-nums text-muted-foreground">
              Recorded at {formatDateTime(alreadyIn.clockedInAt)}
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard">Back to walks</Link>
          </Button>
        </div>
      ) : state === "too-early" ? (
        <Alert>
          <AlertTitle>Clock-in is not open yet</AlertTitle>
          <AlertDescription>
            It opens an hour before the walk starts. Come back on the day and this page will be
            ready.
          </AlertDescription>
        </Alert>
      ) : state === "closed" ? (
        <Alert>
          <AlertTitle>Clock-in has closed</AlertTitle>
          <AlertDescription>
            If you were there, speak to an organiser and they can sort it out.
          </AlertDescription>
        </Alert>
      ) : (
        <SignedInClockIn token={walk.token} />
      )}
    </div>
  );
}

async function SignedInClockIn({ token }: { token: string }) {
  await requireUser();
  return <ClockInForm token={token} />;
}
