"use client";

import { WalkGalleryLayouts } from "@/components/walk-gallery-layouts";
import { WalkIdeaLayouts } from "@/components/walk-idea-layouts";
import { WalkStudioLayouts } from "@/components/walk-studio-layouts";
import {
  isWalkGalleryLayout,
  isWalkIdeaLayout,
  isWalkStudioLayout,
  type WalkPageLayout,
} from "@/lib/walk-page-sections";
import { useWalkParts } from "./parts";
import { READY_LAYOUTS } from "./ready-layouts";

/** One of the numbered walk page designs, whole, exactly as on its own. */
export function ReadyLayoutBlock({
  layout: chosen = "s01",
}: {
  layout?: string;
}) {
  const layout = chosen as WalkPageLayout;
  const p = useWalkParts();
  const item = READY_LAYOUTS.find((entry) => entry.id === layout);
  if (!p)
    return (
      <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
        Ready-made layout · {item ? `${item.number} ${item.label}` : layout}
      </div>
    );
  if (isWalkStudioLayout(layout))
    return <WalkStudioLayouts layout={layout} parts={p} />;
  if (isWalkGalleryLayout(layout))
    return <WalkGalleryLayouts layout={layout} parts={p} />;
  if (isWalkIdeaLayout(layout))
    return <WalkIdeaLayouts layout={layout} parts={p} />;
  return null;
}
