"use client";

import { RouteError } from "@/components/route-error";

export default function NoticeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      description="Try again, or head back to all notices."
      error={error}
      homeHref="/notices"
      homeLabel="All notices"
      reset={reset}
      title="Something went wrong loading this notice"
    />
  );
}
