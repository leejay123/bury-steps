import type { ReactNode } from "react";

/**
 * A page's own title and intro line. The usual look is unchanged (a small
 * title and a grey line); in the shadcn.io design shadcnio.css turns the same
 * markup into their page head: a small capital label above, a large title, a
 * larger intro, buttons on the right and a line across the page underneath.
 */
export function PageTop({
  title,
  intro,
  eyebrow,
  action,
  children,
  className = "flex flex-col gap-1.5",
}: {
  title: ReactNode;
  intro?: ReactNode;
  /** The small capital label above the title (shadcn.io design only). */
  eyebrow: string;
  /** A button or link beside the title. */
  action?: ReactNode;
  /** More lines under the intro. */
  children?: ReactNode;
  /** The usual look's wrapper classes. */
  className?: string;
}) {
  return (
    <div
      className={action ? "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between" : "contents"}
      data-shadcn-top=""
    >
      <div className={className}>
        <p className="hidden" data-page-top-eyebrow="">
          {eyebrow}
        </p>
        <h1 className="text-lg font-semibold tracking-tight" data-page-top-title="">
          {title}
        </h1>
        {intro ? (
          <p className="text-sm text-muted-foreground" data-page-top-intro="">
            {intro}
          </p>
        ) : null}
        {children}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
