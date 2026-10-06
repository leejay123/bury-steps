"use client";

import { DescriptionText } from "@/components/description-text";
import { useEffect, useState } from "react";
import { Mail, MailOpen, Search } from "lucide-react";
import { deleteContactMessage, markContactMessageRead } from "@/server/actions";
import { useNotifyActionState } from "@/hooks/use-action-toast";
import { useControlledDrawerDismissGuard } from "@/hooks/use-controlled-drawer";
import { useRetained } from "@/hooks/use-retained";
import { cn } from "@/lib/utils";
import { formatCompactDateTime } from "@/lib/dates";
import { EmptyState } from "@/components/empty-state";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DataList,
  DataListActions,
  DataListBody,
  DataListItem,
  DataListItemMain,
  dataListActionsStackClassName,
  dataListItemStackClassName,
} from "@/components/data-list";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LIST_PAGE_SIZE } from "@/lib/list-page-size";
import { MESSAGE_LINES_COOKIE, writeClientCookie } from "@/lib/remembered-rows-key";

export type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  createdAt: string;
  read: boolean;
};

type DateRange = "all" | "today" | "7" | "30";

const DATE_RANGE_DAYS: Record<Exclude<DateRange, "all" | "today">, number> = { "7": 7, "30": 30 };

function withinDateRange(createdAt: string, range: DateRange): boolean {
  if (range === "all") return true;
  const created = new Date(createdAt).getTime();
  if (range === "today") {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return created >= startOfToday.getTime();
  }
  return created >= Date.now() - DATE_RANGE_DAYS[range] * 24 * 60 * 60 * 1000;
}

function preview(text: string) {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length <= 100 ? oneLine : `${oneLine.slice(0, 100)}…`;
}

function MarkReadButton({ messageId, onDone }: { messageId: string; onDone?: () => void }) {
  // No inline error box next to this button — the toast is the only place
  // an error shows, so it opts back into toasting errors.
  const [, action, isPending] = useNotifyActionState(markContactMessageRead, onDone, {
    toastErrors: true,
  });
  return (
    <form action={action}>
      <input name="messageId" type="hidden" value={messageId} />
      <Button disabled={isPending} size="xs" type="submit" variant="outline">
        <MailOpen data-icon="inline-start" />
        {isPending ? "Marking…" : "Mark read"}
      </Button>
    </form>
  );
}

function RemoveButton({ from, messageId, onDone }: { from: string; messageId: string; onDone?: () => void }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  // Asks first, like removing a report: a message can't be brought back.
  return (
    <AlertDialog
      onOpenChange={(next) => {
        if (next) setSession((value) => value + 1);
        setOpen(next);
      }}
      open={open}
    >
      <AlertDialogTrigger asChild>
        <Button aria-label={`Remove the message from ${from}`} size="xs" type="button" variant="destructive">
          Remove
        </Button>
      </AlertDialogTrigger>
      {open ? (
        <RemoveMessageDialogForm
          from={from}
          key={session}
          messageId={messageId}
          onClose={() => setOpen(false)}
          onDone={onDone}
        />
      ) : null}
    </AlertDialog>
  );
}

function RemoveMessageDialogForm({
  from,
  messageId,
  onClose,
  onDone,
}: {
  from: string;
  messageId: string;
  onClose: () => void;
  onDone?: () => void;
}) {
  const [state, action, isPending] = useNotifyActionState(deleteContactMessage, () => {
    onClose();
    onDone?.();
  });
  return (
    <AlertDialogContent closeDisabled={isPending}>
      <form action={action}>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this message?</AlertDialogTitle>
          <AlertDialogDescription>
            The message from {from} will be deleted. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <input name="messageId" type="hidden" value={messageId} />
        <FormError message={state && !state.ok ? state.error : null} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} type="button">
            Keep it
          </AlertDialogCancel>
          <Button disabled={isPending} type="submit" variant="destructive">
            {isPending ? "Removing…" : "Remove"}
          </Button>
        </AlertDialogFooter>
      </form>
    </AlertDialogContent>
  );
}

function MessageDrawer({
  message,
  onClose,
  onPointerDownOutside,
  open,
}: {
  message: ContactMessageRow | null;
  onClose: () => void;
  onPointerDownOutside: (event: Event) => void;
  open: boolean;
}) {
  // Stay mounted while closed. Mounting only once a message is chosen skips
  // the slide, because the drawer appears already open.
  const shown = useRetained(message);

  return (
    <Drawer
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      open={open && message !== null}
      variant="form"
    >
      <DrawerContent onPointerDownOutside={onPointerDownOutside}>
        {shown ? (
          <>
            <DrawerHeader className="text-left">
              <DrawerTitle>{shown.name}</DrawerTitle>
              <DrawerDescription>
                <a className="underline-offset-2 hover:underline" href={`mailto:${shown.email}`}>
                  {shown.email}
                </a>
                {shown.phone ? (
                  <>
                    {" · "}
                    <a className="underline-offset-2 hover:underline" href={`tel:${shown.phone.replace(/[^\d+]/g, "")}`}>
                      {shown.phone}
                    </a>
                  </>
                ) : null}
                {" · "}
                {formatCompactDateTime(shown.createdAt)}
              </DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4">
              <DescriptionText className="typeset typeset-docs block wrap-break-word" text={shown.message} />
            </div>
            <DrawerFooter className="flex-row flex-wrap gap-2">
              <Button asChild size="xs" variant="outline">
                <a href={`mailto:${shown.email}?subject=${encodeURIComponent("Your message to Bury Steps")}`}>
                  <Mail data-icon="inline-start" />
                  Reply by email
                </a>
              </Button>
              {!shown.read ? (
                <MarkReadButton messageId={shown.id} onDone={onClose} />
              ) : null}
              <RemoveButton from={shown.name} messageId={shown.id} onDone={onClose} />
            </DrawerFooter>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

/**
 * Everything is fetched once, server-side (see page.tsx, capped at the 200
 * most recent) — filtering here is plain client-side array filtering, no
 * round trip, since there's no pagination to keep in sync with (unlike
 * Members' searchMembers, which pages a much larger, server-sorted set).
 */
export function ContactMessagesList({ messages }: { messages: ContactMessageRow[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const { openSoon, onPointerDownOutside } = useControlledDrawerDismissGuard();
  const active = messages.find((message) => message.id === activeId) ?? null;

  const closeDrawer = () => {
    setActiveId(null);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = messages.filter((message) => {
    if (unreadOnly && message.read) return false;
    if (!withinDateRange(message.createdAt, dateRange)) return false;
    if (!normalizedQuery) return true;
    return (
      message.name.toLowerCase().includes(normalizedQuery) ||
      message.email.toLowerCase().includes(normalizedQuery) ||
      message.message.toLowerCase().includes(normalizedQuery)
    );
  });
  const lineSignature = filtered
    .slice(0, LIST_PAGE_SIZE)
    .map((message) => preview(message.message))
    .join("\n");

  useEffect(() => {
    const lines = lineSignature ? lineSignature.split("\n") : [];
    writeClientCookie(MESSAGE_LINES_COOKIE, encodeURIComponent(JSON.stringify(lines)));
  }, [lineSignature]);

  if (messages.length === 0) {
    return (
      <EmptyState
        description="Submissions from the public Contact us form will show up here."
        icon={Mail}
        title="No messages yet"
      />
    );
  }

  const filtersActive = query !== "" || unreadOnly || dateRange !== "all";

  function clearFilters() {
    setQuery("");
    setUnreadOnly(false);
    setDateRange("all");
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <InputGroup className="w-full min-w-0 sm:min-w-56 sm:flex-1">
          <InputGroupInput
            aria-label="Search messages"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email, or message…"
            value={query}
          />
          <InputGroupAddon>
            <Search data-icon="inline-start" />
          </InputGroupAddon>
        </InputGroup>
        <div className="flex shrink-0 flex-col gap-1.5">
          <Label htmlFor="message-date-range">Date</Label>
          <Select onValueChange={(value) => setDateRange(value as DateRange)} value={dateRange}>
            <SelectTrigger className="w-full sm:w-40" id="message-date-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          aria-pressed={unreadOnly}
          className={cn(
            "shrink-0 gap-1.5",
            unreadOnly &&
              "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200 dark:hover:bg-amber-900",
          )}
          onClick={() => setUnreadOnly((value) => !value)}
          type="button"
          variant="outline"
        >
          <Mail />
          Unread only
        </Button>
        {filtersActive ? (
          <Button className="shrink-0" onClick={clearFilters} size="sm" type="button" variant="ghost">
            Clear filters
          </Button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          description={
            unreadOnly && !query && dateRange === "all"
              ? "Nothing unread right now."
              : "Try a different name, email, word, or date range."
          }
          icon={Search}
          title="No matching messages"
        />
      ) : (
        <DataList>
          {filtered.map((message) => (
            <DataListItem
              className={dataListItemStackClassName}
              data-stagger-item=""
              key={message.id}
              onClick={() => openSoon(() => setActiveId(message.id))}
            >
              <DataListItemMain className="items-start">
                <DataListBody>
                  <p className="font-medium">
                    {message.name}
                    {!message.read ? (
                      <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        New
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {message.email}
                    {message.phone ? ` · ${message.phone}` : ""} · {formatCompactDateTime(message.createdAt)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{preview(message.message)}</p>
                </DataListBody>
              </DataListItemMain>
              <DataListActions className={dataListActionsStackClassName}>
                {!message.read ? <MarkReadButton messageId={message.id} /> : null}
                <RemoveButton from={message.name} messageId={message.id} />
              </DataListActions>
            </DataListItem>
          ))}
        </DataList>
      )}

      <MessageDrawer
        message={active}
        onClose={closeDrawer}
        onPointerDownOutside={onPointerDownOutside}
        open={activeId !== null}
      />
    </>
  );
}
