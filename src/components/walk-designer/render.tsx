"use client";

import { Render, type Data } from "@puckeditor/core";
import type { WalkIdeaParts } from "@/components/walk-idea-layouts";
import { walkDesignConfig } from "./config";
import { MoreBelow } from "./more-below";
import { WalkPartsProvider } from "./parts";
import { DEFAULT_WALK_DESIGN } from "./presets";

/** A walk page drawn from a design made in the walk page designer (or the first ready-made one). */
export function WalkDesignRender({
  data,
  parts,
}: {
  data: unknown;
  parts: WalkIdeaParts;
}) {
  const design = isPuckData(data) ? data : DEFAULT_WALK_DESIGN();
  return (
    <WalkPartsProvider parts={parts}>
      <Render config={walkDesignConfig} data={design} />
      <MoreBelow />
    </WalkPartsProvider>
  );
}

export function isPuckData(value: unknown): value is Data {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as Data).content)
  );
}
