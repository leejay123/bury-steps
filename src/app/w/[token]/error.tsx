"use client";

import { RouteError } from "@/components/route-error";

export default function WalkShareError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      description="Try again, or go back to the homepage."
      error={error}
      reset={reset}
      title="Something went wrong loading this walk"
    />
  );
}
