"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { CircleHelp } from "lucide-react";
import { toast } from "sonner";
import {
  addHomepageFaq,
  deleteHomepageFaq,
  moveHomepageFaq,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
    <Button type="submit" size="sm" disabled={pending || disabled}>
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
  id,
  value,
  onValueChange,
  disabled,
}: {
  id: string;
  value: FaqCategoryId;
  onValueChange: (value: FaqCategoryId) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>Category</Label>
      <input type="hidden" name="category" value={value} />
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

function AddFaqForm({ disabled }: { disabled: boolean }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(addHomepageFaq, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [category, setCategory] = useState<FaqCategoryId>("joining");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  useActionToast(state, () => {
    formRef.current?.reset();
    setCategory("joining");
    setQuestion("");
    setAnswer("");
  });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h3 className="font-semibold">Add an FAQ</h3>
        <p className="text-muted-foreground text-sm">
          {disabled
            ? "You already have 20 FAQs. Remove one to add another."
            : "Question, answer, and a category for the filters on the homepage."}
        </p>
      </div>
      <form action={action} className="flex flex-col gap-3" ref={formRef}>
          <CategorySelect
            disabled={disabled}
            id="new-faq-category"
            onValueChange={setCategory}
            value={category}
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-faq-question">Question</Label>
            <Input
              disabled={disabled}
              id="new-faq-question"
              name="question"
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={DEMO_FAQ.question}
              required
              value={question}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-faq-answer">Answer</Label>
            <Textarea
              disabled={disabled}
              id="new-faq-answer"
              name="answer"
              onChange={(event) => setAnswer(event.target.value)}
              placeholder={DEMO_FAQ.answer}
              required
              rows={4}
              value={answer}
            />
          </div>
          <div className="flex flex-wrap gap-2">
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
            <PendingSubmit disabled={disabled} label="Add FAQ" pendingLabel="Adding…" />
          </div>
        </form>
    </section>
  );
}

function RemoveFaqButton({ faqId, question }: { faqId: string; question: string }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(deleteHomepageFaq, null);
  const [open, setOpen] = useState(false);
  useActionToast(state, () => setOpen(false));

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

function FaqCard({ faq, index, total }: { faq: FaqView; index: number; total: number }) {
  const [updateState, updateAction] = useActionState<ActionResult | null, FormData>(
    updateHomepageFaq,
    null,
  );
  const [moveState, moveAction] = useActionState<ActionResult | null, FormData>(
    moveHomepageFaq,
    null,
  );
  const [category, setCategory] = useState<FaqCategoryId>(faq.category);

  useActionToast(updateState);
  useActionToast(moveState);

  return (
    <li>
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm font-medium">
          FAQ {index + 1} · {faqCategoryLabel(faq.category)}
        </p>
        <form action={updateAction} className="flex flex-col gap-3">
          <input name="faqId" type="hidden" value={faq.id} />
          <CategorySelect id={`faq-category-${faq.id}`} onValueChange={setCategory} value={category} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`faq-question-${faq.id}`}>Question</Label>
            <Input
              defaultValue={faq.question}
              id={`faq-question-${faq.id}`}
              name="question"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`faq-answer-${faq.id}`}>Answer</Label>
            <Textarea
              defaultValue={faq.answer}
              id={`faq-answer-${faq.id}`}
              name="answer"
              required
              rows={4}
            />
          </div>
          <PendingSubmit label="Save" pendingLabel="Saving…" />
        </form>
        <div className="flex flex-wrap gap-2">
          <form action={moveAction}>
            <input name="faqId" type="hidden" value={faq.id} />
            <input name="direction" type="hidden" value="up" />
            <Button disabled={index === 0} size="sm" type="submit" variant="outline">
              Move up
            </Button>
          </form>
          <form action={moveAction}>
            <input name="faqId" type="hidden" value={faq.id} />
            <input name="direction" type="hidden" value="down" />
            <Button disabled={index === total - 1} size="sm" type="submit" variant="outline">
              Move down
            </Button>
          </form>
          <RemoveFaqButton faqId={faq.id} question={faq.question} />
        </div>
      </div>
    </li>
  );
}

export function HomepageFaqManager({
  faqs,
  maxFaqs,
}: {
  faqs: FaqView[];
  maxFaqs: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <AddFaqForm disabled={faqs.length >= maxFaqs} />
      <Separator />
      {faqs.length === 0 ? (
        <EmptyState
          description="Add one above and it will show in the homepage FAQ."
          icon={CircleHelp}
          title="No FAQs yet"
        />
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border">
          {faqs.map((faq, index) => (
            <FaqCard faq={faq} index={index} key={faq.id} total={faqs.length} />
          ))}
        </ul>
      )}
    </div>
  );
}
