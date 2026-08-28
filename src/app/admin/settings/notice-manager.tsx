"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronRight, Bell } from "lucide-react";
import { toast } from "sonner";
import {
  addSiteNotice,
  deleteSiteNotice,
  updateSiteNotice,
  type ActionResult,
} from "@/server/actions";
import type { NoticeView } from "@/lib/notices";
import { formatDate } from "@/lib/dates";
import { EmptyState } from "@/components/empty-state";
import { DataList, DataListActions, DataListBody, DataListItem } from "@/components/data-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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

type DrawerMode = { type: "add" } | { type: "edit"; notice: NoticeView; index: number };

function PendingSubmit({
  label,
  pendingLabel,
  disabled,
}: {
  label: string;
  pendingLabel: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending || disabled} type="submit">
      {pending ? pendingLabel : label}
    </Button>
  );
}

function useActionToast(state: ActionResult | null, onOk?: () => void) {
  const router = useRouter();
  const onOkRef = useRef(onOk);
  onOkRef.current = onOk;

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message ?? "Saved.");
      onOkRef.current?.();
      router.refresh();
    } else {
      toast.error(state.error);
    }
  }, [router, state]);
}

function NoticeFields({
  disabled,
  notice,
  prefix,
}: {
  disabled?: boolean;
  notice?: NoticeView;
  prefix: string;
}) {
  const [title, setTitle] = useState(notice?.title ?? "");
  const [body, setBody] = useState(notice?.body ?? "");

  return (
    <div className="flex flex-col gap-3">
      {notice ? <input name="noticeId" type="hidden" value={notice.id} /> : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-title`}>Title</Label>
        <Input
          disabled={disabled}
          id={`${prefix}-title`}
          name="title"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Sunday walk is at 2pm"
          required
          value={title}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-body`}>Message</Label>
        <Textarea
          disabled={disabled}
          id={`${prefix}-body`}
          name="body"
          onChange={(event) => setBody(event.target.value)}
          placeholder="Meet at the usual car park. Bring water if it is warm."
          required
          rows={5}
          value={body}
        />
      </div>
    </div>
  );
}

function AddNoticeForm({
  disabled,
  onPendingChange,
  onSaved,
}: {
  disabled: boolean;
  onPendingChange?: (pending: boolean) => void;
  onSaved: () => void;
}) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    addSiteNotice,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state, () => {
    formRef.current?.reset();
    onSaved();
  });
  useEffect(() => onPendingChange?.(isPending), [isPending, onPendingChange]);

  return (
    <form action={action} className="flex min-h-0 flex-1 flex-col" ref={formRef}>
      <div className="flex-1 overflow-y-auto overscroll-y-contain px-4">
        <NoticeFields disabled={disabled} prefix="new" />
      </div>
      <DrawerFooter>
        <PendingSubmit disabled={disabled} label="Add notice" pendingLabel="Adding…" />
      </DrawerFooter>
    </form>
  );
}

function EditNoticeForm({
  notice,
  onPendingChange,
  onSaved,
}: {
  notice: NoticeView;
  onPendingChange?: (pending: boolean) => void;
  onSaved: () => void;
}) {
  const [updateState, updateAction, isPending] = useActionState<ActionResult | null, FormData>(
    updateSiteNotice,
    null,
  );
  useActionToast(updateState, onSaved);
  useEffect(() => onPendingChange?.(isPending), [isPending, onPendingChange]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <form action={updateAction} className="flex min-h-0 flex-1 flex-col" key={notice.id}>
        <div className="flex-1 overflow-y-auto overscroll-y-contain px-4">
          <NoticeFields notice={notice} prefix={`edit-${notice.id}`} />
        </div>
        <DrawerFooter>
          <PendingSubmit label="Save" pendingLabel="Saving…" />
        </DrawerFooter>
      </form>
    </div>
  );
}

function RemoveNoticeButton({
  noticeId,
  onRemoved,
  title,
}: {
  noticeId: string;
  onRemoved: () => void;
  title: string;
}) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    deleteSiteNotice,
    null,
  );
  const [open, setOpen] = useState(false);
  useActionToast(state, () => {
    setOpen(false);
    onRemoved();
  });

  return (
    <AlertDialog onOpenChange={(next) => setOpen(isPending ? true : next)} open={open}>
      <AlertDialogTrigger asChild>
        <Button size="xs" variant="destructive">
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent closeDisabled={isPending}>
        <form action={action} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this notice?</AlertDialogTitle>
            <AlertDialogDescription>
              “{title}” will come off the bell for everyone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="noticeId" type="hidden" value={noticeId} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} type="button">
              Keep it
            </AlertDialogCancel>
            <RemoveConfirm />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RemoveConfirm() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit" variant="destructive">
      {pending ? "Removing…" : "Remove"}
    </Button>
  );
}

export function SiteNoticeManager({
  maxNotices,
  notices,
}: {
  maxNotices: number;
  notices: NoticeView[];
}) {
  const [mode, setMode] = useState<DrawerMode | null>(null);
  const [isPending, setIsPending] = useState(false);
  const atLimit = notices.length >= maxNotices;
  const editingId = mode?.type === "edit" ? mode.notice.id : null;
  const liveIndex = editingId ? notices.findIndex((item) => item.id === editingId) : -1;
  const editing =
    mode?.type === "edit"
      ? {
          notice: notices.find((item) => item.id === mode.notice.id) ?? mode.notice,
          index: liveIndex < 0 ? mode.index : liveIndex,
        }
      : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button
          className="w-full sm:w-auto"
          disabled={atLimit}
          onClick={() => setMode({ type: "add" })}
          size="sm"
        >
          Add notice
        </Button>
      </div>
      {atLimit ? (
        <p className="text-sm text-muted-foreground">
          You already have {maxNotices} notices. Remove one to add another.
        </p>
      ) : null}

      {notices.length === 0 ? (
        <EmptyState
          description="Add one and signed-in members will see it in the bell."
          icon={Bell}
          title="No notices yet"
        />
      ) : (
        <DataList>
          {notices.map((notice, index) => (
            <DataListItem
              key={notice.id}
              onClick={() => setMode({ type: "edit", notice, index })}
            >
              <DataListBody>
                <p className="font-medium">Notice {index + 1}</p>
                <p className="text-sm text-muted-foreground wrap-break-word">{notice.title}</p>
                <p className="text-xs text-muted-foreground">{formatDate(notice.createdAt)}</p>
              </DataListBody>
              <DataListActions>
                <RemoveNoticeButton
                  noticeId={notice.id}
                  onRemoved={() =>
                    setMode((current) =>
                      current?.type === "edit" && current.notice.id === notice.id ? null : current,
                    )
                  }
                  title={notice.title}
                />
              </DataListActions>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </DataListItem>
          ))}
        </DataList>
      )}

      <Drawer
        closeDisabled={isPending}
        onOpenChange={(open) => {
          if (!open) setMode(null);
        }}
        open={mode !== null}
      >
        <DrawerContent className="sm:max-w-md">
          <DrawerHeader>
            <DrawerTitle>{editing ? `Notice ${editing.index + 1}` : "Add a notice"}</DrawerTitle>
            <DrawerDescription>
              {editing
                ? "Change the title or message. Saving it will show as new in the bell."
                : "This appears in the bell for everyone who is signed in."}
            </DrawerDescription>
          </DrawerHeader>
          {mode?.type === "add" ? (
            <AddNoticeForm
              disabled={atLimit}
              onPendingChange={setIsPending}
              onSaved={() => setMode(null)}
            />
          ) : null}
          {editing ? (
            <EditNoticeForm
              key={editing.notice.id}
              notice={editing.notice}
              onPendingChange={setIsPending}
              onSaved={() => setMode(null)}
            />
          ) : null}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
