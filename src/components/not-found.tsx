import Link from "next/link";
import { PAGE_X_BLEED } from "@/lib/page-x";

/**
 * The page-in-a-grid frame of the Not found page: the message in the middle
 * square of a 3×3 grid of thin lines. The offline page uses it too, so the
 * two always look alike.
 */
export function GridMessageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`-my-6 grid min-h-[calc(100dvh-8.5rem)] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-px bg-border ${PAGE_X_BLEED}`}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <div className="bg-background" key={i}>
          {i === 4 ? children : null}
        </div>
      ))}
    </div>
  );
}

/** shadcn.io's own 404 (their markup and classes, as on shadcn.io/any-missing-page):
 * the big grey 404, "Page Not Found", a line, and Back to Home or Report Issue
 * (ours goes to the Contact page). */
export function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100dvh-8.5rem)] items-center justify-center py-12">
      <div className="container flex flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <span className="font-bold text-6xl text-muted-foreground sm:text-8xl">404</span>
          <h1 className="font-semibold text-2xl">Page Not Found</h1>
          <p className="max-w-xs text-lg text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <div className="flex flex-row-reverse items-center gap-4">
          <Link className={`${BUTTON} cn-button-variant-default`} href="/">
            Back to Home
          </Link>
          <span className="text-muted-foreground">or</span>
          {/* Guests see this page too, so nothing here is fetched ahead. */}
          <Link className={`${BUTTON} cn-button-variant-outline bg-background hover:bg-muted`} href="/contact" prefetch={false}>
            Report Issue
          </Link>
        </div>
      </div>
    </div>
  );
}

const BUTTON =
  "cn-button group/button relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap outline-none transition-transform disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 data-disabled:pointer-events-none data-disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[state=loading]:pointer-events-none active:not-aria-[haspopup]:scale-[0.98] cn-button-size-lg rounded-[calc(var(--radius)*100)] h-11 px-6 font-medium text-[15px]";
