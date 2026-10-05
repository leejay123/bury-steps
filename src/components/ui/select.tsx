"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { unlockIdleDocument } from "@/components/overlay-root";

type SelectOption = {
  disabled?: boolean;
  label: React.ReactNode;
  value: string;
};

type SelectContextValue = {
  disabled?: boolean;
  items: SelectOption[];
  open: boolean;
  selected: string;
  select: (value: string) => void;
  setOpen: (open: boolean) => void;
  triggerWidth?: number;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelect() {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("Select components must be used within Select");
  return context;
}

function isSelectItemElement(child: React.ReactElement) {
  return (
    child.type === SelectItem ||
    (typeof child.type === "function" &&
      (child.type as { displayName?: string }).displayName === "SelectItem")
  );
}

function collectSelectItems(node: React.ReactNode): SelectOption[] {
  const items: SelectOption[] = [];
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return;
    if (isSelectItemElement(child)) {
      const props = child.props as { children?: React.ReactNode; disabled?: boolean; value: string };
      items.push({
        disabled: props.disabled,
        label: props.children,
        value: String(props.value),
      });
      return;
    }
    const nested = (child.props as { children?: React.ReactNode }).children;
    if (nested) items.push(...collectSelectItems(nested));
  });
  return items;
}

function Select({
  children,
  defaultValue,
  disabled,
  name,
  onValueChange,
  required,
  value,
}: {
  children: React.ReactNode;
  defaultValue?: string;
  disabled?: boolean;
  name?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  value?: string;
}) {
  const items = collectSelectItems(children);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? "");
  const [open, setOpen] = React.useState(false);
  const [triggerWidth, setTriggerWidth] = React.useState<number>();
  const isControlled = value !== undefined;
  const selected = isControlled ? value : uncontrolled;

  function select(next: string) {
    if (!isControlled) setUncontrolled(next);
    onValueChange?.(next);
    setOpen(false);
  }

  function openChange(next: boolean) {
    if (next) {
      const width = triggerRef.current?.getBoundingClientRect().width;
      if (width) setTriggerWidth(width);
    } else {
      unlockIdleDocument();
    }
    setOpen(next);
  }

  return (
    <SelectContext.Provider
      value={{ disabled, items, open, select, selected, setOpen: openChange, triggerWidth }}
    >
      {name ? <input name={name} required={required} type="hidden" value={selected} /> : null}
      <Popover onOpenChange={openChange} open={open}>
        <SelectTriggerRefContext.Provider value={triggerRef}>{children}</SelectTriggerRefContext.Provider>
      </Popover>
    </SelectContext.Provider>
  );
}

const SelectTriggerRefContext = React.createContext<React.RefObject<HTMLButtonElement | null> | null>(
  null,
);

function SelectTrigger({
  className,
  children,
  onKeyDown,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { disabled, open, setOpen } = useSelect();
  const triggerRef = React.useContext(SelectTriggerRefContext);

  return (
    <PopoverTrigger asChild>
      {/* min-w-0 lets this shrink to w-full instead of being forced wide by
          its own unwrapped text content (a long selected label) — the fix
          inside SelectValue's own truncate only handles that span, not this
          button's own flex-item sizing one level up. */}
      <Button
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn("group min-w-0 w-full justify-between font-normal", className)}
        data-select-trigger=""
        disabled={disabled}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          // Up or down arrow opens the list too, as on a built-in dropdown.
          if (!event.defaultPrevented && !open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        ref={triggerRef}
        role="combobox"
        variant="outline"
        {...props}
        type="button"
      >
        {children}
        <ChevronDownIcon
          className={cn(
            "shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground",
            open && "rotate-180",
          )}
        />
      </Button>
    </PopoverTrigger>
  );
}

function SelectValue({
  className,
  placeholder,
}: {
  className?: string;
  placeholder?: string;
}) {
  const { items, selected } = useSelect();
  const item = items.find((entry) => entry.value === selected);
  // min-w-0 is load-bearing: a flex child's default min-width:auto overrides
  // truncate's overflow-hidden, letting long text (e.g. "Name · email")
  // push past the trigger's edge instead of ellipsis-cutting inside it.
  if (!item) {
    return (
      <span className={cn("min-w-0 truncate text-muted-foreground", className)}>{placeholder}</span>
    );
  }
  return <span className={cn("min-w-0 truncate", className)}>{item.label}</span>;
}

function enabledOptions(list: HTMLElement) {
  return [...list.querySelectorAll<HTMLButtonElement>('[role="option"]:not(:disabled)')];
}

/** Focuses a choice and scrolls the list (never the page) to show it. */
function focusOption(list: HTMLElement, option: HTMLElement) {
  option.focus({ preventScroll: true });
  const options = enabledOptions(list);
  if (option === options[0]) {
    list.scrollTop = 0;
    return;
  }
  if (option === options.at(-1)) {
    list.scrollTop = list.scrollHeight;
    return;
  }
  const listBox = list.getBoundingClientRect();
  const box = option.getBoundingClientRect();
  if (box.top < listBox.top) list.scrollTop -= listBox.top - box.top;
  else if (box.bottom > listBox.bottom) list.scrollTop += box.bottom - listBox.bottom;
}

/**
 * Keyboard use inside the open list, as on a built-in dropdown: up and down
 * arrows move between choices, Home and End jump to the first and last, and
 * typing a letter or two jumps to the choice that starts with them. Enter
 * or Space picks the one that has focus.
 */
function useListKeys() {
  const typed = React.useRef({ text: "", at: 0 });

  return (event: React.KeyboardEvent<HTMLDivElement>) => {
    const options = enabledOptions(event.currentTarget);
    if (options.length === 0) return;
    const current = options.indexOf(document.activeElement as HTMLButtonElement);
    const startingWith = (search: string, from: number) => {
      for (let step = 0; step < options.length; step++) {
        const index = (from + step) % options.length;
        if (options[index].textContent?.trim().toLowerCase().startsWith(search)) return index;
      }
    };
    let next: number | undefined;

    if (event.key === "ArrowDown") next = current < 0 ? 0 : Math.min(current + 1, options.length - 1);
    else if (event.key === "ArrowUp") next = current < 0 ? options.length - 1 : Math.max(current - 1, 0);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    else if (event.key.length === 1 && event.key !== " " && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = event.timeStamp;
      const text = (now - typed.current.at < 700 ? typed.current.text : "") + event.key.toLowerCase();
      typed.current = { text, at: now };
      if (text.length === 1) {
        next = startingWith(text, current + 1);
      } else {
        // Keep matching everything typed ("22" finds 22), and the same
        // letter again with no such choice moves on to the next one
        // starting with it.
        next = startingWith(text, Math.max(current, 0));
        if (next === undefined && [...text].every((char) => char === text[0])) {
          next = startingWith(text[0], current + 1);
        }
      }
      if (next === undefined) return;
    } else {
      return;
    }
    if (event.key.length !== 1) typed.current = { text: "", at: 0 };

    event.preventDefault();
    focusOption(event.currentTarget, options[next]);
  };
}

function SelectContent({
  children,
  className,
  onKeyDown,
  onOpenAutoFocus,
  position: _position = "popper",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  position?: "item-aligned" | "popper";
} & React.ComponentProps<typeof PopoverContent>) {
  const { triggerWidth } = useSelect();
  const listKeys = useListKeys();

  return (
    <PopoverContent
      align="start"
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) listKeys(event);
      }}
      onOpenAutoFocus={(event) => {
        onOpenAutoFocus?.(event);
        if (event.defaultPrevented) return;
        // Start on the current choice, so the arrows move on from it.
        const list = event.currentTarget as HTMLElement;
        const chosen =
          list.querySelector<HTMLButtonElement>('[role="option"][aria-selected="true"]:not(:disabled)') ??
          enabledOptions(list)[0];
        if (!chosen) return;
        event.preventDefault();
        focusOption(list, chosen);
      }}
      className={cn(
        "max-h-72 w-auto overflow-y-auto overscroll-y-contain p-1",
        // Slide-in from shadcn studio's Combobox 13: rises into place instead of zooming.
        "duration-400 data-[side=bottom]:slide-in-from-bottom-10! data-[state=open]:zoom-in-100",
        className,
      )}
      data-select-dropdown=""
      style={{
        minWidth: triggerWidth ? `${triggerWidth}px` : "8rem",
        width: triggerWidth ? `${triggerWidth}px` : undefined,
      }}
      {...props}
    >
      <div className="flex flex-col gap-0.5" role="listbox">
        {children}
      </div>
    </PopoverContent>
  );
}

function SelectItem({
  children,
  className,
  disabled,
  value,
}: {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  value: string;
}) {
  const { select, selected } = useSelect();
  const isSelected = selected === value;

  return (
    <Button
      aria-selected={isSelected}
      className={cn(
        "h-8 w-full justify-between font-normal",
        isSelected && "bg-accent",
        className,
      )}
      disabled={disabled}
      onClick={() => select(value)}
      role="option"
      size="sm"
      type="button"
      variant="ghost"
    >
      <span className="truncate">{children}</span>
      {isSelected ? <CheckIcon className="shrink-0 text-primary" /> : null}
    </Button>
  );
}

SelectItem.displayName = "SelectItem";

function SelectGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1", className)} role="group" {...props} />;
}

function SelectLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      data-slot="select-label"
      {...props}
    />
  );
}

function SelectSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("bg-border -mx-1 my-1 h-px", className)} data-slot="select-separator" {...props} />;
}

export {
  Select,
  SelectGroup,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
