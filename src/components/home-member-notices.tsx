"use client";

import { Show } from "@clerk/nextjs";
import { useEffect, useRef, useState, useTransition } from "react";
import Autoplay from "embla-carousel-autoplay";
import Link from "next/link";
import { getHomepageMemberNoticesAction } from "@/server/actions";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NoticeSlide = {
  id: string;
  title: string;
  body: string;
  kind: "BELL" | "PAGE";
  slug: string | null;
};

function MemberNoticesCarouselInner() {
  const [notices, setNotices] = useState<NoticeSlide[] | null>(null);
  const [, startTransition] = useTransition();
  const plugin = useRef(
    Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true }),
  );
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    startTransition(async () => {
      const result = await getHomepageMemberNoticesAction();
      setNotices(result.ok ? result.notices : []);
    });
  }, []);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (!notices || notices.length === 0) return null;

  const showControls = notices.length > 1;

  return (
    <section>
      <HeroCopy eyebrow={null} title="Latest notices" titleAs="h2">
        <p>Updates for members — open the bell anytime for the full list.</p>
      </HeroCopy>
      <div className="relative">
        <div className="grid w-full grid-cols-1 gap-px bg-border">
          <Carousel
            className="w-full bg-background"
            opts={{ loop: showControls, align: "start" }}
            plugins={showControls ? [plugin.current] : []}
            setApi={setApi}
          >
            <CarouselContent className="-ml-0">
              {notices.map((notice) => (
                <CarouselItem key={notice.id} className="pl-0 basis-full sm:basis-1/2 lg:basis-1/3">
                  <article className="flex h-full flex-col gap-3 border-border bg-background p-6 md:p-8 sm:border-r">
                    <h3 className="text-lg font-medium text-foreground text-balance">
                      {notice.title}
                    </h3>
                    <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                      {notice.body}
                    </p>
                    {notice.kind === "PAGE" && notice.slug ? (
                      <Button asChild className="self-start" size="sm" variant="outline">
                        <Link href={`/notices/${notice.slug}`}>Read full notice</Link>
                      </Button>
                    ) : null}
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
        <FullWidthDivider position="bottom" />
      </div>
    </section>
  );
}

/** Signed-in members only. Draws its own bottom hairline when content shows. */
export function HomeMemberNoticesSection({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <Show when="signed-in">
      <MemberNoticesCarouselInner />
    </Show>
  );
}
