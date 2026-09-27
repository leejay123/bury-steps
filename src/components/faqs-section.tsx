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
import { centerInScrollStrip } from "@/lib/scroll-strip";

export function FaqsSection({
  categories,
  facebookGroupUrl = DEFAULT_FACEBOOK_GROUP_URL,
  faqs,
  intro,
  title,
}: {
  categories: FaqCategoryView[];
  facebookGroupUrl?: string;
  faqs: FaqView[];
  intro: string;
  title: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  if (faqs.length === 0) return null;

  const facebookUrl = facebookGroupUrl.trim();

  return (
    <section className="grid gap-8 px-4 py-10 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-12 md:px-6 md:py-14">
      <FaqIntro
        facebookGroupUrl={facebookUrl}
        intro={intro}
        onSearchChange={setSearchTerm}
        searchTerm={searchTerm}
        title={title}
      />
      <div className="flex min-w-0 flex-col gap-4">
        <FaqBrowser
          categories={categories}
          faqs={faqs}
          onClearSearch={() => setSearchTerm("")}
          searchTerm={searchTerm}
        />
      </div>
    </section>
  );
}

const FaqIntro = memo(function FaqIntro({
  facebookGroupUrl,
  intro,
  searchTerm,
  onSearchChange,
  title,
}: {
  facebookGroupUrl: string;
  intro: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  title: string;
}) {
  return (
    <div className="flex flex-col items-start gap-4 md:sticky md:top-24 md:self-start">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h2>
      <p className="text-muted-foreground">
        {intro}{" "}
        {facebookGroupUrl ? (
          <>
            Can’t find what you’re looking for?{" "}
            <a
              className="font-medium text-foreground underline underline-offset-4"
              href={facebookGroupUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Ask in the Facebook group
            </a>{" "}
            or{" "}
            <a className="font-medium text-foreground underline underline-offset-4" href="/contact">
              contact us
            </a>
            .
          </>
        ) : null}
      </p>
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
    </div>
  );
});

function FaqBrowser({
  categories,
  faqs,
  searchTerm,
  onClearSearch,
}: {
  categories: FaqCategoryView[];
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
    centerInScrollStrip(button);
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
        className="flex gap-2 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        {filters.map((category) => {
          const active = activeCategory === category.id;
          return (
            <button
              aria-pressed={active}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:text-foreground",
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

      <Accordion className="flex flex-col overflow-hidden rounded-xl border" collapsible type="single">
        {filtered.map((faq) => (
          <AccordionItem className="border-b bg-background px-4 last:border-b-0" key={faq.id} value={faq.id}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {filtered.length === 0 ? (
        <Empty className="border">
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
    </>
  );
}
