import Link from "next/link";
import type { ReactNode } from "react";

/**
 * shadcn.io's own 404 layout (their markup and classes): the big grey kicker,
 * a title, a line, and two actions. Offline and every error page use the same
 * page so they always look alike.
 */
/** A button that goes somewhere, or (error pages' "Try again") does something. */
export type StatusAction = { label: string } & ({ href: string } | { onClick: () => void });

export function StatusMessagePage({
  kicker,
  title,
  description,
  primary,
  secondary,
  fullScreen = true,
  plainLinks = false,
}: {
  kicker: string;
  title: string;
  description: ReactNode;
  primary: StatusAction;
  secondary: StatusAction;
  /** Off for an error inside the dashboard: the same look, sized to the page's column. */
  fullScreen?: boolean;
  /** Plain <a> links (a full page load), for the last-resort error page where the router itself broke. */
  plainLinks?: boolean;
}) {
  const action = (a: StatusAction, className: string) => {
    if ("onClick" in a)
      return (
        <button className={className} onClick={a.onClick} type="button">
          {a.label}
        </button>
      );
    if (plainLinks)
      return (
        <a className={className} href={a.href}>
          {a.label}
        </a>
      );
    return (
      <Link className={className} href={a.href} prefetch={false}>
        {a.label}
      </Link>
    );
  };
  return (
    <main
      className={
        fullScreen
          ? "style-nova theme-neutral radius-default flex min-h-dvh items-center justify-center bg-background py-12"
          : "flex items-center justify-center py-16 sm:py-24"
      }
    >
      <div className="container flex flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <span className="font-bold text-6xl text-muted-foreground sm:text-8xl">{kicker}</span>
          <h1 className="font-semibold text-2xl">{title}</h1>
          <p className="max-w-xs text-lg text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-row-reverse items-center gap-4">
          {action(primary, `${BUTTON} cn-button-variant-default`)}
          <span className="text-muted-foreground">or</span>
          {action(secondary, `${BUTTON} cn-button-variant-outline bg-background hover:bg-muted`)}
        </div>
      </div>
    </main>
  );
}

/** Missing addresses, and notFound() from any page: the same standalone page. */
export function NotFoundPage() {
  return (
    <StatusMessagePage
      description="The page you're looking for doesn't exist or has been moved."
      kicker="404"
      primary={{ href: "/", label: "Back to Home" }}
      secondary={{ href: "/contact", label: "Report Issue" }}
      title="Page Not Found"
    />
  );
}

/** Service-worker fallback when a page isn't cached and there's no signal. */
export function OfflinePage() {
  return (
    <StatusMessagePage
      description="A walk you already opened should still be here. Anything new will load again once you have a signal."
      kicker="Offline"
      primary={{ href: "/", label: "Go Home" }}
      secondary={{ href: "/walks", label: "Try Walks again" }}
      title="You're offline"
    />
  );
}

const BUTTON =
  "cn-button group/button relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap outline-none transition-transform disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 data-disabled:pointer-events-none data-disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[state=loading]:pointer-events-none active:not-aria-[haspopup]:scale-[0.98] cn-button-size-lg rounded-[calc(var(--radius)*100)] h-11 px-6 font-medium text-[15px]";
