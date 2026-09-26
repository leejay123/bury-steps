import { DotPattern } from "@/components/ui/dot-pattern";
import { GridPattern } from "@/components/ui/grid-pattern";
import { CrossPattern } from "@/components/ui/cross-pattern";
import type { SectionBgPattern } from "@/lib/section-background";

/** Renders the chosen background layer behind a homepage section's content
 * — absolutely positioned, so the caller just needs `position: relative`
 * and to stack its real content above this with z-index or DOM order. All
 * static (no animation) — a first version had an animated option, dropped
 * after it read as distracting rather than decorative. */
export function SectionBackground({ pattern }: { pattern: SectionBgPattern }) {
  if (pattern === "dots") {
    return <DotPattern className="[mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />;
  }
  if (pattern === "grid") {
    return (
      <GridPattern className="[mask-image:radial-gradient(ellipse_at_center,white,transparent)] fill-transparent stroke-border" />
    );
  }
  if (pattern === "cross") {
    return <CrossPattern className="[mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />;
  }
  if (pattern === "diagonal") {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, var(--color-border) 0, var(--color-border) 1px, transparent 1px, transparent 12px)",
        }}
      />
    );
  }
  return null;
}
