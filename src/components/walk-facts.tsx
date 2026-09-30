import { CalendarDays, Clock, Footprints, MapPin, Mountain, TrendingUp, Timer, UserRound, UsersRound } from "lucide-react";
import { formatTime, formatWalkDay, formatWalkLength } from "@/lib/dates";
import { meetingPointLabel } from "@/lib/geocode";
import { WalkEssentialPills } from "@/components/walk-essentials-context";

export function WalkFacts({
  backMarker,
  distance,
  durationMins,
  elevationGain,
  essentials,
  grade,
  location,
  postcode,
  startsAt,
  walkLeader,
}: {
  backMarker?: string | null;
  distance?: string | null;
  durationMins: number;
  elevationGain?: string | null;
  essentials?: string[];
  grade?: string | null;
  location: string | null;
  postcode?: string | null;
  startsAt: Date;
  walkLeader?: string | null;
}) {
  const meeting = meetingPointLabel(location, postcode);
  const rows = [
    { icon: CalendarDays, label: "Date", value: formatWalkDay(startsAt) },
    { icon: Clock, label: "Start time", value: formatTime(startsAt) },
    { icon: Timer, label: "Expected length", value: formatWalkLength(durationMins) },
    ...(meeting ? [{ icon: MapPin, label: "Meeting point", value: meeting }] : []),
    ...(distance ? [{ icon: Footprints, label: "Distance", value: distance }] : []),
    ...(elevationGain ? [{ icon: Mountain, label: "Elevation gain", value: elevationGain }] : []),
    ...(grade ? [{ icon: TrendingUp, label: "Grade", value: grade }] : []),
    ...(walkLeader ? [{ icon: UserRound, label: "Walk leader", value: walkLeader }] : []),
    ...(backMarker ? [{ icon: UsersRound, label: "Back marker", value: backMarker }] : []),
  ];


  return (
    <div className="@container flex flex-col gap-3">
      {/* Soft tiles, no border (a border read as a box inside the card).
          Each spells out its label so a bare name like "leejay" reads as
          the walk leader, not just a person. */}
      <dl className="grid grid-cols-2 gap-2 @lg:grid-cols-3 @3xl:grid-cols-4">
        {rows.map((row) => (
          <div className="flex min-w-0 flex-col gap-1 rounded-lg bg-muted/60 px-3 py-2.5" key={row.label}>
            <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <row.icon aria-hidden="true" className="size-3.5 shrink-0" />
              {row.label}
            </dt>
            <dd className="text-sm font-medium break-words">{row.value}</dd>
          </div>
        ))}
      </dl>
      <WalkEssentialPills keys={essentials} />
    </div>
  );
}
