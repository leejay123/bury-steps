import type { Metadata } from "next";
import Link from "next/link";
import { FootprintsIcon, HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { GridMessageFrame } from "@/components/not-found";

export const metadata: Metadata = {
  title: "You're offline",
  robots: { index: false, follow: false },
};

/**
 * Shown by the service worker when a page can't be loaded and isn't saved on
 * the phone. Laid out like the Not found page (the same grid frame, big
 * heading and buttons). No prefetching: there's no signal to fetch with.
 */
export default function OfflinePage() {
  return (
    <GridMessageFrame>
      <Empty className="h-full">
        <EmptyHeader>
          <h1 className="font-mono text-6xl font-black tracking-tight sm:text-8xl" data-slot="empty-title">
            Offline<span className="sr-only"> — you&apos;re offline</span>
          </h1>
          <EmptyDescription className="sm:text-nowrap">
            A walk you already opened should still be here.{" "}
            <br className="hidden sm:inline" />
            Anything new will load again once you have a signal.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/walks" prefetch={false}>
                <FootprintsIcon data-icon="inline-start" />
                Try Walks again
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/" prefetch={false}>
                <HomeIcon data-icon="inline-start" />
                Go Home
              </Link>
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </GridMessageFrame>
  );
}
