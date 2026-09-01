import { useMemo, useState } from "react";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { useResetOnChange } from "@/hooks/use-reset-on-change";

export { LIST_PAGE_SIZE };

export function usePagedList<T>(
  items: T[],
  options?: { pageSize?: number; resetKey?: string },
) {
  const pageSize = options?.pageSize ?? LIST_PAGE_SIZE;
  const resetKey = options?.resetKey ?? "";
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);

  useResetOnChange([resetKey], () => setPage(1));

  useResetOnChange([currentPage, page], () => {
    if (page !== currentPage) setPage(currentPage);
  });

  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [currentPage, items, pageSize]);

  return {
    page: currentPage,
    pageCount,
    pageSize,
    paged,
    setPage,
    total: items.length,
  };
}
