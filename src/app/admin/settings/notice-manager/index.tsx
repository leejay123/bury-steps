"use client";

import { useRef, useState } from "react";
import { Bell, ChevronRight } from "lucide-react";
import { BELL_NOTICE_LIMIT, isPinnedNotice, isWelcomeNotice, type NoticeCategoryView, type NoticeView } from "@/lib/notices";
import { formatDate } from "@/lib/dates";
import { usePagedList } from "@/hooks/use-paged-list";
import { EmptyState } from "@/components/empty-state";
import { DataList, DataListActions, DataListBody, DataListItem, DataListItemMain, dataListActionsStackClassName, dataListItemStackClassName } from "@/components/data-list";
import { ListPagination } from "@/components/list-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { AddNoticeForm, EditNoticeForm } from "./notice-form";
import { NoticeCategoryManager } from "./notice-category-manager";
import { RemoveNoticeButton } from "./remove-notice-button";
import { WelcomeEnabledToggle } from "./welcome-enabled-toggle";

type DrawerMode = { type: "add" } | { type: "edit"; notice: NoticeView; index: number };

export function SiteNoticeManager({
  categories,
  maxCategories,
  notices,
}: {
  categories: NoticeCategoryView[];
  maxCategories: number;
  notices: NoticeView[];
}) {
  const [mode, setMode] = useState<DrawerMode | null>(null);
  const [isPending, setIsPending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const paging = usePagedList(notices, { resetKey: String(notices.length) });
  const noCategories = categories.length === 0;
  const editingId = mode?.type === "edit" ? mode.notice.id : null;
  const liveIndex = editingId ? notices.findIndex((item) => item.id === editingId) : -1;
  const editing =
    mode?.type === "edit"
      ? {
          notice: notices.find((item) => item.id === mode.notice.id) ?? mode.notice,
          index: liveIndex < 0 ? mode.index : liveIndex,
        }
      : null;

  return (
    <div className="flex flex-col gap-8">
      <NoticeCategoryManager categories={categories} maxCategories={maxCategories} />
      <Separator />
      <div className="flex flex-col gap-4" ref={listRef}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-medium">Notices</h2>
            <p className="text-sm text-muted-foreground">
              Unlimited notices. The member bell shows the welcome (if on) plus the{" "}
              {BELL_NOTICE_LIMIT} newest others. Full-page notices stay on Notices forever.
            </p>
          </div>
          <Button className="w-full sm:w-auto" onClick={() => setMode({ type: "add" })} size="sm">
            Add notice
          </Button>
        </div>
        {noCategories ? (
          <p className="text-sm text-muted-foreground">
            Add a category above before you publish a full-page notice.
          </p>
        ) : null}

        {notices.length === 0 ? (
          <EmptyState
            description="Add one and signed-in members will see it in the bell. Choose Full page for longer write-ups on Notices."
            icon={Bell}
            title="No notices yet"
          />
        ) : (
          <>
            <DataList>
              {paging.paged.map((notice, index) => (
                <DataListItem
                  className={dataListItemStackClassName}
                  key={notice.id}
                  onClick={() =>
                    setMode({
                      type: "edit",
                      notice,
                      index: (paging.page - 1) * paging.pageSize + index,
                    })
                  }
                >
                  <DataListItemMain>
                    <DataListBody>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {isWelcomeNotice(notice) ? (
                            <Badge variant={notice.enabled ? "default" : "secondary"}>
                              Welcome (pinned)
                              {notice.enabled ? "" : " · off"}
                            </Badge>
                          ) : (
                            <Badge variant={notice.kind === "PAGE" ? "default" : "secondary"}>
                              {notice.kind === "PAGE" ? "Full page" : "Bell only"}
                            </Badge>
                          )}
                          {notice.kind === "PAGE" && notice.categoryLabel ? (
                            <Badge variant="outline">{notice.categoryLabel}</Badge>
                          ) : null}
                        </div>
                        <p className="font-medium">{notice.title}</p>
                      </div>
                      <p className="line-clamp-3 text-sm text-muted-foreground wrap-break-word">
                        {notice.body}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Updated {formatDate(notice.updatedAt)}
                        {notice.kind === "PAGE" && notice.slug ? ` · /notices/${notice.slug}` : ""}
                      </p>
                    </DataListBody>
                    <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground sm:mt-0" />
                  </DataListItemMain>
                  <DataListActions className={dataListActionsStackClassName}>
                    {isWelcomeNotice(notice) ? (
                      <WelcomeEnabledToggle notice={notice} />
                    ) : (
                      <RemoveNoticeButton
                        noticeId={notice.id}
                        onRemoved={() =>
                          setMode((current) =>
                            current?.type === "edit" && current.notice.id === notice.id
                              ? null
                              : current,
                          )
                        }
                        title={notice.title}
                      />
                    )}
                  </DataListActions>
                </DataListItem>
              ))}
            </DataList>
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

      <Drawer
        closeDisabled={isPending}
        onOpenChange={(open) => {
          if (!open) setMode(null);
        }}
        open={mode !== null}
        variant="form"
      >
        <DrawerContent className="sm:max-w-md">
          <DrawerHeader>
            <DrawerTitle>{editing ? "Edit notice" : "Add a notice"}</DrawerTitle>
            <DrawerDescription>
              {editing
                ? isPinnedNotice(editing.notice)
                  ? "Edit the welcome title and message. Saving shows it as updated in the bell."
                  : "Change the type, title, or message. Saving it will show as updated in the bell."
                : "Bell only stays in the drawer. Full page also appears on Notices. Notices are for signed-in members only."}
            </DrawerDescription>
          </DrawerHeader>
          {mode?.type === "add" ? (
            <AddNoticeForm
              categories={categories}
              disabled={false}
              onPendingChange={setIsPending}
              onSaved={() => setMode(null)}
            />
          ) : null}
          {editing ? (
            <EditNoticeForm
              categories={categories}
              key={editing.notice.id}
              notice={editing.notice}
              onPendingChange={setIsPending}
              onSaved={() => setMode(null)}
            />
          ) : null}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
