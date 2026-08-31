"use client";

import { memo, useDeferredValue, useMemo, useState } from "react";
import { Search, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { FACEBOOK_GROUP_URL as DEFAULT_FACEBOOK_GROUP_URL } from "@/lib/urls";
import type { FaqCategoryView, FaqView } from "@/lib/faqs";
import { HeroCopy } from "@/components/hero-copy";

export function FaqsSection({
  categories,
  facebookGroupUrl = DEFAULT_FACEBOOK_GROUP_URL,
  faqs,
}: {
  categories: FaqCategoryView[];
  facebookGroupUrl?: string;
  faqs: FaqView[];
}) {
  const [searchTerm, setSearchTerm] = useState("");

  if (faqs.length === 0) return null;

  const facebookUrl = facebookGroupUrl.trim();

  return (
    <section>
      <FaqIntro onSearchChange={setSearchTerm} searchTerm={searchTerm} />
      <FaqBrowser
        categories={categories}
        facebookGroupUrl={facebookUrl}
        faqs={faqs}
        onClearSearch={() => setSearchTerm("")}
        searchTerm={searchTerm}
      />
    </section>
  );
}

const FaqIntro = memo(function FaqIntro({
  searchTerm,
  onSearchChange,
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <HeroCopy
      after={
        <InputGroup className="w-full">
          <InputGroupInput
            aria-label="Search FAQs"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search FAQs…"
            value={searchTerm}
          />
          <InputGroupAddon>
            <Search data-icon="inline-start" />
          </InputGroupAddon>
        </InputGroup>
      }
      eyebrow={null}
      title="Frequently asked questions"
      titleAs="h2"
    >
      <p>
        How to join, what to bring, and how clock-in works. If you still have a question, ask in the
        Facebook group.
      </p>
    </HeroCopy>
  );
});

function FaqBrowser({
  categories,
  facebookGroupUrl,
  faqs,
  searchTerm,
  onClearSearch,
}: {
  categories: FaqCategoryView[];
  facebookGroupUrl: string;
  faqs: FaqView[];
  searchTerm: string;
  onClearSearch: () => void;
}) {
  const [activeCategory, setActiveCategory] = useState("all");
  // Filtering re-renders every AccordionItem (up to MAX_HOMEPAGE_FAQS of
  // them). Deferring it keeps each keystroke in the search box itself
  // (which FaqIntro renders immediately, above) responsive, letting React
  // drop the list re-render to a lower priority instead of doing it
  // synchronously on every keystroke.
  const deferredSearchTerm = useDeferredValue(searchTerm);

  function selectCategory(id: string, button: HTMLButtonElement) {
    setActiveCategory(id);
    button.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  const filters = useMemo(() => {
    const used = categories.filter((category) =>
      faqs.some((faq) => faq.categoryId === category.id),
    );
    return [{ id: "all", label: "All" }, ...used];
  }, [categories, faqs]);

  const filtered = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();
    return faqs.filter((faq) => {
      const matchesCategory = activeCategory === "all" || faq.categoryId === activeCategory;
      const matchesSearch =
        query.length === 0 ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, faqs, deferredSearchTerm]);

  return (
    <>
      <div
        className="flex gap-2 overflow-x-auto overscroll-x-contain border-y px-4 [scrollbar-width:none] [-ms-overflow-style:none] sm:flex-wrap sm:overflow-visible md:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {filters.map((category) => {
          const active = activeCategory === category.id;
          return (
            <button
              aria-pressed={active}
              className={cn(
                "shrink-0 border-b-2 px-3 py-3 text-base md:px-4 md:py-3.5 md:text-lg",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-primary",
              )}
              key={category.id}
              onClick={(event) => selectCategory(category.id, event.currentTarget)}
              type="button"
            >
              {category.label}
            </button>
          );
        })}
      </div>

      <Accordion className="flex flex-col gap-2 border-0 px-4 pt-6 pb-0 md:px-6" collapsible type="single">
        {filtered.map((faq) => (
          <AccordionItem className="rounded-lg border last:border-b px-4 shadow-xs" key={faq.id} value={faq.id}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {filtered.length === 0 ? (
        <Empty className="mx-4 mb-6 border md:mx-6">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyTitle>No FAQs found matching your search.</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={onClearSearch} variant="outline">
              <SearchX data-icon="inline-start" />
              Clear search
            </Button>
          </EmptyContent>
        </Empty>
      ) : null}

      {facebookGroupUrl ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground md:px-6">
          Can’t find what you’re looking for?{" "}
          <a
            className="font-medium text-foreground underline-offset-4 hover:underline"
            href={facebookGroupUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Ask in the Facebook group
          </a>
        </p>
      ) : null}
    </>
  );
}
