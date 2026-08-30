"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { Search, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/dates";
import type { NoticeCategoryView, NoticeView } from "@/lib/notices";
import { FullWidthDivider } from "@/components/full-width-divider";
import { GridFiller } from "@/components/grid-filler";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

/**
 * Notices index grid adapted from Efferd blogs-2: bordered card grid with
 * category, date, title, and teaser. No cover images — content only.
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
      <div className="relative px-4 py-8 md:px-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Notices</h1>
          <p className="text-muted-foreground">
            {signedIn
              ? "Updates from the organisers. Short messages stay in the bell; open a card here for the full write-up. Public announcements are open to everyone."
              : "Public announcements from the group. Sign in to see member-only notices and the bell."}
          </p>
          <InputGroup className="mx-auto w-full max-w-md text-left">
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
        </div>
        <FullWidthDivider position="bottom" />
      </div>

      {filters.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto overscroll-x-contain border-b px-4 [scrollbar-width:none] [-ms-overflow-style:none] sm:flex-wrap sm:overflow-visible md:px-6 [&::-webkit-scrollbar]:hidden">
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
      ) : null}

      {filtered.length === 0 ? (
        <Empty className="m-4 border md:m-6">
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
      ) : (
        <div className="relative grid border-b sm:grid-cols-2 lg:grid-cols-3">
          <FullWidthDivider position="top" />
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
            className="border-r border-b bg-background last:border-r-0 sm:border-r"
            lgColumns={3}
            mdColumns={2}
            smColumns={2}
            totalItems={filtered.length}
          />
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
        "group flex w-full flex-col gap-4 border-r border-b bg-background px-6 py-10 text-muted-foreground last:border-r-0 hover:cursor-pointer hover:text-foreground active:bg-accent sm:px-8",
        className,
      )}
      href={href}
    >
      <h2 className="text-xl font-semibold tracking-tight text-foreground group-hover:underline group-hover:underline-offset-4 md:text-2xl">
        {title}
      </h2>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-wide">
        <span className="font-medium text-foreground">{category}</span>
        <span aria-hidden="true">·</span>
        <time>{date}</time>
      </div>
      <p className="line-clamp-4 text-sm leading-relaxed">{description}</p>
    </Link>
  );
}
