"use client";

/**
 * shadcn.io's Select (shadcn.io/ui/select: Base UI), as theirs: the list opens with the
 * chosen option over its button. Kept on our old API so every page's dropdown moved over
 * unchanged: `value` / `defaultValue` / `onValueChange` take strings ("" = nothing chosen),
 * `name` posts with a form, and SelectValue shows the chosen item's label (the items are
 * read from the SelectItems, as before).
 */
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

type SelectOption = { label: React.ReactNode; value: string };

function isSelectItemElement(child: React.ReactElement) {
  return child.type === SelectItem;
}

function collectSelectItems(node: React.ReactNode): SelectOption[] {
  const items: SelectOption[] = [];
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return;
    if (isSelectItemElement(child)) {
      const props = child.props as { children?: React.ReactNode; value: string };
      items.push({ label: props.children, value: String(props.value) });
      return;
    }
    const nested = (child.props as { children?: React.ReactNode }).children;
    if (nested) items.push(...collectSelectItems(nested));
  });
  return items;
}

const empty = (value: string | undefined) => (value === undefined ? undefined : value === "" ? null : value);

export function Select({
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
  return (
    <SelectPrimitive.Root
      defaultValue={empty(defaultValue)}
      disabled={disabled}
      items={items}
      // The page keeps scrolling with a list open (as before), instead of being locked.
      modal={false}
      name={name}
      onValueChange={(next) => onValueChange?.(next == null ? "" : String(next))}
      required={required}
      value={empty(value)}
    >
      {children}
    </SelectPrimitive.Root>
  );
}

export const SelectGroup = (props: SelectPrimitive.Group.Props) => {
  const { className, ...rest } = props;

  return (
    <SelectPrimitive.Group
      className={cn("scroll-my-1 p-1", className)}
      data-slot="select-group"
      {...rest}
    />
  );
};

export const SelectValue = (props: SelectPrimitive.Value.Props) => {
  const { className, ...rest } = props;

  return (
    <SelectPrimitive.Value
      className={cn("flex flex-1 text-start min-w-0 truncate", className)}
      data-slot="select-value"
      {...rest}
    />
  );
};

export const SelectTrigger = (
  props: SelectPrimitive.Trigger.Props & {
    size?: "sm" | "default";
  }
) => {
  const { className, size = "default", children, ...rest } = props;

  return (
    <SelectPrimitive.Trigger
      className={cn(
        "border-input data-placeholder:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 gap-1.5 rounded-lg border bg-transparent py-2 pe-2 ps-2.5 text-sm transition-colors select-none focus-visible:ring-3 aria-invalid:ring-3 data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:gap-1.5 [&_svg:not([class*='size-'])]:size-4 flex w-fit items-center justify-between whitespace-nowrap outline-none disabled:cursor-not-allowed disabled:opacity-50 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
        // Ours: full width of its slot unless the page says otherwise (as the old dropdown),
        // and the height of the inputs beside it.
        "w-full min-w-0 data-[size=default]:h-9",
        className
      )}
      data-size={size}
      data-slot="select-trigger"
      {...rest}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon
            aria-hidden="true"
            className="text-muted-foreground size-4 pointer-events-none"
          />
        }
      />
    </SelectPrimitive.Trigger>
  );
};

export const SelectContent = (
  props: SelectPrimitive.Popup.Props &
    Pick<
      SelectPrimitive.Positioner.Props,
      "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
    >
) => {
  const {
    className,
    children,
    side = "bottom",
    sideOffset = 4,
    align = "center",
    alignOffset = 0,
    alignItemWithTrigger = true,
    ...rest
  } = props;

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        align={align}
        alignItemWithTrigger={alignItemWithTrigger}
        alignOffset={alignOffset}
        // Above drawers and dialogs (z-[60]) when opened inside one.
        className="isolate z-[100]"
        side={side}
        sideOffset={sideOffset}
      >
        <SelectPrimitive.Popup
          className={cn(
            "bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 min-w-36 rounded-lg shadow-md ring-1 duration-100 data-[side=inline-start]:slide-in-from-end-2 data-[side=inline-end]:slide-in-from-start-2 cn-menu-target cn-menu-translucent relative isolate z-50 max-h-(--available-height) w-(--anchor-width) origin-(--transform-origin) overflow-y-auto overflow-x-hidden data-[align-trigger=true]:animate-none",
            className
          )}
          data-align-trigger={alignItemWithTrigger}
          data-slot="select-content"
          {...rest}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
};

export const SelectLabel = (props: SelectPrimitive.GroupLabel.Props) => {
  const { className, ...rest } = props;

  return (
    <SelectPrimitive.GroupLabel
      className={cn("text-muted-foreground px-1.5 py-1 text-xs", className)}
      data-slot="select-label"
      {...rest}
    />
  );
};

export function SelectItem(props: SelectPrimitive.Item.Props) {
  const { className, children, ...rest } = props;

  return (
    <SelectPrimitive.Item
      className={cn(
        "focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground not-data-[variant=destructive]:hover:**:text-accent-foreground not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground gap-1.5 rounded-md py-1 pe-8 ps-1.5 text-sm [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2 relative flex w-full cursor-default select-none items-center outline-hidden data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      data-slot="select-item"
      {...rest}
    >
      <SelectPrimitive.ItemText className="flex flex-1 gap-2 shrink-0 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={<span className="pointer-events-none absolute end-2 flex size-4 items-center justify-center" />}
      >
        <CheckIcon
          aria-hidden="true"
          className="cn-select-item-indicator-icon pointer-events-none"
        />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export const SelectSeparator = (props: SelectPrimitive.Separator.Props) => {
  const { className, ...rest } = props;

  return (
    <SelectPrimitive.Separator
      className={cn("bg-border -mx-1 my-1 h-px pointer-events-none", className)}
      data-slot="select-separator"
      {...rest}
    />
  );
};

export const SelectScrollUpButton = (
  props: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>
) => {
  const { className, ...rest } = props;

  return (
    <SelectPrimitive.ScrollUpArrow
      className={cn("bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4 top-0 w-full", className)}
      data-slot="select-scroll-up-button"
      {...rest}
    >
      <ChevronUpIcon aria-hidden="true" />
    </SelectPrimitive.ScrollUpArrow>
  );
};

export const SelectScrollDownButton = (
  props: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>
) => {
  const { className, ...rest } = props;

  return (
    <SelectPrimitive.ScrollDownArrow
      className={cn("bg-popover z-10 flex cursor-default items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-4 bottom-0 w-full", className)}
      data-slot="select-scroll-down-button"
      {...rest}
    >
      <ChevronDownIcon aria-hidden="true" />
    </SelectPrimitive.ScrollDownArrow>
  );
};
