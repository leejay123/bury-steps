"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronRight, CircleHelp } from "lucide-react";
import { toast } from "sonner";
import {
  addHomepageFaq,
  deleteHomepageFaq,
  reorderHomepageFaqs,
  updateHomepageFaq,
  type ActionResult,
} from "@/server/actions";
import {
  DEMO_FAQ,
  FAQ_CATEGORIES,
  faqCategoryLabel,
  type FaqCategoryId,
  type FaqView,
} from "@/lib/faqs";
import { EmptyState } from "@/components/empty-state";
import { DragHandle, useSortableIds } from "@/components/sortable-rows";
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
  disabled,
  id,
  onValueChange,
  value,
}: {
  disabled?: boolean;
  id: string;
  onValueChange: (value: FaqCategoryId) => void;
  value: FaqCategoryId;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>Category</Label>
      <input name="category" type="hidden" value={value} />
      <Select
        disabled={disabled}
        onValueChange={(next) => onValueChange(next as FaqCategoryId)}
        value={value}
      >
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {FAQ_CATEGORIES.map((category) => (
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
  disabled,
  faq,
  prefix,
}: {
  disabled?: boolean;
  faq?: FaqView;
  prefix: string;
}) {
  const [category, setCategory] = useState<FaqCategoryId>(faq?.category ?? "joining");
  const [question, setQuestion] = useState(faq?.question ?? "");
  const [answer, setAnswer] = useState(faq?.answer ?? "");

  return (
    <div className="flex flex-col gap-3">
      {faq ? <input name="faqId" type="hidden" value={faq.id} /> : null}
      <CategorySelect
        disabled={disabled}
        id={`${prefix}-category`}
        onValueChange={setCategory}
        value={category}
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
          disabled={disabled}
          onClick={() => {
            setCategory(DEMO_FAQ.category);
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

function AddFaqForm({ disabled, onSaved }: { disabled: boolean; onSaved: () => void }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(addHomepageFaq, null);
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state, () => {
    formRef.current?.reset();
    onSaved();
  });

  return (
    <form action={action} className="flex min-h-0 flex-1 flex-col" ref={formRef}>
      <div className="flex-1 overflow-y-auto px-4">
        <FaqFields disabled={disabled} prefix="new" />
      </div>
      <DrawerFooter>
        <PendingSubmit disabled={disabled} label="Add FAQ" pendingLabel="Adding…" />
      </DrawerFooter>
    </form>
  );
}

function EditFaqForm({ faq, onSaved }: { faq: FaqView; onSaved: () => void }) {
  const [updateState, updateAction] = useActionState<ActionResult | null, FormData>(
    updateHomepageFaq,
    null,
  );

  useActionToast(updateState, onSaved);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <form action={updateAction} className="flex min-h-0 flex-1 flex-col" key={faq.id}>
        <div className="flex-1 overflow-y-auto px-4">
          <FaqFields faq={faq} prefix={`edit-${faq.id}`} />
        </div>
        <DrawerFooter>
          <PendingSubmit label="Save" pendingLabel="Saving…" />
        </DrawerFooter>
      </form>
    </div>
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

function RemoveConfirm() {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit" variant="destructive">
      {pending ? "Removing…" : "Remove"}
    </Button>
  );
}

export function HomepageFaqManager({
  faqs,
  maxFaqs,
}: {
  faqs: FaqView[];
  maxFaqs: number;
}) {
  const [mode, setMode] = useState<DrawerMode | null>(null);
  const [, startTransition] = useTransition();
  const faqIds = faqs.map((item) => item.id);
  const { order, rowProps } = useSortableIds(faqIds, (ids) => {
    if (ids.join() === faqIds.join()) return;
    startTransition(() => {
      void reorderHomepageFaqs(ids);
    });
  });
  const sorted = order
    .map((id) => faqs.find((item) => item.id === id))
    .filter((item): item is FaqView => Boolean(item));
  const atLimit = faqs.length >= maxFaqs;
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button disabled={atLimit} onClick={() => setMode({ type: "add" })}>
          Add FAQ
        </Button>
      </div>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <span className="sr-only">Reorder</span>
              </TableHead>
              <TableHead>FAQ</TableHead>
              <TableHead>Question</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead className="w-20 text-right">
                <span className="sr-only">Remove</span>
              </TableHead>
              <TableHead className="w-8">
                <span className="sr-only">Edit</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((faq, index) => (
              <TableRow
                className="cursor-pointer"
                key={faq.id}
                onClick={() => setMode({ type: "edit", faq, index })}
                {...rowProps(faq.id)}
              >
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <DragHandle label={`Reorder FAQ ${index + 1}`} />
                </TableCell>
                <TableCell className="font-medium">FAQ {index + 1}</TableCell>
                <TableCell className="max-w-56 truncate text-muted-foreground sm:max-w-xs">
                  {faq.question}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {faqCategoryLabel(faq.category)}
                </TableCell>
                <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                  <RemoveFaqButton
                    faqId={faq.id}
                    onRemoved={() =>
                      setMode((current) =>
                        current?.type === "edit" && current.faq.id === faq.id ? null : current,
                      )
                    }
                    question={faq.question}
                  />
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
            <DrawerTitle>{editing ? `FAQ ${editing.index + 1}` : "Add an FAQ"}</DrawerTitle>
            <DrawerDescription>
              {editing
                ? "Change the category, question, or answer. Save when you are done."
                : "Question, answer, and a category for the filters on the homepage."}
            </DrawerDescription>
          </DrawerHeader>
          {mode?.type === "add" ? (
            <AddFaqForm disabled={atLimit} onSaved={() => setMode(null)} />
          ) : null}
          {editing ? (
            <EditFaqForm
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
