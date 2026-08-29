import Link from "next/link";
import { CompassIcon, HomeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { PAGE_X_BLEED } from "@/lib/page-x";

export function NotFoundPage() {
  return (
    <div
      className={`-my-6 grid min-h-[calc(100dvh-8.5rem)] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-px bg-border ${PAGE_X_BLEED}`}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <div className="bg-background" key={i}>
          {i === 4 ? (
            <Empty className="h-full">
              <EmptyHeader>
                <EmptyTitle className="font-mono text-8xl font-black">404</EmptyTitle>
                <EmptyDescription className="sm:text-nowrap">
                  The page you’re looking for might have been{" "}
                  <br className="hidden sm:inline" />
                  moved or doesn’t exist.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild>
                    <Link href="/">
                      <HomeIcon data-icon="inline-start" />
                      Go Home
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/dashboard">
                      <CompassIcon data-icon="inline-start" />
                      Explore
                    </Link>
                  </Button>
                </div>
              </EmptyContent>
            </Empty>
          ) : null}
        </div>
      ))}
    </div>
  );
}
