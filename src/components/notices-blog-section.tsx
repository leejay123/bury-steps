"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useSyncExternalStore, type ReactNode } from "react";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useQueryDefault, useQueryText } from "@/hooks/use-filter-query";
import Link from "next/link";
import { ChevronRight, Search, SearchX } from "lucide-react";
import { noticeDateLabel, noticeUnreadBadgeLabel, type NoticeCategoryView, type NoticeView } from "@/lib/notices";
import { isNoticeReadInThisTab, noticesReadVersion, subscribeNoticesRead } from "@/lib/notice-events";
import { usePagedList } from "@/hooks/use-paged-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ListPagination } from "@/components/list-pagination";
import { centerInScrollStrip } from "@/lib/scroll-strip";
import { NOTICE_CATS_COOKIE, writeClientCookie } from "@/lib/remembered-rows-key";
import { NoticeCategoryBar } from "@/components/notice-category-bar";

/**
 * Member notices index: search + FAQ-style category chips (border-y), then a
 * paginated list of full-page notices — no edge/hairline grid.
 */
export function NoticesBlogSection(props: {
  categories: NoticeCategoryView[];
  notices: NoticeView[];
  unreadIds?: string[];
  action?: ReactNode;
}) {
  return (
    <NuqsAdapter>
      <NoticesBlogSectionInner {...props} />
    </NuqsAdapter>
  );
}

function NoticesBlogSectionInner({
  categories,
  notices,
  unreadIds = [],
  action,
}: {
  categories: NoticeCategoryView[];
  notices: NoticeView[];
  /** Beside the title, like Walks' "Create a walk" (CreateNoticeDrawer). */
  action?: ReactNode;
  /** The member's unread notices (the bell's list). */
  unreadIds?: string[];
}) {
  // Re-renders when a notice is read in this tab — on its own page, or in
  // the bell — even if this page was kept hidden in the meantime.
  useSyncExternalStore(subscribeNoticesRead, noticesReadVersion, () => 0);
  const unread = new Set(unreadIds.filter((id) => !isNoticeReadInThisTab(id)));
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useQueryText("q");
  const [activeCategory, setActiveCategory] = useQueryDefault("cat", "all");
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-3">
            <h1 className="text-lg font-semibold tracking-tight">Notices</h1>
            <p className="text-sm text-muted-foreground">
              Updates from the organisers for signed-in members. Short messages stay in the bell; open a
              row here for the full write-up.
            </p>
          </div>
          {action}
        </div>
        <InputGroup className="w-full max-w-md">
          <InputGroupInput
            aria-label="Search notices"
            ref={searchRef}
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
                    // The button goes with the empty state; keep focus useful.
                    searchRef.current?.focus();
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
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {notice.categoryLabel ?? "Notice"}
                    </p>
                    {unread.has(notice.id) ? (
                      <Badge className="h-5 w-fit px-1.5 text-[10px]" variant="secondary">
                        {noticeUnreadBadgeLabel(notice)}
                      </Badge>
                    ) : null}
                  </div>
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
