import { DotPattern } from "@/components/ui/dot-pattern";
import { GridPattern } from "@/components/ui/grid-pattern";
import { CrossPattern } from "@/components/ui/cross-pattern";
import { StarsBackground } from "@/components/animate-ui/components/backgrounds/stars";
import { RetroGrid } from "@/components/velora/retro-grid";
import type { SectionBgPattern } from "@/lib/section-background";

/** Renders the chosen background layer behind a homepage section's content
 * — absolutely positioned, so the caller just needs `position: relative`
 * and to stack its real content above this with z-index or DOM order.
 * Stars and Retro grid are the animated options, added on request. */
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
  if (pattern === "stars") {
    return (
      <StarsBackground
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_#f5f5f5_0%,_#fff_100%)]"
        pointerEvents={false}
        starColor="#000"
      />
    );
  }
  if (pattern === "retro") {
    return <RetroGrid opacity={0.6} />;
  }
  return null;
}
