"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronRight, CircleHelp, Folders } from "lucide-react";
import { toast } from "sonner";
import {
  addHomepageFaq,
  addHomepageFaqCategory,
  deleteHomepageFaq,
  deleteHomepageFaqCategory,
  reorderHomepageFaqCategories,
  reorderHomepageFaqs,
  updateHomepageFaq,
  updateHomepageFaqCategory,
  type ActionResult,
} from "@/server/actions";
import {
  DEMO_FAQ,
  MAX_FAQ_CATEGORY_LABEL,
  type FaqCategoryView,
  type FaqView,
} from "@/lib/faqs";
import { EmptyState } from "@/components/empty-state";
import { ReorderButtons, useReorderableIds } from "@/components/sortable-rows";
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

type DrawerMode = { type: "add" } | { type: "edit"; faq: FaqView; index: number };

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

function CategorySelect({
  categories,
  disabled,
  id,
  onValueChange,
  value,
}: {
  categories: FaqCategoryView[];
  disabled?: boolean;
  id: string;
  onValueChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>Category</Label>
      <input name="categoryId" type="hidden" value={value} />
      <Select disabled={disabled || !value} onValueChange={onValueChange} value={value}>
        <SelectTrigger id={id}>
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
  );
}

function FaqFields({
  categories,
  disabled,
  faq,
  prefix,
}: {
  categories: FaqCategoryView[];
  disabled?: boolean;
  faq?: FaqView;
  prefix: string;
}) {
  const exampleCategoryId =
    categories.find((category) => category.slug === DEMO_FAQ.categorySlug)?.id ??
    categories[0]?.id ??
    "";
  const [categoryId, setCategoryId] = useState(faq?.categoryId ?? exampleCategoryId);
  const [question, setQuestion] = useState(faq?.question ?? "");
  const [answer, setAnswer] = useState(faq?.answer ?? "");

  return (
    <div className="flex flex-col gap-3">
      {faq ? <input name="faqId" type="hidden" value={faq.id} /> : null}
      <CategorySelect
        categories={categories}
        disabled={disabled}
        id={`${prefix}-category`}
        onValueChange={setCategoryId}
        value={categoryId}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-question`}>Question</Label>
        <Input
          disabled={disabled}
          id={`${prefix}-question`}
          name="question"
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={DEMO_FAQ.question}
          required
          value={question}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-answer`}>Answer</Label>
        <Textarea
          disabled={disabled}
          id={`${prefix}-answer`}
          name="answer"
          onChange={(event) => setAnswer(event.target.value)}
          placeholder={DEMO_FAQ.answer}
          required
          rows={5}
          value={answer}
        />
      </div>
      {!faq ? (
        <Button
          disabled={disabled || !exampleCategoryId}
          onClick={() => {
            setCategoryId(exampleCategoryId);
            setQuestion(DEMO_FAQ.question);
            setAnswer(DEMO_FAQ.answer);
          }}
          size="sm"
          type="button"
          variant="outline"
        >
          Fill with example
        </Button>
      ) : null}
    </div>
  );
}

function AddFaqForm({
  categories,
  disabled,
  onSaved,
}: {
  categories: FaqCategoryView[];
  disabled: boolean;
  onSaved: () => void;
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(addHomepageFaq, null);
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state, () => {
    formRef.current?.reset();
    onSaved();
  });

  return (
    <form action={action} className="flex min-h-0 flex-1 flex-col" ref={formRef}>
      <div className="flex-1 overflow-y-auto px-4">
        <FaqFields categories={categories} disabled={disabled} prefix="new" />
      </div>
      <DrawerFooter>
        <PendingSubmit disabled={disabled} label="Add FAQ" pendingLabel="Adding…" />
      </DrawerFooter>
    </form>
  );
}

function EditFaqForm({
  categories,
  faq,
  onSaved,
}: {
  categories: FaqCategoryView[];
  faq: FaqView;
  onSaved: () => void;
}) {
  const [updateState, updateAction] = useActionState<ActionResult | null, FormData>(
    updateHomepageFaq,
    null,
  );

  useActionToast(updateState, onSaved);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <form action={updateAction} className="flex min-h-0 flex-1 flex-col" key={faq.id}>
        <div className="flex-1 overflow-y-auto px-4">
          <FaqFields categories={categories} faq={faq} prefix={`edit-${faq.id}`} />
        </div>
        <DrawerFooter>
          <PendingSubmit label="Save" pendingLabel="Saving…" />
        </DrawerFooter>
      </form>
    </div>
  );
}

function RemoveConfirm({ label = "Remove" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit" variant="destructive">
      {pending ? "Removing…" : label}
    </Button>
  );
}

function RemoveFaqButton({
  faqId,
  onRemoved,
  question,
}: {
  faqId: string;
  onRemoved: () => void;
  question: string;
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(deleteHomepageFaq, null);
  const [open, setOpen] = useState(false);
  useActionToast(state, () => {
    setOpen(false);
    onRemoved();
  });

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogTrigger asChild>
        <Button size="xs" variant="destructive">
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={action} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this FAQ?</AlertDialogTitle>
            <AlertDialogDescription>
              “{question}” will come off the public homepage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="faqId" type="hidden" value={faqId} />
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Keep it</AlertDialogCancel>
            <RemoveConfirm />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CategoryLabelForm({
  action,
  category,
  onSaved,
  submitLabel,
  submitPendingLabel,
}: {
  action: (
    prev: ActionResult | null,
    formData: FormData,
  ) => Promise<ActionResult>;
  category?: FaqCategoryView;
  onSaved: () => void;
  submitLabel: string;
  submitPendingLabel: string;
}) {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(action, null);
  const [label, setLabel] = useState(category?.label ?? "");
  useActionToast(state, onSaved);

  return (
    <form action={formAction} className="flex flex-col gap-3 pb-4">
      {category ? <input name="categoryId" type="hidden" value={category.id} /> : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={category ? `edit-category-${category.id}` : "new-category"}>Name</Label>
        <Input
          id={category ? `edit-category-${category.id}` : "new-category"}
          maxLength={MAX_FAQ_CATEGORY_LABEL}
          name="label"
          onChange={(event) => setLabel(event.target.value)}
          placeholder="On the day"
          required
          value={label}
        />
      </div>
      <PendingSubmit label={submitLabel} pendingLabel={submitPendingLabel} />
    </form>
  );
}

type CategoryDrawerMode = { type: "add" } | { type: "edit"; category: FaqCategoryView };

function CategoryDrawer({
  mode,
  onOpenChange,
}: {
  mode: CategoryDrawerMode | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Drawer onOpenChange={onOpenChange} open={mode !== null}>
      <DrawerContent className="sm:max-w-md">
        <DrawerHeader>
          <DrawerTitle>{mode?.type === "edit" ? "Edit category" : "Add a category"}</DrawerTitle>
          <DrawerDescription>This name shows as a filter on the public FAQ.</DrawerDescription>
        </DrawerHeader>
        <div className="px-4">
          {mode?.type === "edit" ? (
            <CategoryLabelForm
              action={updateHomepageFaqCategory}
              category={mode.category}
              key={mode.category.id}
              onSaved={() => onOpenChange(false)}
              submitLabel="Save"
              submitPendingLabel="Saving…"
            />
          ) : mode?.type === "add" ? (
            <CategoryLabelForm
              action={addHomepageFaqCategory}
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
  category: FaqCategoryView;
  onlyCategory: boolean;
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    deleteHomepageFaqCategory,
    null,
  );
  const [open, setOpen] = useState(false);
  useActionToast(state, () => setOpen(false));

  const blockedReason = onlyCategory
    ? "Keep at least one category."
    : category.faqCount > 0
      ? "Move or remove the FAQs in this category first."
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
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogTrigger asChild>
        <Button size="xs" variant="destructive">
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={action} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this category?</AlertDialogTitle>
            <AlertDialogDescription>
              “{category.label}” will come off the FAQ filters. You can add it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="categoryId" type="hidden" value={category.id} />
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Keep it</AlertDialogCancel>
            <RemoveConfirm />
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function FaqCategoryManager({
  categories,
  maxCategories,
}: {
  categories: FaqCategoryView[];
  maxCategories: number;
}) {
  const [mode, setMode] = useState<CategoryDrawerMode | null>(null);
  const categoryIds = categories.map((item) => item.id);
  const { moveDown, moveUp, order } = useReorderableIds(categoryIds, (ids) => {
    if (ids.join() === categoryIds.join()) return;
    void reorderHomepageFaqCategories(ids);
  });
  const sorted = order
    .map((id) => categories.find((item) => item.id === id))
    .filter((item): item is FaqCategoryView => Boolean(item));
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
          description="Add a category so you can group questions on the homepage."
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
                  {category.faqCount} {category.faqCount === 1 ? "question" : "questions"}
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
      />
    </div>
  );
}

export function HomepageFaqManager({
  categories,
  faqs,
  maxCategories,
  maxFaqs,
}: {
  categories: FaqCategoryView[];
  faqs: FaqView[];
  maxCategories: number;
  maxFaqs: number;
}) {
  const [mode, setMode] = useState<DrawerMode | null>(null);
  const faqIds = faqs.map((item) => item.id);
  const { moveDown, moveUp, order } = useReorderableIds(faqIds, (ids) => {
    if (ids.join() === faqIds.join()) return;
    void reorderHomepageFaqs(ids);
  });
  const sorted = order
    .map((id) => faqs.find((item) => item.id === id))
    .filter((item): item is FaqView => Boolean(item));
  const atLimit = faqs.length >= maxFaqs;
  const noCategories = categories.length === 0;
  const editingId = mode?.type === "edit" ? mode.faq.id : null;
  const liveIndex = editingId ? faqs.findIndex((item) => item.id === editingId) : -1;
  const editing =
    mode?.type === "edit"
      ? {
          faq: faqs.find((item) => item.id === mode.faq.id) ?? mode.faq,
          index: liveIndex < 0 ? mode.index : liveIndex,
        }
      : null;

  return (
    <div className="flex flex-col gap-8">
      <FaqCategoryManager categories={categories} maxCategories={maxCategories} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-medium">Questions</h2>
          <Button
            className="w-full sm:w-auto"
            disabled={atLimit || noCategories}
            onClick={() => setMode({ type: "add" })}
            size="sm"
          >
            Add FAQ
          </Button>
        </div>
        {noCategories ? (
          <p className="text-sm text-muted-foreground">Add a category before you add a question.</p>
        ) : null}
        {atLimit ? (
          <p className="text-sm text-muted-foreground">
            You already have {maxFaqs} FAQs. Remove one to add another.
          </p>
        ) : null}

        {faqs.length === 0 ? (
          <EmptyState
            description="Add one and it will show in the homepage FAQ."
            icon={CircleHelp}
            title="No FAQs yet"
          />
        ) : (
          <DataList>
            {sorted.map((faq, index) => (
              <DataListItem
                key={faq.id}
                onClick={() => setMode({ type: "edit", faq, index })}
              >
                <ReorderButtons
                  canMoveDown={index < sorted.length - 1}
                  canMoveUp={index > 0}
                  label={`FAQ ${index + 1}`}
                  onMoveDown={() => moveDown(faq.id)}
                  onMoveUp={() => moveUp(faq.id)}
                />
                <DataListBody>
                  <p className="font-medium">FAQ {index + 1}</p>
                  <p className="text-sm text-muted-foreground wrap-break-word">{faq.question}</p>
                  <p className="text-xs text-muted-foreground">{faq.categoryLabel}</p>
                </DataListBody>
                <DataListActions>
                  <RemoveFaqButton
                    faqId={faq.id}
                    onRemoved={() =>
                      setMode((current) =>
                        current?.type === "edit" && current.faq.id === faq.id ? null : current,
                      )
                    }
                    question={faq.question}
                  />
                </DataListActions>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </DataListItem>
            ))}
          </DataList>
        )}
      </div>

      <Drawer
        onOpenChange={(open) => {
          if (!open) setMode(null);
        }}
        open={mode !== null}
      >
        <DrawerContent className="sm:max-w-md">
          <DrawerHeader>
            <DrawerTitle>{editing ? `FAQ ${editing.index + 1}` : "Add an FAQ"}</DrawerTitle>
            <DrawerDescription>
              {editing
                ? "Change the category, question, or answer. Save when you are done."
                : "Question, answer, and a category for the filters on the homepage."}
            </DrawerDescription>
          </DrawerHeader>
          {mode?.type === "add" ? (
            <AddFaqForm
              categories={categories}
              disabled={atLimit}
              onSaved={() => setMode(null)}
            />
          ) : null}
          {editing ? (
            <EditFaqForm
              categories={categories}
              faq={editing.faq}
              key={editing.faq.id}
              onSaved={() => setMode(null)}
            />
          ) : null}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
