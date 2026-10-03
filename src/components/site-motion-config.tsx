"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";

/**
 * Every Motion animation on the site follows the visitor's "reduce motion"
 * setting (phone or computer accessibility settings): movement is skipped,
 * fades still happen. Some people turn it on because motion makes them feel
 * unwell — before this only a few components checked it themselves.
 */
export function SiteMotionConfig({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
