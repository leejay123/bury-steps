"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  addSiteNotice,
  updateSiteNotice,
  type ActionResult,
} from "@/server/actions";
import {
  MAX_NOTICE_BELL_BODY,
  MAX_NOTICE_PAGE_BODY,
  MAX_NOTICE_TEASER,
  isPinnedNotice,
  type NoticeCategoryView,
  type NoticeKind,
  type NoticeView,
} from "@/lib/notices";
import { useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DrawerFooter } from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PendingSubmit } from "./shared";

function NoticeFields({
  categories,
  disabled,
  notice,
  prefix,
}: {
  categories: NoticeCategoryView[];
  disabled?: boolean;
  notice?: NoticeView;
  prefix: string;
}) {
  const pinned = notice ? isPinnedNotice(notice) : false;
  const bodyMax = pinned ? MAX_NOTICE_TEASER : MAX_NOTICE_BELL_BODY;
  const [title, setTitle] = useState(notice?.title ?? "");
  const [body, setBody] = useState(notice?.body ?? "");
  const [kind, setKind] = useState<NoticeKind>(notice?.kind ?? "BELL");
  const [pageBody, setPageBody] = useState(notice?.pageBody ?? "");
  const [categoryId, setCategoryId] = useState(
    notice?.categoryId ?? categories[0]?.id ?? "",
  );

  return (
    <div className="flex flex-col gap-3">
      {notice ? <input name="noticeId" type="hidden" value={notice.id} /> : null}
      {pinned ? (
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          This is the pinned welcome notice. Members see it first in the bell when it is on. Use{" "}
          <code className="text-xs">{"{{firstName}}"}</code> in the title or message to insert
          their name. You can edit the text or turn it off on the list — you cannot remove it or
          turn it into a full page.
        </p>
      ) : null}
      {!pinned ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${prefix}-kind`}>Type</Label>
          <input name="kind" type="hidden" value={kind} />
          <Select
            disabled={disabled}
            onValueChange={(value) => setKind(value as NoticeKind)}
            value={kind}
          >
            <SelectTrigger id={`${prefix}-kind`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BELL">Bell only — short message in the drawer</SelectItem>
              <SelectItem value="PAGE">Full page — teaser in the bell, article on Notices</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : (
        <input name="kind" type="hidden" value="BELL" />
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-title`} required>
          Title
        </Label>
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
        <Label htmlFor={`${prefix}-body`} required>
          Bell message
        </Label>
        <Textarea
          disabled={disabled}
          id={`${prefix}-body`}
          maxLength={bodyMax}
          name="body"
          onChange={(event) => setBody(event.target.value)}
          placeholder="Meet at the usual car park. Bring water if it is warm."
          required
          rows={pinned ? 4 : 3}
          value={body}
        />
        <p className="text-xs text-muted-foreground">
          {pinned
            ? `Shown in the bell. Up to ${bodyMax} characters.`
            : kind === "PAGE"
              ? `Short teaser in the bell (with …) and on the Notices list. Full article below. Up to ${bodyMax} characters.`
              : `Shown in the bell only. Up to ${bodyMax} characters.`}
        </p>
      </div>
      {kind === "PAGE" && !pinned ? (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${prefix}-category`} required>
              Category
            </Label>
            <input name="categoryId" type="hidden" value={categoryId} />
            <Select
              disabled={disabled || categories.length === 0}
              onValueChange={setCategoryId}
              value={categoryId}
            >
              <SelectTrigger id={`${prefix}-category`}>
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${prefix}-page-body`} required>
              Full page
            </Label>
            <Textarea
              disabled={disabled}
              id={`${prefix}-page-body`}
              maxLength={MAX_NOTICE_PAGE_BODY}
              name="pageBody"
              onChange={(event) => setPageBody(event.target.value)}
              placeholder="The longer write-up members open from the bell or the Notices page…"
              required
              rows={10}
              value={pageBody}
            />
            <p className="text-xs text-muted-foreground">
              Up to {MAX_NOTICE_PAGE_BODY.toLocaleString()} characters. Plain text; line breaks are
              kept.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function AddNoticeForm({
  categories,
  disabled,
  onPendingChange,
  onSaved,
}: {
  categories: NoticeCategoryView[];
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
        <NoticeFields categories={categories} disabled={disabled} prefix="new" />
        <FormError message={state && !state.ok ? state.error : null} />
      </div>
      <DrawerFooter>
        <PendingSubmit disabled={disabled} label="Add notice" pendingLabel="Adding…" />
      </DrawerFooter>
    </form>
  );
}

export function EditNoticeForm({
  categories,
  notice,
  onPendingChange,
  onSaved,
}: {
  categories: NoticeCategoryView[];
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
          <NoticeFields
            categories={categories}
            notice={notice}
            prefix={`edit-${notice.id}`}
          />
          <FormError message={updateState && !updateState.ok ? updateState.error : null} />
        </div>
        <DrawerFooter>
          <PendingSubmit label="Save" pendingLabel="Saving…" />
        </DrawerFooter>
      </form>
    </div>
  );
}
