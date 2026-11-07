import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Info, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FadeIn } from "@/components/motion";

export function EmptyState({
  action,
  description,
  icon: Icon = Info,
  title,
}: {
  /** Under the words: e.g. Clear filters when a search or filter found nothing. */
  action?: ReactNode;
  description: string;
  icon?: LucideIcon;
  title: string;
}) {
  return (
    <FadeIn>
      <Empty className="w-full min-h-64 border bg-muted/30">
        {/* The full width of the box, so the line stays on one line
            wherever it fits (it wrapped at a narrow width before). */}
        <EmptyHeader className="max-w-none">
          <EmptyMedia variant="icon">
            <Icon />
          </EmptyMedia>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
        {action ? <EmptyContent>{action}</EmptyContent> : null}
      </Empty>
    </FadeIn>
  );
}

/** Under a "No matching …" box: clears the search and filters, as on Notices. */
export function ClearFiltersButton({ onClick }: { onClick: () => void }) {
  return (
    <Button onClick={onClick} type="button" variant="outline">
      <SearchX data-icon="inline-start" />
      Clear filters
    </Button>
  );
}
