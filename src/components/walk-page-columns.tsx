import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type WalkPageTab = {
  value: string;
  /** One piece of text, e.g. "Attended (5)" — the tab spaces separate pieces apart. */
  label: string;
  content: ReactNode;
};

/**
 * The two-column walk page (Settings → Site wording → Walk page cards →
 * Layout), shared by the members' and organisers' walk pages so both look
 * the same. On a computer: the walk's details and its sections (in tabs) on
 * the left, and a right-hand column — clock-in, share link, organiser
 * buttons — that stays in view while the left side scrolls (position:
 * sticky; a grid item needs align-self: start for that, or it stretches to
 * the row and has nowhere to stick). On phones, one column: details, then
 * the right-hand column's contents, then the tabs.
 */
export function WalkPageColumns({
  aside,
  tabs,
  top,
}: {
  aside: ReactNode;
  tabs: WalkPageTab[];
  top: ReactNode;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:grid-rows-[auto_1fr] xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">{top}</div>
      <aside
        aria-label="This walk"
        className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto lg:overscroll-contain"
      >
        {aside}
      </aside>
      <div className="min-w-0 lg:col-start-1 lg:row-start-2">
        {tabs.length === 1 ? (
          <div className="flex flex-col gap-6">{tabs[0].content}</div>
        ) : tabs.length > 1 ? (
          <Tabs defaultValue={tabs[0].value}>
            <TabsList className="w-full sm:w-fit">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent className="mt-4 flex flex-col gap-6" key={tab.value} value={tab.value}>
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>
        ) : null}
      </div>
    </div>
  );
}
