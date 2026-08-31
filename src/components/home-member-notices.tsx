"use client";

import { useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { FullWidthDivider } from "@/components/full-width-divider";
import { HeroCopy } from "@/components/hero-copy";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

export type HomepageNoticeSlide = {
  id: string;
  title: string;
  body: string;
  updatedAt: string;
};

const carouselControlClassName =
  "left-3 border-0 bg-background/80 text-foreground shadow-sm hover:bg-background opacity-100 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/carousel:opacity-100 [@media(hover:hover)]:group-focus-within/carousel:opacity-100 focus-visible:opacity-100";

export function HomeMemberNoticesSection({
  notices,
}: {
  notices: HomepageNoticeSlide[];
}) {
  const plugin = useRef(
    Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true }),
  );

  if (notices.length === 0) return null;

  const showControls = notices.length > 1;

  return (
    <section>
      <HeroCopy eyebrow={null} title="Latest notices" titleAs="h2">
        <p>Updates for members — open the bell anytime for the full list.</p>
      </HeroCopy>
      <div className="relative">
        <FullWidthDivider position="top" />
        <div className="grid w-full grid-cols-1 gap-px bg-border">
          <Carousel
            className={cn("group/carousel w-full bg-background", showControls && "pb-px")}
            opts={{ loop: showControls, align: "start" }}
            plugins={showControls ? [plugin.current] : []}
          >
            <CarouselContent className="-ml-0 items-stretch">
              {notices.map((notice) => (
                <CarouselItem
                  key={notice.id}
                  className="flex basis-full pl-0 sm:basis-1/2 lg:basis-1/3"
                >
                  <article className="flex min-h-52 w-full flex-col gap-3 bg-background p-6 sm:min-h-56 sm:border-r sm:border-border md:p-8">
                    <div className="flex flex-col gap-1">
                      <h3 className="line-clamp-2 text-balance text-lg font-medium text-foreground">
                        {notice.title}
                      </h3>
                      <time
                        className="text-xs text-muted-foreground"
                        dateTime={notice.updatedAt}
                      >
                        Updated {formatDate(notice.updatedAt)}
                      </time>
                    </div>
                    <p className="line-clamp-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {notice.body}
                    </p>
                  </article>
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
