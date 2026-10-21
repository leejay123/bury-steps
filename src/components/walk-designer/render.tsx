"use client";

import { Render, type Data } from "@puckeditor/core";
import type { WalkIdeaParts } from "@/components/walk-idea-layouts";
import { walkDesignConfig } from "./config";
import { ViewerAudience, WalkPartsProvider } from "./parts";
import type { WalkDesignAudience } from "@/lib/walk-page-choice";
import { DEFAULT_WALK_DESIGN } from "./presets";

/** A walk page drawn from a design made in the walk page designer (or the first ready-made one). */
export function WalkDesignRender({
  audience,
  data,
  parts,
}: {
  /** Who this copy of the page is for (tabs set to one group use it). */
  audience: WalkDesignAudience;
  data: unknown;
  parts: WalkIdeaParts;
}) {
  const design = isPuckData(data) ? data : DEFAULT_WALK_DESIGN();
  return (
    <ViewerAudience.Provider value={audience}>
      <WalkPartsProvider parts={parts}>
        <Render config={walkDesignConfig} data={design} />
      </WalkPartsProvider>
    </ViewerAudience.Provider>
  );
}

export function isPuckData(value: unknown): value is Data {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as Data).content)
  );
}
