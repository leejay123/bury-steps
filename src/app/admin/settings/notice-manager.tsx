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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

function AddNoticeForm({ disabled, onSaved }: { disabled: boolean; onSaved: () => void }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(addSiteNotice, null);
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state, () => {
    formRef.current?.reset();
    onSaved();
  });

  return (
    <form action={action} className="flex min-h-0 flex-1 flex-col" ref={formRef}>
      <div className="flex-1 overflow-y-auto px-4">
        <NoticeFields disabled={disabled} prefix="new" />
      </div>
      <DrawerFooter>
        <PendingSubmit disabled={disabled} label="Add notice" pendingLabel="Adding…" />
      </DrawerFooter>
    </form>
  );
}

function EditNoticeForm({ notice, onSaved }: { notice: NoticeView; onSaved: () => void }) {
  const [updateState, updateAction] = useActionState<ActionResult | null, FormData>(
    updateSiteNotice,
    null,
  );
  useActionToast(updateState, onSaved);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <form action={updateAction} className="flex min-h-0 flex-1 flex-col" key={notice.id}>
        <div className="flex-1 overflow-y-auto px-4">
          <NoticeFields notice={notice} prefix={`edit-${notice.id}`} />
        </div>
        <DrawerFooter>
          <PendingSubmit label="Save" pendingLabel="Saving…" />
        </DrawerFooter>
      </form>
      <div className="px-4 pb-4">
        <RemoveNoticeButton noticeId={notice.id} onRemoved={onSaved} title={notice.title} />
      </div>
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
  const [state, action] = useActionState<ActionResult | null, FormData>(deleteSiteNotice, null);
  const [open, setOpen] = useState(false);
  useActionToast(state, () => {
    setOpen(false);
    onRemoved();
  });

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive">
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={action} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this notice?</AlertDialogTitle>
            <AlertDialogDescription>
              “{title}” will come off the bell for everyone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="noticeId" type="hidden" value={noticeId} />
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Keep it</AlertDialogCancel>
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
        <Button disabled={atLimit} onClick={() => setMode({ type: "add" })}>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Notice</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell">Added</TableHead>
              <TableHead className="w-8">
                <span className="sr-only">Edit</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notices.map((notice, index) => (
              <TableRow
                className="cursor-pointer"
                key={notice.id}
                onClick={() => setMode({ type: "edit", notice, index })}
              >
                <TableCell className="font-medium">Notice {index + 1}</TableCell>
                <TableCell className="text-muted-foreground">{notice.title}</TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {formatDate(notice.createdAt)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <ChevronRight className="size-4" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Drawer
        direction="right"
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
            <AddNoticeForm disabled={atLimit} onSaved={() => setMode(null)} />
          ) : null}
          {editing ? (
            <EditNoticeForm
              key={editing.notice.id}
              notice={editing.notice}
              onSaved={() => setMode(null)}
            />
          ) : null}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
