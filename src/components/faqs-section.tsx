"use client";

import { useMemo, useState } from "react";
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
import { FullWidthDivider } from "@/components/full-width-divider";
import { FACEBOOK_GROUP_URL } from "@/lib/urls";
import { FAQ_CATEGORIES, type FaqView } from "@/lib/faqs";

export function FaqsSection({ faqs }: { faqs: FaqView[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [{ id: "all", label: "All" }, ...FAQ_CATEGORIES];

  const filtered = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return faqs.filter((faq) => {
      const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
      const matchesSearch =
        query.length === 0 ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, faqs, searchTerm]);

  if (faqs.length === 0) return null;

  return (
    <section className="relative">
      <FullWidthDivider position="top" />
      <div className="flex flex-col gap-6 px-4 py-12 md:px-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-balance font-semibold text-3xl tracking-wide md:text-4xl xl:font-bold">
            Frequently asked questions
          </h2>
          <p className="text-muted-foreground text-sm md:text-base lg:text-lg">
            How to join, what to bring, and how clock-in works. If you still have a question, ask
            in the Facebook group.
          </p>
        </div>

        <InputGroup className="max-w-md">
          <InputGroupInput
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search FAQs…"
            value={searchTerm}
          />
          <InputGroupAddon>
            <Search data-icon="inline-start" />
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="flex flex-wrap gap-1 border-y px-4 md:px-8">
        {categories.map((category) => (
          <button
            className="flex flex-col"
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            type="button"
          >
            <span
              className={cn(
                "p-1 text-muted-foreground text-sm hover:text-primary md:p-2 md:text-base",
                activeCategory === category.id && "text-primary",
              )}
            >
              {category.label}
            </span>
            {activeCategory === category.id ? <span className="h-0.5 w-full bg-primary" /> : null}
          </button>
        ))}
      </div>

      <Accordion className="flex flex-col gap-2 border-0 px-4 py-12 lg:px-6" collapsible type="single">
        {filtered.map((faq) => (
          <AccordionItem className="rounded-lg border px-4 shadow-xs" key={faq.id} value={faq.id}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {filtered.length === 0 ? (
        <Empty className="mx-4 mb-12 border md:mx-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Search />
            </EmptyMedia>
            <EmptyTitle>No FAQs found matching your search.</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setSearchTerm("")} variant="outline">
              <SearchX data-icon="inline-start" />
              Clear search
            </Button>
          </EmptyContent>
        </Empty>
      ) : null}

      <p className="px-4 pb-12 text-center text-sm text-muted-foreground md:px-8">
        Can’t find what you’re looking for?{" "}
        <a
          className="font-medium text-foreground underline-offset-4 hover:underline"
          href={FACEBOOK_GROUP_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          Ask in the Facebook group
        </a>
      </p>
      <FullWidthDivider position="bottom" />
    </section>
  );
}
