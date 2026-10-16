import Link from "next/link";
import { CompassIcon, HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
} from "@/components/ui/empty";
import { PAGE_X_BLEED } from "@/lib/page-x";
import { shouldPrefetchNavLink } from "@/components/site-nav-items";

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

export function NotFoundPage() {
  return (
    <GridMessageFrame>
      <Empty className="h-full">
        <EmptyHeader>
          {/* The page's heading, so screen readers announce what this is. */}
          <h1 className="font-mono text-8xl font-black tracking-tight" data-slot="empty-title">
            404<span className="sr-only"> — page not found</span>
          </h1>
          <EmptyDescription className="sm:text-nowrap">
            The page you’re looking for might have been{" "}
            <br className="hidden sm:inline" />
            moved or doesn’t exist.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/">
                <HomeIcon data-icon="inline-start" />
                Go Home
              </Link>
            </Button>
            <Button asChild variant="outline">
              {/* Guests see this page too: prefetching a sign-in-only
                  page redirects cross-site and logs a CORS error. */}
              <Link href="/walks" prefetch={shouldPrefetchNavLink("/walks") ? undefined : false}>
                <CompassIcon data-icon="inline-start" />
                Explore
              </Link>
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </GridMessageFrame>
  );
}
