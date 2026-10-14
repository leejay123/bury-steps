import {
  WALK_GALLERY_LAYOUTS,
  WALK_IDEA_LAYOUTS,
  WALK_STUDIO_LAYOUTS,
} from "@/lib/walk-page-sections";

/**
 * Every numbered walk page design (Settings → Site wording → Walk page
 * cards → Layout, 1 to 81), for the designer's Ready-made layout block and
 * its list of ready-made pages: 1–21 the first ideas, 22–51 the gallery,
 * 52–81 the Details-first designs.
 */
export const READY_LAYOUTS = [
  ...WALK_IDEA_LAYOUTS.map((item, i) => ({
    id: item.id as string,
    number: i + 1,
    label: item.label,
    group: "Designs 1–21",
  })),
  ...WALK_GALLERY_LAYOUTS.map((item, i) => ({
    id: item.id as string,
    number: 22 + i,
    label: item.label,
    group: `Designs 22–51 · ${item.look}`,
  })),
  ...WALK_STUDIO_LAYOUTS.map((item, i) => ({
    id: item.id as string,
    number: 52 + i,
    label: item.label,
    group: `Details first 52–81 · ${item.look}`,
  })),
];
