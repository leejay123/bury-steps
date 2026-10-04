"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search, SearchX } from "lucide-react";
import { noticeDateLabel, type NoticeCategoryView, type NoticeView } from "@/lib/notices";
import { usePagedList } from "@/hooks/use-paged-list";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ListPagination } from "@/components/list-pagination";
import { centerInScrollStrip } from "@/lib/scroll-strip";
import { NOTICE_CATS_COOKIE } from "@/lib/remembered-notice-categories";
import { writeClientCookie } from "@/lib/remembered-rows-key";
import { NoticeCategoryBar } from "@/components/notice-category-bar";

/**
 * Member notices index: search + FAQ-style category chips (border-y), then a
 * paginated list of full-page notices — no edge/hairline grid.
 */
export function NoticesBlogSection({
  categories,
  notices,
}: {
  categories: NoticeCategoryView[];
  notices: NoticeView[];
}) {
  const listRef = useRef<HTMLDivElement>(null);
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

  const paging = usePagedList(filtered, {
    resetKey: `${activeCategory}:${deferredSearchTerm.trim().toLowerCase()}`,
  });

  function selectCategory(id: string, button: HTMLButtonElement) {
    setActiveCategory(id);
    centerInScrollStrip(button);
  }

  useEffect(() => {
    const labels = filters.length > 1 ? filters.map((category) => category.label) : [];
    writeClientCookie(NOTICE_CATS_COOKIE, encodeURIComponent(JSON.stringify(labels)));
  }, [filters]);

  return (
    <section className="flex flex-col gap-0">
      <div className="flex flex-col gap-3 px-4 py-6 md:px-6">
        <h1 className="text-lg font-semibold tracking-tight">Notices</h1>
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

      <NoticeCategoryBar active={activeCategory} labels={filters} onSelect={selectCategory} />

      <div className="flex flex-col gap-4 px-4 py-6 md:px-6" ref={listRef}>
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
          <>
            <div className="flex flex-col divide-y rounded-xl border">
              {paging.paged.map((notice) => (
                <Link
                  className="group relative flex flex-col gap-2 p-4 hover:bg-muted/50"
                  data-stagger-item=""
                  href={`/notices/${notice.slug}`}
                  key={notice.id}
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {notice.categoryLabel ?? "Notice"}
                  </p>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{notice.title}</p>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {noticeDateLabel(notice)}
                  </p>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{notice.body}</p>
                </Link>
              ))}
            </div>
            <ListPagination
              noun="notices"
              onPageChange={paging.setPage}
              page={paging.page}
              pageCount={paging.pageCount}
              pageSize={paging.pageSize}
              scrollToRef={listRef}
              total={paging.total}
            />
          </>
        )}
      </div>
    </section>
  );
}
