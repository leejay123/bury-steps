"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { FaqCategoryView, FaqView } from "@/lib/faqs";
import { SectionHead, Section } from "./parts";

// shadcn.io's FAQ classes, exactly (used with their permission).
const TABS = "cn-tabs group/tabs flex data-horizontal:flex-col flex-col gap-0 border-t lg:grid lg:grid-cols-4";
const TAB_LIST = "cn-tabs-list group/tabs-list justify-center text-muted-foreground group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col cn-tabs-list-variant-line bg-transparent grid w-full grid-cols-2 items-stretch gap-0 p-0 [clip-path:inset(1px_0_0_1px)] sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-1";
const TAB = "cn-tabs-trigger relative inline-flex flex-1 items-center justify-center whitespace-nowrap focus-visible:border-ring focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent data-active:bg-background dark:data-active:bg-input/30 dark:data-active:text-foreground after:absolute after:bg-foreground after:opacity-0 group-data-horizontal/tabs:after:inset-x-0 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-end-1 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100 transition-none after:transition-none h-auto gap-3 rounded-none border-0 border-border text-start font-normal text-foreground/75 text-sm after:hidden hover:text-foreground data-active:font-medium data-active:text-foreground dark:text-foreground/75 dark:data-active:border-border dark:group-data-[variant=line]/tabs-list:data-active:border-border min-h-12 border-t border-l px-5 py-3 hover:bg-muted/50! data-active:bg-muted/60! lg:ps-12 lg:pe-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset";
const PANEL = "cn-tabs-content flex-1 outline-none focus-visible:outline-3 focus-visible:outline-ring/50 focus-visible:outline-solid focus-visible:-outline-offset-3 min-w-0 [grid-area:1/1] data-inactive:invisible";
const QUESTION = "cn-accordion-trigger group/accordion-trigger relative flex w-full flex-1 justify-between border-transparent outline-none aria-disabled:pointer-events-none aria-disabled:opacity-50 px-5 md:px-12 lg:ps-8 transition-none items-baseline gap-4 rounded-none border-0 py-5 font-normal hover:bg-muted/50 hover:no-underline **:data-[slot=accordion-trigger-icon]:hidden md:gap-6 md:py-6 [counter-increment:faq] before:w-5 before:shrink-0 before:font-mono before:text-muted-foreground before:text-xs before:tabular-nums before:content-[counter(faq,decimal-leading-zero)_/_''] group-aria-expanded/accordion-trigger:before:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset";
const ANSWER = "cn-accordion-content-inner h-(--accordion-panel-height) data-ending-style:h-0 data-starting-style:h-0 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4 px-5 md:px-12 lg:ps-8 pt-0 pb-6 md:pb-7";

/**
 * The FAQs as on shadcn.io: topics down the left (across the top on
 * phones), numbered questions on the right that open with a +.
 */
export function ShadcnFaq({
  categories,
  faqs,
  facebookUrl,
}: {
  categories: FaqCategoryView[];
  faqs: FaqView[];
  facebookUrl: string;
}) {
  const topics = categories.filter((category) => faqs.some((faq) => faq.categoryId === category.id));
  const [active, setActive] = useState(topics[0]?.id ?? "");
  const [open, setOpen] = useState<string | null>(null);
  if (faqs.length === 0) return null;
  return (
    <Section id="home-faq-heading">
      <div className="scroll-mt-(--header-height)" id="faq" />
      <SectionHead
        id="home-faq-heading"
        lead="How to join, what to bring and how clock-in works,"
        rest={
          facebookUrl
            ? "and anything else people ask. Still stuck? Ask in the Facebook group."
            : "and anything else people ask."
        }
        title="Frequently asked questions"
      />
      <div className={TABS} data-orientation="vertical" data-slot="tabs">
        <div className="border-b lg:flex lg:flex-col lg:border-e lg:border-b-0">
          <div aria-label="FAQ categories" aria-orientation="vertical" className={TAB_LIST} data-slot="tabs-list" data-variant="line" role="tablist">
            {topics.map((topic) => (
              <button
                aria-selected={active === topic.id}
                className={TAB}
                data-active={active === topic.id ? "" : undefined}
                data-slot="tabs-trigger"
                key={topic.id}
                onClick={() => setActive(topic.id)}
                role="tab"
                type="button"
              >
                <span className="min-w-0 flex-1 whitespace-normal">{topic.label}</span>
                <span className="font-mono font-normal text-muted-foreground text-xs tabular-nums">
                  {faqs.filter((faq) => faq.categoryId === topic.id).length}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:col-span-3">
          {topics.map((topic) => (
            <div
              className={PANEL}
              data-inactive={active === topic.id ? undefined : ""}
              data-slot="tabs-content"
              hidden={active !== topic.id}
              key={topic.id}
              role="tabpanel"
            >
              <div className="cn-accordion group/accordion flex w-full flex-col [counter-reset:faq]" data-slot="accordion">
                {faqs
                  .filter((faq) => faq.categoryId === topic.id)
                  .map((faq) => {
                    const expanded = open === faq.id;
                    return (
                      <div className="cn-accordion-item [overflow-anchor:none] border-b" data-slot="accordion-item" key={faq.id}>
                        <h3 className="contents">
                          <button
                            aria-expanded={expanded}
                            className={QUESTION}
                            data-slot="accordion-trigger"
                            onClick={() => setOpen(expanded ? null : faq.id)}
                            type="button"
                          >
                            <span className="flex-1 text-pretty font-medium text-base leading-snug tracking-tight md:text-lg">{faq.question}</span>
                            <Plus
                              aria-hidden
                              className="size-4 shrink-0 self-center text-muted-foreground transition-transform duration-200 group-hover/accordion-trigger:text-foreground group-aria-expanded/accordion-trigger:rotate-45 motion-reduce:transition-none"
                            />
                          </button>
                        </h3>
                        <div className="cn-accordion-content overflow-hidden" data-slot="accordion-content" hidden={!expanded} role="region">
                          <div className={ANSWER}>
                            <p className="max-w-3xl whitespace-pre-line text-pretty ps-9 text-muted-foreground text-sm leading-relaxed md:ps-11 md:text-base">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
