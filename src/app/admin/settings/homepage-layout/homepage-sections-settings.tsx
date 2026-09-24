"use client";

import { ReorderButtons, useReorderableIds } from "@/components/sortable-rows";
import { reorderHomepageSections } from "@/server/actions";
import {
  HOMEPAGE_SECTION_LABELS,
  type HomepageSectionId,
} from "@/lib/homepage-sections";
import { SettingsListHeader } from "../settings-page";
import { DataList, DataListBody, DataListItem, DataListItemMain } from "@/components/data-list";

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
    <div className="flex flex-col gap-3">
      <SettingsListHeader
        description="Use the arrows to move a section up or down. Testimonials and FAQs are skipped on the homepage until they have something in them."
        title="Section order"
      />
      <DataList>
        <DataListItem className="cursor-default items-start hover:bg-transparent">
          <DataListItemMain>
            <DataListBody>
              <p className="font-medium">Hero</p>
              <p className="text-xs text-muted-foreground">
                Site name, tagline and photos. Always first — change the name and tagline under
                Branding, and the photos under Hero photos.
              </p>
            </DataListBody>
          </DataListItemMain>
        </DataListItem>
        {order.map((id, index) => {
          const sectionId = id as HomepageSectionId;
          return (
            <DataListItem className="cursor-default items-center py-1 hover:bg-transparent" key={id}>
              <ReorderButtons
                canMoveDown={index < order.length - 1}
                canMoveUp={index > 0}
                label={HOMEPAGE_SECTION_LABELS[sectionId]}
                onMoveDown={() => moveDown(id)}
                onMoveUp={() => moveUp(id)}
              />
              <DataListItemMain>
                <DataListBody>
                  <p className="font-medium">{HOMEPAGE_SECTION_LABELS[sectionId]}</p>
                  <p className="text-xs text-muted-foreground">
                    {index + 1} of {order.length}
                  </p>
                </DataListBody>
              </DataListItemMain>
            </DataListItem>
          );
        })}
      </DataList>
    </div>
  );
}
