"use client";

import { useActionState, useEffect, useState } from "react";
import { ChevronRight, Folders } from "lucide-react";
import {
  addSiteNoticeCategory,
  deleteSiteNoticeCategory,
  reorderSiteNoticeCategories,
  updateSiteNoticeCategory,
  type ActionResult,
} from "@/server/actions";
import { MAX_NOTICE_CATEGORY_LABEL, type NoticeCategoryView } from "@/lib/notices";
import { useActionToast, useNotifyActionState } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { EmptyState } from "@/components/empty-state";
import { ReorderButtons, useReorderableIds } from "@/components/sortable-rows";
import {
  DataList,
  DataListActions,
  DataListBody,
  DataListItem,
  DataListItemMain,
  dataListActionsStackClassName,
  dataListItemStackClassName,
} from "@/components/data-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Popover, PopoverContent, PopoverDescription, PopoverTrigger } from "@/components/ui/popover";
import { PendingSubmit, RemoveConfirm } from "./shared";

type CategoryDrawerMode = { type: "add" } | { type: "edit"; category: NoticeCategoryView };

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
}: {
  mode: CategoryDrawerMode | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const open = mode !== null;
  return (
    <Drawer
      closeDisabled={isPending}
      onOpenChange={onOpenChange}
      open={open}
      variant="form"
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
              key={mode.category.id}
              onPendingChange={setIsPending}
              onSaved={() => onOpenChange(false)}
              submitLabel="Save"
              submitPendingLabel="Saving…"
            />
          ) : mode?.type === "add" ? (
            <CategoryLabelForm
              action={addSiteNoticeCategory}
              onPendingChange={setIsPending}
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
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);

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
      onOpenChange={(next) => {
        if (next) setSession((value) => value + 1);
        setOpen(next);
      }}
      open={open}
    >
      <AlertDialogTrigger asChild>
        <Button size="xs" variant="destructive">
          Remove
        </Button>
      </AlertDialogTrigger>
      {open ? (
        <RemoveNoticeCategoryDialogForm
          key={session}
          categoryId={category.id}
          label={category.label}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </AlertDialog>
  );
}

function RemoveNoticeCategoryDialogForm({
  categoryId,
  label,
  onClose,
}: {
  categoryId: string;
  label: string;
  onClose: () => void;
}) {
  const [state, action, isPending] = useNotifyActionState(deleteSiteNoticeCategory, onClose);

  return (
    <AlertDialogContent closeDisabled={isPending}>
      <form action={action} className="flex flex-col gap-4">
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this category?</AlertDialogTitle>
          <AlertDialogDescription>
            “{label}” will come off the Notices filters. You can add it again later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <input name="categoryId" type="hidden" value={categoryId} />
        <FormError message={state && !state.ok ? state.error : null} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} type="button">
            Keep it
          </AlertDialogCancel>
          <RemoveConfirm />
        </AlertDialogFooter>
      </form>
    </AlertDialogContent>
  );
}

export function NoticeCategoryManager({
  categories,
  maxCategories,
}: {
  categories: NoticeCategoryView[];
  maxCategories: number;
}) {
  const [mode, setMode] = useState<CategoryDrawerMode | null>(null);
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
              className={dataListItemStackClassName}
              key={category.id}
              onClick={() => setMode({ type: "edit", category })}
            >
              <DataListItemMain className="items-center">
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
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </DataListItemMain>
              <DataListActions className={dataListActionsStackClassName}>
                <RemoveCategoryButton
                  category={category}
                  onlyCategory={categories.length <= 1}
                />
              </DataListActions>
            </DataListItem>
          ))}
        </DataList>
      )}

      <CategoryDrawer
        mode={mode}
        onOpenChange={(open) => {
          if (!open) setMode(null);
        }}
      />
    </div>
  );
}
