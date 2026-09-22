export function AdminPageIntro({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  /** An optional button/link alongside the title — e.g. "Create a walk". */
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1.5">
        <h2 className="font-semibold text-lg tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
