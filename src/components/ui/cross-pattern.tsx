"use client";

import { useId, type SVGProps } from "react";
import { cn } from "@/lib/utils";

/** Small "+" marks at each grid intersection — the classic subtle
 * plus-grid look (Stripe docs, Vercel marketing pages, …). Static, no
 * animation. */
export function CrossPattern({
  width = 32,
  height = 32,
  size = 5,
  className,
  ...props
}: SVGProps<SVGSVGElement> & { width?: number; height?: number; size?: number }) {
  const id = useId();
  const half = size / 2;

  return (
    <svg
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 size-full stroke-border", className)}
      {...props}
    >
      <defs>
        <pattern height={height} id={id} patternUnits="userSpaceOnUse" width={width} x={0} y={0}>
          <path d={`M${width / 2 - half} ${height / 2} h${size} M${width / 2} ${height / 2 - half} v${size}`} />
        </pattern>
      </defs>
      <rect fill={`url(#${id})`} height="100%" strokeWidth={0} width="100%" />
    </svg>
  );
}
