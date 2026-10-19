import { CalendarDays, Clock, Coffee, Footprints, MapPin, Mountain, TrendingUp, Timer, UserRound, UsersRound } from "lucide-react";
import { formatTime, formatWalkDay, formatWalkLength } from "@/lib/dates";
import { meetingPointLabel } from "@/lib/geocode";
import { WalkEssentialPills } from "@/components/walk-essentials-context";

export function WalkFacts({
  backMarker,
  refreshmentStop,
  distance,
  durationMins,
  elevationGain,
  essentials,
  grade,
  location,
  postcode,
  showEmpty = false,
  startsAt,
  walkLeader,
}: {
  backMarker?: string | null;
  refreshmentStop?: string | null;
  distance?: string | null;
  durationMins: number;
  elevationGain?: string | null;
  essentials?: string[];
  grade?: string | null;
  location: string | null;
  postcode?: string | null;
  /** Organisers: every field, "Not set" where it's empty, so a walk's missing details are obvious. */
  showEmpty?: boolean;
  startsAt: Date;
  walkLeader?: string | null;
}) {
  const meeting = meetingPointLabel(location, postcode);
  const rows = [
    { icon: CalendarDays, label: "Date", value: formatWalkDay(startsAt) },
    { icon: Clock, label: "Start time", value: formatTime(startsAt) },
    { icon: Timer, label: "Expected length", value: formatWalkLength(durationMins) },
    ...[
      { icon: MapPin, label: "Meeting point", value: meeting },
      { icon: Footprints, label: "Distance", value: distance },
      { icon: Mountain, label: "Elevation gain", value: elevationGain },
      { icon: TrendingUp, label: "Grade", value: grade },
      { icon: UserRound, label: "Walk leader", value: walkLeader },
      { icon: UsersRound, label: "Back marker", value: backMarker },
      { icon: Coffee, label: "Refreshment stop", value: refreshmentStop },
    ].flatMap((row) => (row.value ? [{ ...row, value: row.value }] : showEmpty ? [{ ...row, value: "Not set" }] : [])),
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
      {showEmpty && !essentials?.length ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium tracking-wide uppercase">Essentials</span> · None ticked
        </p>
      ) : (
        <WalkEssentialPills keys={essentials} />
      )}
    </div>
  );
}
