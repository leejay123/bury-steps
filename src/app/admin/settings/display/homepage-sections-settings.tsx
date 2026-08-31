"use client";

import { ReorderButtons, useReorderableIds } from "@/components/sortable-rows";
import { reorderHomepageSections } from "@/server/actions";
import {
  HOMEPAGE_SECTION_LABELS,
  type HomepageSectionId,
} from "@/lib/homepage-sections";
import { SettingsSection } from "../settings-page";

async function saveSectionOrder(ids: string[]) {
  return reorderHomepageSections(ids as HomepageSectionId[]);
}

export function HomepageSectionsSettings({
  sectionOrder,
}: {
  sectionOrder: HomepageSectionId[];
}) {
  const { order, moveDown, moveUp } = useReorderableIds(sectionOrder, saveSectionOrder);

  return (
    <SettingsSection
      description="Change the order of blocks below the hero. Empty testimonials or FAQs still skip on the homepage until you add content."
      title="Homepage section order"
    >
      <ul className="flex flex-col gap-2">
        {order.map((id, index) => {
          const sectionId = id as HomepageSectionId;
          return (
            <li
              className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2"
              key={id}
            >
              <ReorderButtons
                canMoveDown={index < order.length - 1}
                canMoveUp={index > 0}
                label={HOMEPAGE_SECTION_LABELS[sectionId]}
                onMoveDown={() => moveDown(id)}
                onMoveUp={() => moveUp(id)}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{HOMEPAGE_SECTION_LABELS[sectionId]}</p>
                <p className="text-xs text-muted-foreground">
                  {index + 1} of {order.length}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </SettingsSection>
  );
}
