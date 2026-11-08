"use client";

import { RouteError } from "@/components/route-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      description="Nothing was saved. Try again, or go back to the homepage. Tell an organiser if it keeps happening."
      error={error}
      fullScreen
      reset={reset}
      title="Something went wrong loading this page"
    />
  );
}
