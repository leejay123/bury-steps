import { CalendarDays, Clock, MapPin, Timer } from "lucide-react";
import { formatTime, formatWalkDay, formatWalkLength } from "@/lib/dates";
import { meetingPointLabel } from "@/lib/geocode";

export function WalkFacts({
  durationMins,
  location,
  postcode,
  startsAt,
}: {
  durationMins: number;
  location: string | null;
  postcode?: string | null;
  startsAt: Date;
}) {
  const meeting = meetingPointLabel(location, postcode);
  const rows = [
    { icon: CalendarDays, label: "Date", value: formatWalkDay(startsAt) },
    { icon: Clock, label: "Start time", value: formatTime(startsAt) },
    { icon: Timer, label: "Expected length", value: formatWalkLength(durationMins) },
    ...(meeting ? [{ icon: MapPin, label: "Meeting point", value: meeting }] : []),
  ];

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li className="flex items-start gap-2.5 text-sm" key={row.label}>
          <row.icon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          <span>
            <span className="sr-only">{row.label}: </span>
            {row.value}
          </span>
        </li>
      ))}
    </ul>
  );
}
