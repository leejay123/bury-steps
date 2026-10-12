"use client";

import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

type Item = { index: number; label: string; icon: string | null; destructive: boolean };

const ACTION_BUTTONS = '[data-slot="button"], [data-slot="copy-button"]';

/**
 * One button (Manage, or ⋯) that opens the walk's other actions as a
 * shadcn dropdown list, one per line with its icon, the dangerous ones in
 * red at the bottom.
 *
 * The actions themselves are the walk's normal buttons (Edit, Duplicate,
 * Remove walk…), kept mounted but hidden in a portal outside the menu; each
 * list item just clicks its hidden button. Several of them open a dialog or
 * drawer, and Radix unmounts a menu's whole subtree as it closes — a dialog
 * living inside the menu would vanish the moment it opened (the same fix
 * as MemberRowActionsMenu).
 */
export function WalkManageMenu({
  children,
  iconOnly = false,
  label = "Manage",
}: {
  children: ReactNode;
  /** Just ⋯ (the end of a button group), instead of a labelled button. */
  iconOnly?: boolean;
  label?: ReactNode;
}) {
  const sourceRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  // The hidden buttons go in a portal, so they never sit inside a button
  // group (they'd spoil its rounded ends); portals need the page to exist.
  const mounted = useHydrated();

  function collect() {
    const buttons = Array.from(sourceRef.current?.querySelectorAll<HTMLElement>(ACTION_BUTTONS) ?? []);
    setItems(
      buttons
        .map((el, index) => ({
          index,
          label: (el.textContent ?? "").replace(/\s+/g, " ").trim(),
          icon: el.querySelector("svg")?.outerHTML ?? null,
          destructive: el.dataset.variant === "destructive" || /remove|cancel walk|end walk/i.test(el.textContent ?? ""),
        }))
        .filter((item) => item.label),
    );
  }
  function run(index: number) {
    sourceRef.current?.querySelectorAll<HTMLElement>(ACTION_BUTTONS)[index]?.click();
  }

  const safe = items.filter((item) => !item.destructive);
  const danger = items.filter((item) => item.destructive);
  const row = (item: Item) => (
    <DropdownMenuItem key={item.index} onSelect={() => run(item.index)} variant={item.destructive ? "destructive" : "default"}>
      {item.icon ? <span aria-hidden className="contents" dangerouslySetInnerHTML={{ __html: item.icon }} /> : null}
      {item.label}
    </DropdownMenuItem>
  );

  return (
    <>
      {mounted
        ? createPortal(
            <div hidden ref={sourceRef}>
              {children}
            </div>,
            document.body,
          )
        : null}
      <DropdownMenu modal={false} onOpenChange={(open) => (open ? collect() : undefined)}>
        <DropdownMenuTrigger asChild>
          {iconOnly ? (
            <Button aria-label="More actions" size="sm" variant="outline">
              <MoreHorizontal />
            </Button>
          ) : (
            <Button className="w-full sm:w-auto" size="sm" variant="outline">
              {label}
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          {safe.map(row)}
          {safe.length > 0 && danger.length > 0 ? <DropdownMenuSeparator /> : null}
          {danger.map(row)}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

/**
 * The walk's main buttons as one shadcn button group: Clock in (while it can
 * be used), Copy share link, then ⋯ for everything else. Full width on a
 * phone, the buttons sharing the row.
 */
export function WalkActionsBar({
  className,
  liveCompact,
  share,
  tools,
}: {
  className?: string;
  liveCompact?: ReactNode;
  share?: ReactNode;
  tools?: ReactNode;
}) {
  if (!liveCompact && !share && !tools) return null;
  return (
    <ButtonGroup
      className={cn(
        "w-full sm:w-fit [&>*]:flex-1 sm:[&>*]:flex-none [&>[aria-label='More actions']]:flex-none",
        className,
      )}
    >
      {liveCompact}
      {share}
      {tools ? <WalkManageMenu iconOnly>{tools}</WalkManageMenu> : null}
    </ButtonGroup>
  );
}
