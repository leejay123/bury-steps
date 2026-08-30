"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { markSiteNoticeRead, markSiteNoticesRead } from "@/server/actions";
import { formatDate } from "@/lib/dates";
import type { NoticeView } from "@/lib/notices";
import {
  markVisitorNoticeRead,
  markVisitorNoticesRead,
  readVisitorNoticeReads,
} from "@/lib/visitor-notice-reads";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  unreadIds = [],
  viewer,
}: {
  notices: NoticeView[];
  /** Server-known unread ids for signed-in members. Ignored for visitors. */
  unreadIds?: string[];
  viewer: "member" | "visitor";
}) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState<string[]>(viewer === "member" ? unreadIds : []);
  const [pending, setPending] = useState(false);
  const [hydrated, setHydrated] = useState(viewer === "member");
  const [, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (viewer === "member") {
      setUnread(unreadIds);
      return;
    }
    const read = new Set(readVisitorNoticeReads());
    setUnread(notices.filter((notice) => !read.has(notice.id)).map((notice) => notice.id));
    setHydrated(true);
  }, [viewer, unreadIds, notices]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const unreadCount = hydrated ? unread.length : 0;
  const unreadSet = new Set(unread);

  function markAllRead() {
    if (unreadCount === 0 || pending) return;
    const previous = unread;
    const ids = notices.map((notice) => notice.id);
    setUnread([]);
    if (viewer === "visitor") {
      markVisitorNoticesRead(ids);
      return;
    }
    setPending(true);
    markSiteNoticesRead()
      .then((result) => {
        if (!result.ok) {
          setUnread(previous);
          toast.error(result.error);
        } else {
          startTransition(() => router.refresh());
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
    if (viewer === "visitor") {
      markVisitorNoticeRead(noticeId);
      return;
    }
    markSiteNoticeRead(noticeId)
      .then((result) => {
        if (!result.ok) {
          setUnread(previous);
          toast.error(result.error);
        } else {
          startTransition(() => router.refresh());
        }
      })
      .catch(() => {
        setUnread(previous);
        toast.error("Could not mark that notice as read. Try again.");
      });
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
            <span className="pointer-events-none absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white tabular-nums ring-2 ring-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="sm:max-w-md">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between gap-2 pr-8">
            <div className="min-w-0">
              <DrawerTitle>Notices</DrawerTitle>
              <DrawerDescription className="sr-only">
                {viewer === "visitor"
                  ? "Public and visitor notices"
                  : "Site notices for signed-in members"}
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
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            {notices.map((notice) => {
              const isUnread = unreadSet.has(notice.id);
              const href =
                notice.kind === "PAGE" && notice.slug ? `/notices/${notice.slug}` : null;

              const content = (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-sm">{notice.title}</p>
                    {isUnread ? (
                      <Badge className="h-5 px-1.5 text-[10px]" variant="default">
                        New
                      </Badge>
                    ) : null}
                    {href ? (
                      <Badge className="h-5 px-1.5 text-[10px]" variant="secondary">
                        Page
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-xs">{formatDate(notice.createdAt)}</p>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground text-sm">
                    {notice.body}
                  </p>
                  {href ? (
                    <p className="mt-2 flex items-center gap-1 text-xs font-medium text-foreground">
                      Read full notice
                      <ChevronRight className="size-3.5" />
                    </p>
                  ) : null}
                </>
              );

              if (href) {
                return (
                  <Link
                    className="block border-b px-4 py-3 last:border-0 hover:bg-muted/40"
                    href={href}
                    key={notice.id}
                    onClick={() => markOneRead(notice.id)}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  className="w-full border-b px-4 py-3 text-left last:border-0 hover:bg-muted/40"
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
        <DrawerFooter className="border-t">
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
