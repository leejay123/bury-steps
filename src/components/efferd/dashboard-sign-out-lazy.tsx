"use client";

import { lazy, Suspense } from "react";

// Split off like clerk-lazy.tsx, so Clerk's code isn't sent to signed-out visitors.
const DashboardSignOutInner = lazy(() =>
  import("./dashboard-sign-out").then((mod) => ({ default: mod.DashboardSignOut })),
);

export function LazyDashboardSignOut() {
  return (
    <Suspense fallback={null}>
      <DashboardSignOutInner />
    </Suspense>
  );
}
