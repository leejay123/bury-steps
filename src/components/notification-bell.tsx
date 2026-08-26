"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { markSiteNoticesRead } from "@/server/actions";
import { formatDate } from "@/lib/dates";
import type { NoticeView } from "@/lib/notices";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationBell({
  notices,
  unreadCount,
}: {
  notices: NoticeView[];
  unreadCount: number;
}) {
  const [unread, setUnread] = useState(unreadCount);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setUnread(unreadCount);
  }, [unreadCount]);

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && unread > 0) {
          setUnread(0);
          startTransition(() => {
            void markSiteNoticesRead();
          });
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={unread > 0 ? `${unread} unread notices` : "Notices"}
          className="relative"
          size="icon"
          variant="ghost"
        >
          <Bell />
          {unread > 0 ? (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 py-2">Notices</DropdownMenuLabel>
        </DropdownMenuGroup>
        {notices.length === 0 ? (
          <p className="px-3 pb-3 text-sm text-muted-foreground">Nothing in the bell right now.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notices.map((notice) => (
              <div className="border-t px-3 py-3" key={notice.id}>
                <p className="font-medium text-sm">{notice.title}</p>
                <p className="text-muted-foreground text-xs">{formatDate(notice.createdAt)}</p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground text-sm">{notice.body}</p>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
