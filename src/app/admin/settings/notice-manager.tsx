"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Bell, ChevronRight, Folders } from "lucide-react";
import {
  addSiteNotice,
  addSiteNoticeCategory,
  deleteSiteNotice,
  deleteSiteNoticeCategory,
  reorderSiteNoticeCategories,
  updateSiteNotice,
  updateSiteNoticeCategory,
  type ActionResult,
} from "@/server/actions";
import {
  MAX_NOTICE_CATEGORY_LABEL,
  MAX_NOTICE_PAGE_BODY,
  MAX_NOTICE_TEASER,
  type NoticeCategoryView,
  type NoticeKind,
  type NoticeView,
} from "@/lib/notices";
import { formatDate } from "@/lib/dates";
import { preventDismissWhilePending, useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { EmptyState } from "@/components/empty-state";
import { ReorderButtons, useReorderableIds } from "@/components/sortable-rows";
import { DataList, DataListActions, DataListBody, DataListItem } from "@/components/data-list";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Popover, PopoverContent, PopoverDescription, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

type DrawerMode = { type: "add" } | { type: "edit"; notice: NoticeView; index: number };
type CategoryDrawerMode = { type: "add" } | { type: "edit"; category: NoticeCategoryView };

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
          maxLength={MAX_NOTICE_TEASER}
          name="body"
          onChange={(event) => setBody(event.target.value)}
          placeholder="Meet at the usual car park. Bring water if it is warm."
          required
          rows={4}
          value={body}
        />
        <p className="text-xs text-muted-foreground">
          Shown in the bell{kind === "PAGE" ? " and as the card excerpt on Notices" : ""}. Up to{" "}
          {MAX_NOTICE_TEASER} characters.
        </p>
      </div>
      {kind === "PAGE" ? (
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

function AddNoticeForm({
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

function EditNoticeForm({
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
    <AlertDialog
      closeDisabled={isPending}
      onOpenChange={preventDismissWhilePending(isPending, setOpen)}
      open={open}
    >
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
              “{title}” will come off the bell for everyone, and off the Notices page if it was a
              full-page notice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="noticeId" type="hidden" value={noticeId} />
          <FormError message={state && !state.ok ? state.error : null} />
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

function CategoryLabelForm({
  action,
  category,
  onPendingChange,
  onSaved,
  submitLabel,
  submitPendingLabel,
}: {
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  category?: NoticeCategoryView;
  onPendingChange?: (pending: boolean) => void;
  onSaved: () => void;
  submitLabel: string;
  submitPendingLabel: string;
}) {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );
  const [label, setLabel] = useState(category?.label ?? "");
  useActionToast(state, onSaved);
  useEffect(() => onPendingChange?.(isPending), [isPending, onPendingChange]);

  return (
    <form action={formAction} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto overscroll-y-contain px-4">
        {category ? <input name="categoryId" type="hidden" value={category.id} /> : null}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notice-category-label" required>
            Name
          </Label>
          <Input
            id="notice-category-label"
            maxLength={MAX_NOTICE_CATEGORY_LABEL}
            name="label"
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Walks"
            required
            value={label}
          />
        </div>
        <FormError message={state && !state.ok ? state.error : null} />
      </div>
      <DrawerFooter>
        <PendingSubmit label={submitLabel} pendingLabel={submitPendingLabel} />
      </DrawerFooter>
    </form>
  );
}

function CategoryDrawer({
  mode,
  onOpenChange,
  onPendingChange,
}: {
  mode: CategoryDrawerMode | null;
  onOpenChange: (open: boolean) => void;
  onPendingChange: (pending: boolean) => void;
}) {
  const open = mode !== null;
  return (
    <Drawer
      closeDisabled={false}
      onOpenChange={onOpenChange}
      open={open}
    >
      <DrawerContent className="sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>{mode?.type === "edit" ? "Edit category" : "Add a category"}</DrawerTitle>
          <DrawerDescription>
            Categories group full-page notices on the Notices page and in its filters.
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 flex-col">
          {mode?.type === "edit" ? (
            <CategoryLabelForm
              action={updateSiteNoticeCategory}
              category={mode.category}
              onPendingChange={onPendingChange}
              onSaved={() => onOpenChange(false)}
              submitLabel="Save"
              submitPendingLabel="Saving…"
            />
          ) : mode?.type === "add" ? (
            <CategoryLabelForm
              action={addSiteNoticeCategory}
              onPendingChange={onPendingChange}
              onSaved={() => onOpenChange(false)}
              submitLabel="Add category"
              submitPendingLabel="Adding…"
            />
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function RemoveCategoryButton({
  category,
  onlyCategory,
}: {
  category: NoticeCategoryView;
  onlyCategory: boolean;
}) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    deleteSiteNoticeCategory,
    null,
  );
  const [open, setOpen] = useState(false);
  useActionToast(state, () => setOpen(false));

  const blockedReason = onlyCategory
    ? "Keep at least one category."
    : category.noticeCount > 0
      ? "Move or remove the notices in this category first."
      : null;

  if (blockedReason) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button size="xs" variant="destructive">
            Remove
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64">
          <PopoverDescription>{blockedReason}</PopoverDescription>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <AlertDialog
      closeDisabled={isPending}
      onOpenChange={preventDismissWhilePending(isPending, setOpen)}
      open={open}
    >
      <AlertDialogTrigger asChild>
        <Button size="xs" variant="destructive">
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent closeDisabled={isPending}>
        <form action={action} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this category?</AlertDialogTitle>
            <AlertDialogDescription>
              “{category.label}” will come off the Notices filters. You can add it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="categoryId" type="hidden" value={category.id} />
          <FormError message={state && !state.ok ? state.error : null} />
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

function NoticeCategoryManager({
  categories,
  maxCategories,
}: {
  categories: NoticeCategoryView[];
  maxCategories: number;
}) {
  const [mode, setMode] = useState<CategoryDrawerMode | null>(null);
  const [, setIsPending] = useState(false);
  const categoryIds = categories.map((item) => item.id);
  const { moveDown, moveUp, order } = useReorderableIds(categoryIds, (ids) => {
    if (ids.join() === categoryIds.join()) return;
    return reorderSiteNoticeCategories(ids);
  });
  const sorted = order
    .map((id) => categories.find((item) => item.id === id))
    .filter((item): item is NoticeCategoryView => Boolean(item));
  const atLimit = categories.length >= maxCategories;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-medium">Categories</h2>
        <Button
          className="w-full sm:w-auto"
          disabled={atLimit}
          onClick={() => setMode({ type: "add" })}
          size="sm"
          variant="outline"
        >
          Add category
        </Button>
      </div>
      {atLimit ? (
        <p className="text-sm text-muted-foreground">
          You already have {maxCategories} categories. Remove one to add another.
        </p>
      ) : null}

      {categories.length === 0 ? (
        <EmptyState
          description="Add a category so you can group full-page notices."
          icon={Folders}
          title="No categories yet"
        />
      ) : (
        <DataList>
          {sorted.map((category, index) => (
            <DataListItem
              key={category.id}
              onClick={() => setMode({ type: "edit", category })}
            >
              <ReorderButtons
                canMoveDown={index < sorted.length - 1}
                canMoveUp={index > 0}
                label={`category ${category.label}`}
                onMoveDown={() => moveDown(category.id)}
                onMoveUp={() => moveUp(category.id)}
              />
              <DataListBody>
                <p className="font-medium">{category.label}</p>
                <p className="text-sm text-muted-foreground">
                  {category.noticeCount}{" "}
                  {category.noticeCount === 1 ? "full-page notice" : "full-page notices"}
                </p>
              </DataListBody>
              <DataListActions>
                <RemoveCategoryButton
                  category={category}
                  onlyCategory={categories.length <= 1}
                />
              </DataListActions>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </DataListItem>
          ))}
        </DataList>
      )}

      <CategoryDrawer
        mode={mode}
        onOpenChange={(open) => {
          if (!open) setMode(null);
        }}
        onPendingChange={setIsPending}
      />
    </div>
  );
}

export function SiteNoticeManager({
  categories,
  maxCategories,
  maxNotices,
  notices,
}: {
  categories: NoticeCategoryView[];
  maxCategories: number;
  maxNotices: number;
  notices: NoticeView[];
}) {
  const [mode, setMode] = useState<DrawerMode | null>(null);
  const [isPending, setIsPending] = useState(false);
  const atLimit = notices.length >= maxNotices;
  const noCategories = categories.length === 0;
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
    <div className="flex flex-col gap-8">
      <NoticeCategoryManager categories={categories} maxCategories={maxCategories} />
      <Separator />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-medium">Notices</h2>
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
        {noCategories ? (
          <p className="text-sm text-muted-foreground">
            Add a category above before you publish a full-page notice.
          </p>
        ) : null}

        {notices.length === 0 ? (
          <EmptyState
            description="Add one and signed-in members will see it in the bell. Choose Full page for longer write-ups on Notices."
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
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{notice.title}</p>
                    <Badge variant={notice.kind === "PAGE" ? "default" : "secondary"}>
                      {notice.kind === "PAGE" ? "Full page" : "Bell only"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground wrap-break-word">{notice.body}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(notice.createdAt)}
                    {notice.kind === "PAGE" && notice.categoryLabel
                      ? ` · ${notice.categoryLabel}`
                      : ""}
                    {notice.kind === "PAGE" && notice.slug ? ` · /notices/${notice.slug}` : ""}
                  </p>
                </DataListBody>
                <DataListActions>
                  <RemoveNoticeButton
                    noticeId={notice.id}
                    onRemoved={() =>
                      setMode((current) =>
                        current?.type === "edit" && current.notice.id === notice.id
                          ? null
                          : current,
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
      </div>

      <Drawer
        closeDisabled={isPending}
        onOpenChange={(open) => {
          if (!open) setMode(null);
        }}
        open={mode !== null}
      >
        <DrawerContent className="sm:max-w-md">
          <DrawerHeader>
            <DrawerTitle>{editing ? "Edit notice" : "Add a notice"}</DrawerTitle>
            <DrawerDescription>
              {editing
                ? "Change the type, title, or message. Saving it will show as new in the bell."
                : "Bell only stays in the drawer. Full page also appears on Notices. Notices are for signed-in members only."}
            </DrawerDescription>
          </DrawerHeader>
          {mode?.type === "add" ? (
            <AddNoticeForm
              categories={categories}
              disabled={atLimit}
              onPendingChange={setIsPending}
              onSaved={() => setMode(null)}
            />
          ) : null}
          {editing ? (
            <EditNoticeForm
              categories={categories}
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
