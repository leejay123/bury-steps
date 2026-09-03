"use client";

import { useState } from "react";
import { Mail, MailOpen } from "lucide-react";
import { deleteContactMessage, markContactMessageRead } from "@/server/actions";
import { useNotifyActionState } from "@/hooks/use-action-toast";
import { useControlledDrawerDismissGuard } from "@/hooks/use-controlled-drawer";
import { formatDateTime } from "@/lib/dates";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
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

export type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  createdAt: string;
  read: boolean;
};

function preview(text: string) {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length <= 100 ? oneLine : `${oneLine.slice(0, 100)}…`;
}

function MarkReadButton({ messageId, onDone }: { messageId: string; onDone?: () => void }) {
  const [, action, isPending] = useNotifyActionState(markContactMessageRead, onDone);
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

function RemoveButton({ messageId, onDone }: { messageId: string; onDone?: () => void }) {
  const [, action, isPending] = useNotifyActionState(deleteContactMessage, onDone);
  return (
    <form action={action}>
      <input name="messageId" type="hidden" value={messageId} />
      <Button disabled={isPending} size="xs" type="submit" variant="destructive">
        {isPending ? "Removing…" : "Remove"}
      </Button>
    </form>
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
  if (!message) return null;

  return (
    <Drawer
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      open={open}
      variant="form"
    >
      <DrawerContent className="sm:max-w-lg" onPointerDownOutside={onPointerDownOutside}>
        <DrawerHeader className="text-left">
          <DrawerTitle>{message.name}</DrawerTitle>
          <DrawerDescription>
            {message.email}
            {message.phone ? ` · ${message.phone}` : ""} · {formatDateTime(message.createdAt)}
          </DrawerDescription>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4">
          <p className="text-sm wrap-break-word whitespace-pre-wrap">{message.message}</p>
        </div>
        <DrawerFooter className="flex-row flex-wrap gap-2">
          {!message.read ? (
            <MarkReadButton messageId={message.id} onDone={onClose} />
          ) : null}
          <RemoveButton messageId={message.id} onDone={onClose} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export function ContactMessagesList({ messages }: { messages: ContactMessageRow[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { openSoon, onPointerDownOutside } = useControlledDrawerDismissGuard();
  const active = messages.find((message) => message.id === activeId) ?? null;

  const closeDrawer = () => {
    setActiveId(null);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  if (messages.length === 0) {
    return (
      <EmptyState
        description="Submissions from the public Contact us form will show up here."
        icon={Mail}
        title="No messages yet"
      />
    );
  }

  return (
    <>
      <DataList>
        {messages.map((message) => (
          <DataListItem
            className={dataListItemStackClassName}
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
                  {message.phone ? ` · ${message.phone}` : ""} · {formatDateTime(message.createdAt)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{preview(message.message)}</p>
              </DataListBody>
            </DataListItemMain>
            <DataListActions className={dataListActionsStackClassName}>
              {!message.read ? <MarkReadButton messageId={message.id} /> : null}
              <RemoveButton messageId={message.id} />
            </DataListActions>
          </DataListItem>
        ))}
      </DataList>

      <MessageDrawer
        message={active}
        onClose={closeDrawer}
        onPointerDownOutside={onPointerDownOutside}
        open={activeId !== null}
      />
    </>
  );
}
