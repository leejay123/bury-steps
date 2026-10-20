import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/** Initials for a name ("Jane Smith" → "JS"). */
function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/**
 * Who's clocked in, as overlapping profile photos (initials when there's
 * none), then "+N" and the count. Only drawn where the viewer may see who's
 * on the walk (organisers; members once they've clocked in).
 */
export function AvatarStack({
  people,
  max = 5,
}: {
  people: { name: string; imageUrl?: string | null }[];
  max?: number;
}) {
  if (people.length === 0) return null;
  const shown = people.slice(0, max);
  const more = people.length - shown.length;
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {shown.map((person, i) => (
          <Avatar
            className="size-8 border-2 border-background"
            key={`${i}-${person.name}`}
            title={person.name}
          >
            {person.imageUrl ? (
              <AvatarImage alt={person.name} src={person.imageUrl} />
            ) : null}
            <AvatarFallback className="text-[11px]">
              {initialsOf(person.name)}
            </AvatarFallback>
          </Avatar>
        ))}
        {more > 0 ? (
          <span className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[11px] font-medium">
            +{more}
          </span>
        ) : null}
      </div>
      <span className="text-sm text-muted-foreground">
        {people.length} clocked in
      </span>
    </div>
  );
}
