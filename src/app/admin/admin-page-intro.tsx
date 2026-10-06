export function AdminPageIntro({
  title,
  description,
  action,
  as: Heading = "h1",
}: {
  title: string;
  description: string;
  /** An optional button/link alongside the title — e.g. "Create a walk". */
  action?: React.ReactNode;
  /** h1 for the page's own title; h2 for a later section that looks the same. */
  as?: "h1" | "h2";
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-1.5">
        <Heading className="font-semibold text-lg tracking-tight">{title}</Heading>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
