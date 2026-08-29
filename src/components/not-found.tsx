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
import { FullWidthDivider } from "@/components/full-width-divider";

export function NotFoundPage() {
  return (
    <div className="relative flex min-h-[50vh] w-full flex-col items-center justify-center py-12">
      <FullWidthDivider position="top" />
      <Empty>
        <EmptyHeader>
          <EmptyTitle className="font-mono text-8xl font-black">404</EmptyTitle>
          <EmptyDescription>
            That page is not here. The link may be wrong, or it may have been removed.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/">
                <HomeIcon data-icon="inline-start" />
                Home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <CompassIcon data-icon="inline-start" />
                Walks
              </Link>
            </Button>
          </div>
        </EmptyContent>
      </Empty>
      <FullWidthDivider position="bottom" />
    </div>
  );
}
