"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useAnyOverlayOpen } from "@/components/overlay-root";
import { FullWidthDivider } from "@/components/full-width-divider";
import { HeroCopy } from "@/components/hero-copy";
import { noticeDateLabel } from "@/lib/notices";
import { openMemberNoticeBell } from "@/lib/member-notices-bridge";
import { cn } from "@/lib/utils";

export type HomepageNoticeSlide = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  kind: "BELL" | "PAGE";
  slug: string | null;
};

const carouselControlClassName =
  "left-3 border-0 bg-background/80 text-foreground shadow-sm hover:bg-background opacity-100 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/carousel:opacity-100 [@media(hover:hover)]:group-focus-within/carousel:opacity-100 focus-visible:opacity-100";

const noticeCardClassName =
  "flex h-44 w-full flex-col gap-3 bg-background p-6 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-48 sm:border-r sm:border-border md:p-8";

function NoticeCarouselCard({ notice }: { notice: HomepageNoticeSlide }) {
  const content = (
    <>
      <div className="flex shrink-0 flex-col gap-1">
        <h3 className="line-clamp-1 text-balance text-lg font-medium text-foreground">
          {notice.title}
        </h3>
        <time className="text-xs text-muted-foreground" dateTime={notice.updatedAt}>
          {noticeDateLabel(notice)}
        </time>
      </div>
      <p className="line-clamp-2 min-h-10 text-sm leading-relaxed text-muted-foreground">
        {notice.body}
      </p>
    </>
  );

  if (notice.kind === "PAGE" && notice.slug) {
    return (
      <Link className={noticeCardClassName} href={`/notices/${notice.slug}`}>
        {content}
      </Link>
    );
  }

  return (
    <button
      className={noticeCardClassName}
      onClick={() => openMemberNoticeBell(notice.id)}
      type="button"
    >
      {content}
    </button>
  );
}

export function HomeMemberNoticesSection({
  notices,
}: {
  notices: HomepageNoticeSlide[];
}) {
  const [plugin] = useState(() =>
    Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true }),
  );
  const [api, setApi] = useState<CarouselApi>();
  const showControls = notices.length > 1;

  // Otherwise this keeps scrolling behind an open Drawer/Dialog — its own
  // transform animation competing with the overlay's for the same frame
  // budget is what made a homepage drawer feel laggy specifically on
  // Safari. See useAnyOverlayOpen's own doc comment.
  //
  // Guarded on `api`, not just `showControls`: Embla's actual instance
  // (and so the Autoplay plugin's own init(), which is what makes
  // play()/stop() safe to call at all) is only created in an effect of
  // its own, one render after the ref callback that measures the
  // viewport — genuinely later than this component's first mount, not
  // just "the same tick". `api` only becomes non-null once that's
  // actually happened, so it's the real readiness signal — `showControls`
  // alone let this fire before Embla had finished initializing and threw
  // (this crashed the homepage for signed-in members specifically: this
  // carousel only renders once there's at least one member notice).
  const overlayOpen = useAnyOverlayOpen();
  useEffect(() => {
    if (!showControls || !api) return;
    if (overlayOpen) plugin.stop();
    else plugin.play();
  }, [overlayOpen, plugin, showControls, api]);

  if (notices.length === 0) return null;

  return (
    <section>
      <HeroCopy eyebrow={null} title="Latest notices" titleAs="h2">
        <p>
          Updates for members — tap a card to read more, or open the bell for everything.
        </p>
      </HeroCopy>
      <div className="relative">
        <FullWidthDivider position="top" />
        <div className="grid w-full grid-cols-1 gap-px bg-border">
          <Carousel
            className={cn("group/carousel w-full bg-background", showControls && "pb-px")}
            opts={{ loop: showControls, align: "start" }}
            plugins={showControls ? [plugin] : []}
            setApi={setApi}
          >
            <CarouselContent className="-ml-0 items-stretch">
              {notices.map((notice) => (
                <CarouselItem
                  key={notice.id}
                  className="flex basis-full pl-0 sm:basis-1/2 lg:basis-1/3"
                >
                  <NoticeCarouselCard notice={notice} />
                </CarouselItem>
              ))}
            </CarouselContent>
            {showControls ? (
              <>
                <CarouselPrevious className={carouselControlClassName} />
                <CarouselNext
                  className={cn(
                    carouselControlClassName,
                    "left-auto right-3",
                  )}
                />
              </>
            ) : null}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
