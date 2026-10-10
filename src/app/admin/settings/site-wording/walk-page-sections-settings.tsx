"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ReorderButtons, useReorderableIds } from "@/components/sortable-rows";
import { DataList, DataListBody, DataListItem, DataListItemMain } from "@/components/data-list";
import { Switch } from "@/components/ui/switch";
import { saveWalkPageSections } from "@/server/actions";
import {
  WALK_PAGE_SECTION_LABELS,
  serializeWalkPageSections,
  type WalkPageSection,
  type WalkPageSectionId,
} from "@/lib/walk-page-sections";
import { SettingsListHeader } from "../settings-page";

/**
 * The order and show/hide of the shared sections on every walk's page
 * (members' and organisers'). Arrows rather than dragging, with each move
 * announced to screen readers — see the research notes in the commit.
 */
export function WalkPageSectionsSettings({
  sections,
  beforeYouSetOffEnabled,
}: {
  sections: WalkPageSection[];
  beforeYouSetOffEnabled: boolean;
}) {
  const [visible, setVisible] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((section) => [section.id, section.visible])),
  );
  // What the arrows save alongside the order; kept in step by setShown.
  const visibleRef = useRef(visible);
  const [announcement, setAnnouncement] = useState("");

  const serialize = (ids: string[], shown: Record<string, boolean>) =>
    serializeWalkPageSections(ids.map((id) => ({ id: id as WalkPageSectionId, visible: shown[id] ?? true })));

  const { order, moveDown, moveUp } = useReorderableIds(
    sections.map((section) => section.id),
    (ids) => saveWalkPageSections(serialize(ids, visibleRef.current)),
  );

  function announceMove(id: string, direction: -1 | 1) {
    const to = order.indexOf(id) + direction;
    if (to < 0 || to >= order.length) return;
    setAnnouncement(`Moved ${WALK_PAGE_SECTION_LABELS[id as WalkPageSectionId]} to position ${to + 1} of ${order.length}.`);
  }

  async function setShown(id: string, shown: boolean) {
    const previous = visible;
    const next = { ...visible, [id]: shown };
    visibleRef.current = next;
    setVisible(next);
    try {
      const result = await saveWalkPageSections(serialize(order, next));
      if (result && !result.ok) throw new Error(result.error);
    } catch (err) {
      visibleRef.current = previous;
      setVisible(previous);
      toast.error(err instanceof Error && err.message ? err.message : "Could not save the walk page layout. Try again.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <SettingsListHeader
        description="The sections under a walk's details, on members' and organisers' walk pages alike. Use the arrows to change the order and the switches to show or hide a section. Before you set off only appears on members' pages, and is turned on or off with its own switch above."
        title="Walk page layout"
      />
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <DataList>
        <DataListItem className="cursor-default items-start hover:bg-transparent">
          <DataListItemMain>
            <DataListBody>
              <p className="font-medium">Walk details</p>
              <p className="text-xs text-muted-foreground">
                Title, date, time, meeting point and description. Always first.
              </p>
            </DataListBody>
          </DataListItemMain>
        </DataListItem>
        {order.map((id, index) => {
          const sectionId = id as WalkPageSectionId;
          const label = WALK_PAGE_SECTION_LABELS[sectionId];
          const isBefore = sectionId === "before";
          return (
            <DataListItem className="cursor-default items-center py-1 hover:bg-transparent" key={id}>
              <ReorderButtons
                canMoveDown={index < order.length - 1}
                canMoveUp={index > 0}
                label={label}
                onMoveDown={() => {
                  announceMove(id, 1);
                  moveDown(id);
                }}
                onMoveUp={() => {
                  announceMove(id, -1);
                  moveUp(id);
                }}
              />
              <DataListItemMain>
                <DataListBody>
                  <p className="font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">
                    {index + 1} of {order.length}
                    {isBefore ? ` · ${beforeYouSetOffEnabled ? "On" : "Off"} — switch above` : ""}
                  </p>
                </DataListBody>
              </DataListItemMain>
              {isBefore ? null : (
                <Switch
                  aria-label={`Show ${label}`}
                  checked={visible[id] ?? true}
                  onCheckedChange={(checked) => void setShown(id, checked)}
                />
              )}
            </DataListItem>
          );
        })}
      </DataList>
    </div>
  );
}
