import type { ReactNode } from "react";

/** The real content, with no grey placeholder in front of it. */
export function SkeletonReveal({
  children,
}: {
  loading?: boolean;
  skeleton?: ReactNode;
  children: ReactNode;
  pulseCount?: number;
  pulseDuration?: number;
  revealDuration?: number;
  className?: string;
}) {
  return children;
}
