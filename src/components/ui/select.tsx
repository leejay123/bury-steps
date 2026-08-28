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

  return (
    <SelectContext.Provider
      value={{ disabled, items, open, select, selected, triggerWidth }}
    >
      {name ? <input name={name} required={required} type="hidden" value={selected} /> : null}
      <Popover
        onOpenChange={(next) => {
          if (next) {
            const width = triggerRef.current?.getBoundingClientRect().width;
            if (width) setTriggerWidth(width);
          } else {
            unlockIdleDocument();
          }
          setOpen(next);
        }}
        open={open}
      >
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
  ...props
}: React.ComponentProps<typeof Button>) {
  const { disabled, open } = useSelect();
  const triggerRef = React.useContext(SelectTriggerRefContext);

  return (
    <PopoverTrigger asChild>
      <Button
        aria-expanded={open}
        className={cn("w-full justify-between font-normal", className)}
        data-select-trigger=""
        disabled={disabled}
        ref={triggerRef}
        role="combobox"
        variant="outline"
        {...props}
        type="button"
      >
        {children}
        <ChevronDownIcon className="opacity-50" />
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
  if (!item) {
    return <span className={cn("truncate text-muted-foreground", className)}>{placeholder}</span>;
  }
  return <span className={cn("truncate", className)}>{item.label}</span>;
}

function SelectContent({
  children,
  className,
  position: _position = "popper",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  position?: "item-aligned" | "popper";
} & React.ComponentProps<typeof PopoverContent>) {
  const { triggerWidth } = useSelect();

  return (
    <PopoverContent
      align="start"
      className={cn("max-h-72 w-auto overflow-y-auto overscroll-y-contain p-1", className)}
      data-select-dropdown=""
      style={{
        minWidth: triggerWidth ? `${triggerWidth}px` : "8rem",
        width: triggerWidth ? `${triggerWidth}px` : undefined,
      }}
      {...props}
    >
      <div role="listbox">{children}</div>
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
      className={cn("w-full justify-between font-normal", isSelected && "bg-accent", className)}
      disabled={disabled}
      onClick={() => select(value)}
      role="option"
      type="button"
      variant="ghost"
    >
      <span className="truncate">{children}</span>
      {isSelected ? <CheckIcon /> : null}
    </Button>
  );
}

SelectItem.displayName = "SelectItem";

function SelectGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col", className)} role="group" {...props} />;
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
