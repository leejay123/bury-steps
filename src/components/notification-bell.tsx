"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCheck, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { markSiteNoticeRead, markSiteNoticesRead } from "@/server/actions";
import { NOTICE_READ_EVENT, NOTICES_UNREAD_EVENT, markNoticesReadInThisTab } from "@/lib/notice-events";
import { noticeBodyForBellDrawer, noticeDateLabel, noticeUnreadBadgeLabel, type NoticeView } from "@/lib/notices";
import {
  OPEN_MEMBER_NOTICE_BELL_EVENT,
  type OpenMemberNoticeBellDetail,
} from "@/lib/member-notices-bridge";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { BELL_MAX } from "@/components/header-chrome";
import { UNREAD_COOKIE } from "@/lib/remembered-nav";
import { writeClientCookie } from "@/lib/remembered-rows-key";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NotificationBell as NoticeBellButton } from "@/components/spectrumui/notification-bell";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
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
  const scrollToNoticeIdRef = useRef<string | null>(null);
  // Opened from a Latest notices card: focus goes back to that card on
  // close, not to this bell up in the header.
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();

  useResetOnChange([unreadIds], () => setUnread(unreadIds));

  useResetOnChange([pathname], () => setOpen(false));

  // Read on its own page: drop it from the count here too.
  useEffect(() => {
    function onRead(event: Event) {
      const noticeId = (event as CustomEvent<string>).detail;
      setUnread((current) => (current.includes(noticeId) ? current.filter((id) => id !== noticeId) : current));
    }
    window.addEventListener(NOTICE_READ_EVENT, onRead);
    return () => window.removeEventListener(NOTICE_READ_EVENT, onRead);
  }, []);

  // The Notices dots in the phone menu and bottom bar follow this count, and
  // the next page load draws the badge with it before the notices load.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(NOTICES_UNREAD_EVENT, { detail: unread.length }));
    writeClientCookie(UNREAD_COOKIE, String(Math.min(unread.length, 99)));
  }, [unread.length]);

  useEffect(() => {
    function onOpenFromCarousel(event: Event) {
      const noticeId = (event as CustomEvent<OpenMemberNoticeBellDetail>).detail?.noticeId;
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (noticeId) {
        scrollToNoticeIdRef.current = noticeId;
        setUnread((current) => (current.includes(noticeId) ? current.filter((id) => id !== noticeId) : current));
        markSiteNoticeRead(noticeId)
          .then((result) => {
            if (result.ok) markNoticesReadInThisTab([noticeId]);
            else toast.error(result.error);
          })
          .catch(() => toast.error("Could not mark that notice as read. Try again."));
      }
      setOpen(true);
    }

    window.addEventListener(OPEN_MEMBER_NOTICE_BELL_EVENT, onOpenFromCarousel);
    return () => window.removeEventListener(OPEN_MEMBER_NOTICE_BELL_EVENT, onOpenFromCarousel);
  }, []);

  useEffect(() => {
    if (!open) return;
    const noticeId = scrollToNoticeIdRef.current;
    if (!noticeId) return;
    scrollToNoticeIdRef.current = null;
    window.requestAnimationFrame(() => {
      document
        .getElementById(`notice-bell-item-${noticeId}`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }, [open, notices]);

  const unreadCount = unread.length;
  const unreadSet = new Set(unread);

  function markAllRead() {
    if (unreadCount === 0 || pending) return;
    const previous = unread;
    setUnread([]);
    setPending(true);
    markSiteNoticesRead()
      .then((result) => {
        if (result.ok) {
          markNoticesReadInThisTab(previous);
        } else {
          setUnread(previous);
          toast.error(result.error);
        }
      })
      .catch(() => {
        setUnread(previous);
        toast.error("Could not mark notices as read. Try again.");
      })
      .finally(() => setPending(false));
  }

  function markOneRead(noticeId: string) {
    if (!unreadSet.has(noticeId)) return;
    const previous = unread;
    setUnread((current) => current.filter((id) => id !== noticeId));
    markSiteNoticeRead(noticeId)
      .then((result) => {
        if (result.ok) {
          markNoticesReadInThisTab([noticeId]);
        } else {
          setUnread(previous);
          toast.error(result.error);
        }
      })
      .catch(() => {
        setUnread(previous);
        toast.error("Could not mark that notice as read. Try again.");
      });
  }

  return (
    <Drawer direction="bottom" onOpenChange={setOpen} open={open}>
      <DrawerTrigger asChild>
        <NoticeBellButton
          className="border-transparent bg-transparent shadow-none hover:bg-accent"
          count={unreadCount}
          max={BELL_MAX}
          ringOnMount={unreadCount > 0}
          size="sm"
        />
      </DrawerTrigger>
      <DrawerContent
        finalFocus={() => {
          const card = returnFocusRef.current;
          returnFocusRef.current = null;
          return card?.isConnected ? card : true;
        }}
      >
        {/* mb-0: the header's default bottom margin left a white strip above
            the first notice, visible when it's hovered. */}
        <DrawerHeader className="mb-0 border-b px-5 pb-4 pr-14 pt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <DrawerTitle>Notices</DrawerTitle>
              <DrawerDescription className="sr-only">
                Site notices for signed-in members
              </DrawerDescription>
            </div>
            {unreadCount > 0 ? (
              <Button
                className="shrink-0"
                disabled={pending}
                onClick={markAllRead}
                size="xs"
                variant="ghost"
              >
                <CheckCheck data-icon="inline-start" />
                Mark all as read
              </Button>
            ) : null}
          </div>
        </DrawerHeader>
        {notices.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">Nothing in the bell right now.</p>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            {notices.map((notice) => {
              const isUnread = unreadSet.has(notice.id);
              const href =
                notice.kind === "PAGE" && notice.slug ? `/notices/${notice.slug}` : null;

              const content = (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1.5">
                    {isUnread ? (
                      <Badge className="h-5 w-fit px-1.5 text-[10px]" variant="secondary">
                        {noticeUnreadBadgeLabel(notice)}
                      </Badge>
                    ) : null}
                    <p className="font-medium text-sm">{notice.title}</p>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {noticeDateLabel(notice)}
                  </p>
                  <p className="whitespace-pre-wrap text-muted-foreground text-sm leading-relaxed">
                    {noticeBodyForBellDrawer(notice)}
                  </p>
                  {href ? (
                    <p className="flex items-center gap-1 pt-0.5 text-xs font-medium text-foreground">
                      Read full notice
                      <ChevronRight className="size-3.5" />
                    </p>
                  ) : null}
                </div>
              );

              if (href) {
                return (
                  <Link
                    className="block border-b px-5 py-5 last:border-0 hover:bg-muted/40"
                    href={href}
                    id={`notice-bell-item-${notice.id}`}
                    key={notice.id}
                    onClick={() => markOneRead(notice.id)}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  className="w-full border-b px-5 py-5 text-left last:border-0 hover:bg-muted/40"
                  id={`notice-bell-item-${notice.id}`}
                  key={notice.id}
                  onClick={() => markOneRead(notice.id)}
                  type="button"
                >
                  {content}
                </button>
              );
            })}
          </div>
        )}
        {/* Clear of the iPhone home indicator, like the More sheet. */}
        <DrawerFooter className="border-t px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button asChild className="w-full" size="sm" variant="outline">
            <Link href="/notices" onClick={() => setOpen(false)}>
              Browse all notices
            </Link>
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
