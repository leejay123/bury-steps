"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { SlideView } from "@/lib/slides";

export function HomeCarousel({
  slides,
  framed = false,
}: {
  slides: SlideView[];
  framed?: boolean;
}) {
  const plugin = React.useRef(
    Autoplay({ delay: 5500, stopOnInteraction: false, stopOnMouseEnter: true }),
  );
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const showControls = slides.length > 1;

  React.useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  if (slides.length === 0) return null;

  return (
    <Carousel
      setApi={setApi}
      opts={{ loop: showControls, align: "start" }}
      plugins={showControls ? [plugin.current] : []}
      className={cn("w-full", framed ? "overflow-hidden" : "overflow-hidden rounded-xl")}
    >
      <CarouselContent className="-ml-0">
        {slides.map((slide) => (
          <CarouselItem key={slide.id} className="pl-0">
            <div className="bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slide.src}
                alt={slide.alt}
                className={cn(
                  "block w-full object-cover",
                  framed ? "aspect-video" : "h-auto object-contain",
                )}
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {showControls && (
        <>
          <CarouselPrevious className="left-3 border-0 bg-background/80 text-foreground shadow-sm hover:bg-background" />
          <CarouselNext className="right-3 border-0 bg-background/80 text-foreground shadow-sm hover:bg-background" />
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Show slide ${index + 1}`}
                className={cn(
                  "size-2 rounded-full transition-colors",
                  current === index ? "bg-background" : "bg-background/50",
                )}
                onClick={() => api?.scrollTo(index)}
              />
            ))}
          </div>
        </>
      )}
    </Carousel>
  );
}
