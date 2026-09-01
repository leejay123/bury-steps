"use client";

import { RouteError } from "@/components/route-error";

export default function DashboardProgressError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      description="Try again, or head back to your walks."
      error={error}
      homeHref="/dashboard"
      homeLabel="Your walks"
      reset={reset}
      title="Something went wrong loading your progress"
    />
  );
}
