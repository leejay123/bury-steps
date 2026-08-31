"use client";

import { useEffect, useRef, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { FullWidthDivider } from "@/components/full-width-divider";
import { HeroCopy } from "@/components/hero-copy";
import { cn } from "@/lib/utils";

export type HomepageNoticeSlide = {
  id: string;
  title: string;
  body: string;
};

export function HomeMemberNoticesSection({
  notices,
}: {
  notices: HomepageNoticeSlide[];
}) {
  const plugin = useRef(
    Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true }),
  );
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

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
            className="w-full bg-background"
            opts={{ loop: showControls, align: "start" }}
            plugins={showControls ? [plugin.current] : []}
            setApi={setApi}
          >
            <CarouselContent className="-ml-0">
              {notices.map((notice) => (
                <CarouselItem key={notice.id} className="basis-full pl-0 sm:basis-1/2 lg:basis-1/3">
                  <article className="flex h-full flex-col gap-3 bg-background p-6 sm:border-r sm:border-border md:p-8">
                    <h3 className="text-balance text-lg font-medium text-foreground">
                      {notice.title}
                    </h3>
                    <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                      {notice.body}
                    </p>
                  </article>
                </CarouselItem>
              ))}
            </CarouselContent>
            {showControls ? (
              <>
                <CarouselPrevious className="left-3 border-0 bg-background/80 text-foreground shadow-sm hover:bg-background" />
                <CarouselNext className="right-3 border-0 bg-background/80 text-foreground shadow-sm hover:bg-background" />
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {notices.map((notice, index) => (
                    <button
                      aria-label={`Go to notice ${index + 1}`}
                      className={cn(
                        "size-1.5 rounded-full transition-colors",
                        index === current ? "bg-foreground" : "bg-foreground/30",
                      )}
                      key={notice.id}
                      onClick={() => api?.scrollTo(index)}
                      type="button"
                    />
                  ))}
                </div>
              </>
            ) : null}
          </Carousel>
        </div>
      </div>
    </section>
  );
}
