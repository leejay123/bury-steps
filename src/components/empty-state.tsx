import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { FadeIn } from "@/components/motion";

export function EmptyState({
  description,
  icon: Icon = Info,
  title,
}: {
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
      </Empty>
    </FadeIn>
  );
}
