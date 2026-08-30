"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { Search, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/dates";
import type { NoticeCategoryView, NoticeView } from "@/lib/notices";
import { FullWidthDivider } from "@/components/full-width-divider";
import { GridFiller } from "@/components/grid-filler";
import { HeroCopy } from "@/components/hero-copy";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

/**
 * Notices index — Efferd blogs-2 edge look: hairline grid (`gap-px bg-border`),
 * full-width dividers, bordered cells with title / category · date / teaser.
 * No cover images.
 */
export function NoticesBlogSection({
  categories,
  notices,
  signedIn,
}: {
  categories: NoticeCategoryView[];
  notices: NoticeView[];
  signedIn: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const filters = useMemo(() => {
    const used = categories.filter((category) =>
      notices.some((notice) => notice.categoryId === category.id),
    );
    return [{ id: "all", label: "All" }, ...used];
  }, [categories, notices]);

  const filtered = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();
    return notices.filter((notice) => {
      const matchesCategory =
        activeCategory === "all" || notice.categoryId === activeCategory;
      const hay = `${notice.title} ${notice.body} ${notice.pageBody ?? ""} ${notice.categoryLabel ?? ""}`.toLowerCase();
      const matchesSearch = query.length === 0 || hay.includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, deferredSearchTerm, notices]);

  function selectCategory(id: string, button: HTMLButtonElement) {
    setActiveCategory(id);
    button.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  return (
    <section className="flex flex-col">
      <div className="relative">
        <HeroCopy
          after={
            <InputGroup className="w-full max-w-md text-left">
              <InputGroupInput
                aria-label="Search notices"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search notices…"
                value={searchTerm}
              />
              <InputGroupAddon>
                <Search data-icon="inline-start" />
              </InputGroupAddon>
            </InputGroup>
          }
          eyebrow={null}
          title="Notices"
          titleAs="h1"
        >
          <p>
            {signedIn
              ? "Updates from the organisers. Short messages stay in the bell; open a card for the full write-up. Public announcements are open to everyone."
              : "Public announcements from the group. Sign in to see member-only notices and the bell."}
          </p>
        </HeroCopy>
        <FullWidthDivider position="bottom" />
      </div>

      {filters.length > 1 ? (
        <div className="relative flex gap-2 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] [-ms-overflow-style:none] sm:flex-wrap sm:overflow-visible md:px-6 [&::-webkit-scrollbar]:hidden">
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
          <FullWidthDivider position="bottom" />
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="relative">
          <Empty className="border-0 py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search />
              </EmptyMedia>
              <EmptyTitle>
                {notices.length === 0
                  ? "No full-page notices yet"
                  : "No notices match your search"}
              </EmptyTitle>
            </EmptyHeader>
            {notices.length > 0 ? (
              <EmptyContent>
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setActiveCategory("all");
                  }}
                  variant="outline"
                >
                  <SearchX data-icon="inline-start" />
                  Clear filters
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
          <FullWidthDivider position="top" />
          <FullWidthDivider position="bottom" />
        </div>
      ) : (
        <div className="relative">
          <div className="grid w-full grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((notice) => (
              <NoticeBlogCard
                category={notice.categoryLabel ?? "Notice"}
                date={formatDate(notice.createdAt)}
                description={notice.body}
                href={`/notices/${notice.slug}`}
                key={notice.id}
                title={notice.title}
              />
            ))}
            <GridFiller
              className="bg-background"
              lgColumns={3}
              smColumns={2}
              totalItems={filtered.length}
            />
          </div>
          <FullWidthDivider position="top" />
          <FullWidthDivider position="bottom" />
        </div>
      )}
    </section>
  );
}

function NoticeBlogCard({
  title,
  date,
  description,
  category,
  href,
  className,
}: {
  title: string;
  date: string;
  description: string;
  category: string;
  href: string;
  className?: string;
}) {
  return (
    <Link
      className={cn(
        "group flex h-full w-full flex-col gap-4 bg-background px-6 py-12 text-muted-foreground transition-colors hover:cursor-pointer hover:text-foreground active:bg-accent sm:px-8",
        className,
      )}
      href={href}
    >
      <h2 className="text-xl font-semibold tracking-tight text-foreground group-hover:underline group-hover:underline-offset-4 md:text-2xl">
        {title}
      </h2>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs tracking-wide">
        <span className="font-medium text-foreground">{category}</span>
        <span aria-hidden="true">·</span>
        <time>{date}</time>
      </div>
      <p className="line-clamp-4 text-sm leading-relaxed">{description}</p>
    </Link>
  );
}
