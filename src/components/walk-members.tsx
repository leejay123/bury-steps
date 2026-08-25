export function WalkMembers({ names }: { names: string[] }) {
  const countLabel =
    names.length === 1 ? "1 person has clocked in." : `${names.length} people have clocked in.`;

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">Who’s coming</p>
        <p className="text-sm text-muted-foreground">{countLabel}</p>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5 text-sm">
        {names.map((name, index) => (
          <li key={`${name}-${index}`}>{name}</li>
        ))}
      </ul>
    </div>
  );
}
