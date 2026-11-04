import type { ReactNode, Ref } from "react";
import { Search } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

/**
 * Edge-to-edge search strips (design D, first on History): the search box loses its own
 * border and fills the strip; each filter after it is split off by one line. Focus shows as
 * an inset ring, as the strip has no box to colour.
 */
export const EDGE_SEARCH =
  "h-13 min-w-0 flex-1 rounded-none border-0 shadow-none hover:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-inset has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50";

/** A filter (Select trigger or button) after the search: full height, split off by a line. */
export const EDGE_FILTER =
  // ! so a Button's own corners, border and shadow (the cn-button styles) give way too.
  "h-13! shrink-0 rounded-none! border-0! border-l! bg-transparent px-3 font-medium shadow-none! focus-visible:ring-inset";

/** The strip. Pass data-edge-top through when it sits right under the page top. */
export function EdgeBar({ children, className, edgeTop }: { children: ReactNode; className?: string; edgeTop?: boolean }) {
  return (
    <div
      className={cn("flex flex-wrap items-stretch", className)}
      data-edge-bar=""
      data-edge-flush=""
      data-edge-top={edgeTop ? "" : undefined}
    >
      {children}
    </div>
  );
}

/** The search, filling the strip. Controlled (value/onChange) or a placeholder's read-only copy. */
export function EdgeSearch({
  label,
  placeholder,
  value,
  onChange,
  inputRef,
  readOnly,
  stack,
  type,
}: {
  label: string;
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
  inputRef?: Ref<HTMLInputElement>;
  readOnly?: boolean;
  /** Filters drop to their own row on phones (EdgeFilters stack): the search takes the whole row. */
  stack?: boolean;
  type?: string;
}) {
  return (
    <InputGroup className={cn(EDGE_SEARCH, stack && "max-sm:basis-full")}>
      <InputGroupInput
        aria-label={label}
        className="text-[0.9375rem]"
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        placeholder={placeholder}
        readOnly={readOnly}
        ref={inputRef}
        type={type}
        {...(readOnly ? { defaultValue: "" } : { value })}
      />
      <InputGroupAddon className="pl-3">
        <Search data-icon="inline-start" />
      </InputGroupAddon>
    </InputGroup>
  );
}

/**
 * The filters after the search. stack: on phones they take a row of their own under the
 * search (a line between), sharing it equally; without, they stay beside it (one filter).
 */
export function EdgeFilters({ children, stack }: { children: ReactNode; stack?: boolean }) {
  return (
    <div
      className={cn(
        "flex shrink-0",
        stack && "max-sm:w-full max-sm:border-t max-sm:*:flex-1 max-sm:*:justify-center! max-sm:**:data-[slot=select-value]:flex-none max-sm:[&>*:first-child]:border-l-0!",
      )}
    >
      {children}
    </div>
  );
}
