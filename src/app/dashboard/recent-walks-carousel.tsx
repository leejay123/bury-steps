"use client";

import Link from "next/link";
import { formatCompactDateTime } from "@/lib/dates";
import { walkSharePath } from "@/lib/walk-slug";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export type RecentWalkCard = {
  id: string;
  token: string;
  slug: string | null;
  title: string;
  clockedInAt: string;
  clockedOutAt: string | null;
};

export function RecentWalksCarousel({ walks }: { walks: RecentWalkCard[] }) {
  return (
    <Carousel className="w-full" opts={{ align: "start" }}>
      <CarouselContent>
        {walks.map((walk) => (
          <CarouselItem className="basis-full sm:basis-1/2 lg:basis-1/3" key={walk.id}>
            <Link
              className="block h-full rounded-xl border p-4 transition-colors hover:bg-muted/50"
              href={walkSharePath(walk)}
            >
              <p className="font-medium">{walk.title}</p>
              <p className="text-sm text-muted-foreground">
                In {formatCompactDateTime(new Date(walk.clockedInAt))}
                {walk.clockedOutAt
                  ? ` · Out ${formatCompactDateTime(new Date(walk.clockedOutAt))}`
                  : ""}
              </p>
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
      {walks.length > 1 ? (
        <div className="mt-3 flex justify-end gap-2">
          <CarouselPrevious className="static size-8 translate-y-0" />
          <CarouselNext className="static size-8 translate-y-0" />
        </div>
      ) : null}
    </Carousel>
  );
}
