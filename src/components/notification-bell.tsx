"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { markSiteNoticesRead } from "@/server/actions";
import { formatDate } from "@/lib/dates";
import type { NoticeView } from "@/lib/notices";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

export function NotificationBell({
  notices,
  unreadIds,
}: {
  notices: NoticeView[];
  unreadIds: string[];
}) {
  const [unread, setUnread] = useState(unreadIds);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setUnread(unreadIds);
  }, [unreadIds]);

  const unreadCount = unread.length;
  const unreadSet = new Set(unread);

  function markAllRead() {
    if (unreadCount === 0 || pending) return;
    setUnread([]);
    startTransition(() => {
      void markSiteNoticesRead();
    });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label={unreadCount > 0 ? `${unreadCount} unread notices` : "Notices"}
          className="relative"
          size="icon"
          variant="ghost"
        >
          <Bell />
          {unreadCount > 0 ? (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <PopoverHeader className="flex flex-row items-center justify-between gap-2 px-3 py-2">
          <PopoverTitle>Notices</PopoverTitle>
          {unreadCount > 0 ? (
            <Button
              disabled={pending}
              onClick={markAllRead}
              size="xs"
              variant="ghost"
            >
              Mark all as read
            </Button>
          ) : null}
        </PopoverHeader>
        {notices.length === 0 ? (
          <p className="px-3 pb-3 text-sm text-muted-foreground">Nothing in the bell right now.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notices.map((notice) => {
              const isUnread = unreadSet.has(notice.id);
              return (
                <div className="border-t px-3 py-3" key={notice.id}>
                  <div className="flex items-start gap-2">
                    {isUnread ? (
                      <span
                        aria-hidden="true"
                        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-destructive"
                      />
                    ) : (
                      <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{notice.title}</p>
                      <p className="text-muted-foreground text-xs">{formatDate(notice.createdAt)}</p>
                      <p className="mt-1 whitespace-pre-wrap text-muted-foreground text-sm">
                        {notice.body}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
