"use client";

import { useEffect } from "react";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Shared body for every route-scoped error.tsx. Centralising this means the
 * unstable_rethrow call (letting redirect()/notFound() pass through instead
 * of being swallowed as a generic error — both are used throughout auth and
 * data lookups) can't be forgotten when adding a new boundary.
 */
export function RouteError({
  error,
  reset,
  title,
  description,
  homeHref = "/",
  homeLabel = "Home",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
  description: string;
  homeHref?: string;
  homeLabel?: string;
}) {
  unstable_rethrow(error);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="space-y-4 py-12 text-center">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset} variant="outline">
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href={homeHref}>{homeLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
