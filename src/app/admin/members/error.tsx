"use client";

import { RouteError } from "@/components/route-error";

export default function AdminMembersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      description="Nothing was saved. Try again, or head back to the admin dashboard."
      error={error}
      homeHref="/admin"
      homeLabel="Admin home"
      reset={reset}
      title="Something went wrong loading members"
    />
  );
}
