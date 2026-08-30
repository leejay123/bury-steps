"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/dates";
import type { NoticeCategoryView, NoticeView } from "@/lib/notices";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

/**
 * Member notices index: search + FAQ-style category chips (border-y), then a
 * simple list of full-page notices — no edge/hairline grid.
 */
export function NoticesBlogSection({
  categories,
  notices,
}: {
  categories: NoticeCategoryView[];
  notices: NoticeView[];
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
    <section className="flex flex-col gap-0">
      <div className="flex flex-col gap-3 px-4 py-6 md:px-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Notices</h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          Updates from the organisers for signed-in members. Short messages stay in the bell; open a
          row here for the full write-up.
        </p>
        <InputGroup className="w-full max-w-md">
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

      {filters.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto overscroll-x-contain border-y px-4 [scrollbar-width:none] [-ms-overflow-style:none] sm:flex-wrap sm:overflow-visible md:px-6 [&::-webkit-scrollbar]:hidden">
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

      <div className="px-4 py-6 md:px-6">
        {filtered.length === 0 ? (
          <Empty className="border">
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
          <div className="flex flex-col divide-y rounded-xl border">
            {filtered.map((notice) => (
              <Link
                className="group relative flex flex-col gap-2 p-4 hover:bg-muted/50"
                href={`/notices/${notice.slug}`}
                key={notice.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{notice.title}</p>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {notice.categoryLabel ?? "Notice"} · {formatDate(notice.createdAt)}
                </p>
                <p className="line-clamp-3 text-sm text-muted-foreground">{notice.body}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
