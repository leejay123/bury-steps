import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

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
    <Empty className="w-full min-h-64 border bg-muted/30">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
