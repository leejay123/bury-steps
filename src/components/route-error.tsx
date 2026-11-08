"use client";

import { useEffect } from "react";
import { unstable_rethrow } from "next/navigation";
import { StatusMessagePage } from "@/components/not-found";
import { PageKindMark } from "@/components/shadcnio/page-kind";

/**
 * Shared body for every route-scoped error.tsx, in the same design as the
 * Offline and Page Not Found pages (big grey "Error", title, line, two
 * buttons). Centralising this means the unstable_rethrow call (letting
 * redirect()/notFound() pass through instead of being swallowed as a generic
 * error — both are used throughout auth and data lookups) can't be forgotten
 * when adding a new boundary.
 *
 * `fullScreen` is for the site-wide error.tsx, which shows on its own like
 * Offline (no header or footer); the others sit inside the dashboard.
 */
export function RouteError({
  error,
  reset,
  title,
  description,
  homeHref = "/",
  homeLabel = "Home",
  fullScreen = false,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
  description: string;
  homeHref?: string;
  homeLabel?: string;
  fullScreen?: boolean;
}) {
  unstable_rethrow(error);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      {/* "home": it draws its whole own page, like Offline (page-kind.tsx). */}
      {fullScreen ? <PageKindMark kind="home" /> : null}
      <StatusMessagePage
        description={description}
        fullScreen={fullScreen}
        kicker="Error"
        primary={{ label: "Try again", onClick: reset }}
        secondary={{ href: homeHref, label: homeLabel }}
        title={title}
      />
    </>
  );
}
