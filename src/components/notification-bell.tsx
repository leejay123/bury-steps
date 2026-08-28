"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { markSiteNoticesRead } from "@/server/actions";
import { formatDate } from "@/lib/dates";
import type { NoticeView } from "@/lib/notices";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export function NotificationBell({
  notices,
  unreadIds,
}: {
  notices: NoticeView[];
  unreadIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(unreadIds);
  const [pending, setPending] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setUnread(unreadIds);
  }, [unreadIds]);

  // This bell lives in the root layout, so it survives client-side
  // navigation instead of unmounting like a normal page. Tapping a nav link
  // while the drawer is open dismisses it via Vaul's own outside-pointer
  // handling in the common case, but that isn't guaranteed for every way a
  // route can change (browser back/forward, a link inside the drawer
  // itself, etc). Force it closed on every navigation so it can never sit
  // open — with its modal pointer-events lock still applied — underneath a
  // page the user has already moved on from.
  useEffect(() => {
    setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const unreadCount = unread.length;
  const unreadSet = new Set(unread);

  function markAllRead() {
    if (unreadCount === 0 || pending) return;
    setUnread([]);
    setPending(true);
    void markSiteNoticesRead().finally(() => setPending(false));
  }

  return (
    <Drawer onOpenChange={setOpen} open={open}>
      <DrawerTrigger asChild>
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
      </DrawerTrigger>
      <DrawerContent className="sm:max-w-md">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between gap-2 pr-8">
            <div className="min-w-0">
              <DrawerTitle>Notices</DrawerTitle>
              <DrawerDescription className="sr-only">
                Site notices for signed-in members
              </DrawerDescription>
            </div>
            {unreadCount > 0 ? (
              <Button disabled={pending} onClick={markAllRead} size="xs" variant="ghost">
                Mark all as read
              </Button>
            ) : null}
          </div>
        </DrawerHeader>
        {notices.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Nothing in the bell right now.</p>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {notices.map((notice) => {
              const isUnread = unreadSet.has(notice.id);
              return (
                <div className="border-b px-4 py-3 last:border-0" key={notice.id}>
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
      </DrawerContent>
    </Drawer>
  );
}
