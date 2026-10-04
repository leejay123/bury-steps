import { cn } from "@/lib/utils";

/** The Notices category chips. The same bar is used while the list loads, so a refresh does not wait for it. */
export function NoticeCategoryBar({
  labels,
  active = "all",
  onSelect,
}: {
  labels: { id: string; label: string }[];
  active?: string;
  onSelect?: (id: string, button: HTMLButtonElement) => void;
}) {
  if (labels.length <= 1) return null;
  return (
    <div className="flex gap-2 overflow-x-auto overscroll-x-contain border-y px-4 [scrollbar-width:none] [-ms-overflow-style:none] sm:flex-wrap sm:overflow-visible md:px-6 [&::-webkit-scrollbar]:hidden">
      {labels.map((category) => {
        const pressed = active === category.id;
        return (
          <button
            aria-pressed={pressed}
            className={cn(
              "shrink-0 border-b-2 px-3 py-3 text-intro md:px-4 md:py-3.5",
              pressed
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-primary",
            )}
            key={category.id}
            onClick={onSelect ? (event) => onSelect(category.id, event.currentTarget) : undefined}
            type="button"
          >
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
