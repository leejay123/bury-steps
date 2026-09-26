import type { ReactNode } from "react";

/** Renders children immediately. An earlier version faded them in with
 * Framer Motion, which kept the hero invisible until client JavaScript
 * had loaded. */
export function FadeIn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  inView?: boolean;
}) {
  return <div className={className}>{children}</div>;
}
