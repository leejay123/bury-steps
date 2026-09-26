import { DotPattern } from "@/components/ui/dot-pattern";
import { StripeBgGuides } from "@/components/ui/stripe-bg-guides";
import type { SectionBgPattern } from "@/lib/section-background";

/** Renders the chosen background layer behind a homepage section's content
 * — absolutely positioned, so the caller just needs `position: relative`
 * and to stack its real content above this with z-index or DOM order. */
export function SectionBackground({ pattern }: { pattern: SectionBgPattern }) {
  if (pattern === "dots") {
    return <DotPattern className="[mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />;
  }
  if (pattern === "stripes") {
    return <StripeBgGuides />;
  }
  return null;
}
