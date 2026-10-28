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
  // The page's own title (h1) is a band edge to edge across the page, out
  // over the page's side and top space (every page here pads px-4 py-6,
  // md:px-6); its words keep the same inset as the content below. Its look
  // is Settings → Branding → Page tops (globals.css: [data-page-top-band]).
  const band = Heading === "h1";
  return (
    <div
      className={
        band
          ? "relative -mx-4 -mt-6 flex flex-col gap-3 border-b px-4 py-6 sm:flex-row sm:items-start sm:justify-between md:-mx-6 md:px-6"
          : "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
      }
      data-page-top-band={band ? "" : undefined}
    >
      <div className="flex flex-col gap-1.5">
        <Heading className="font-semibold text-lg tracking-tight" data-page-top-title={band ? "" : undefined}>
          {title}
        </Heading>
        <p className="text-sm text-muted-foreground" data-page-top-intro={band ? "" : undefined}>
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
