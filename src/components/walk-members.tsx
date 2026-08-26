export function WalkMembers({ names }: { names: string[] }) {
  const countLabel =
    names.length === 1 ? "1 person has clocked in." : `${names.length} people have clocked in.`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">Who’s coming</p>
        <p className="text-sm text-muted-foreground">{countLabel}</p>
      </div>
      <ul className="divide-y overflow-hidden rounded-xl border text-sm">
        {names.map((name, index) => (
          <li className="px-3 py-2.5" key={`${name}-${index}`}>
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}
