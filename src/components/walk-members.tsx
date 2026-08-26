import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(name: string) {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function WalkMembers({ names }: { names: string[] }) {
  const countLabel =
    names.length === 1 ? "1 person has clocked in." : `${names.length} people have clocked in.`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">Who’s coming</p>
        <p className="text-sm text-muted-foreground">{countLabel}</p>
      </div>
      <ul className="flex flex-col gap-2">
        {names.map((name, index) => (
          <li className="flex items-center gap-2.5" key={`${name}-${index}`}>
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
