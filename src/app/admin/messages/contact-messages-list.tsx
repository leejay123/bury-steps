"use client";

import { Mail, MailOpen } from "lucide-react";
import { deleteContactMessage, markContactMessageRead } from "@/server/actions";
import { useNotifyActionState } from "@/hooks/use-action-toast";
import { formatDateTime } from "@/lib/dates";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import {
  DataList,
  DataListActions,
  DataListBody,
  DataListItem,
  DataListItemMain,
} from "@/components/data-list";

export type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  read: boolean;
};

function MarkReadButton({ messageId }: { messageId: string }) {
  const [, action, isPending] = useNotifyActionState(
    markContactMessageRead,
    () => {},
  );
  return (
    <form action={action}>
      <input name="messageId" type="hidden" value={messageId} />
      <Button disabled={isPending} size="xs" type="submit" variant="outline">
        <MailOpen data-icon="inline-start" />
        Mark read
      </Button>
    </form>
  );
}

function RemoveButton({ messageId }: { messageId: string }) {
  const [, action, isPending] = useNotifyActionState(
    deleteContactMessage,
    () => {},
  );
  return (
    <form action={action}>
      <input name="messageId" type="hidden" value={messageId} />
      <Button disabled={isPending} size="xs" type="submit" variant="destructive">
        Remove
      </Button>
    </form>
  );
}

export function ContactMessagesList({ messages }: { messages: ContactMessageRow[] }) {
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
    <DataList>
      {messages.map((message) => (
        <DataListItem className="flex-col items-start gap-3" key={message.id}>
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
                {message.email} · {formatDateTime(message.createdAt)}
              </p>
              <p className="mt-2 text-sm wrap-break-word whitespace-pre-wrap">
                {message.message}
              </p>
            </DataListBody>
          </DataListItemMain>
          <DataListActions className="flex-wrap gap-2">
            {!message.read ? <MarkReadButton messageId={message.id} /> : null}
            <RemoveButton messageId={message.id} />
          </DataListActions>
        </DataListItem>
      ))}
    </DataList>
  );
}
