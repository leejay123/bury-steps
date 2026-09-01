"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addHomepageFaq, updateHomepageFaq, type ActionResult } from "@/server/actions";
import { DEMO_FAQ, type FaqCategoryView, type FaqView } from "@/lib/faqs";
import { useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
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
        <Label htmlFor={`${prefix}-question`} required>
          Question
        </Label>
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
        <Label htmlFor={`${prefix}-answer`} required>
          Answer
        </Label>
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

export function AddFaqForm({
  categories,
  disabled,
  onPendingChange,
  onSaved,
}: {
  categories: FaqCategoryView[];
  disabled: boolean;
  onPendingChange?: (pending: boolean) => void;
  onSaved: () => void;
}) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    addHomepageFaq,
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
        <FaqFields categories={categories} disabled={disabled} prefix="new" />
        <FormError message={state && !state.ok ? state.error : null} />
      </div>
      <DrawerFooter>
        <PendingSubmit disabled={disabled} label="Add FAQ" pendingLabel="Adding…" />
      </DrawerFooter>
    </form>
  );
}

export function EditFaqForm({
  categories,
  faq,
  onPendingChange,
  onSaved,
}: {
  categories: FaqCategoryView[];
  faq: FaqView;
  onPendingChange?: (pending: boolean) => void;
  onSaved: () => void;
}) {
  const [updateState, updateAction, isPending] = useActionState<ActionResult | null, FormData>(
    updateHomepageFaq,
    null,
  );

  useActionToast(updateState, onSaved);
  useEffect(() => onPendingChange?.(isPending), [isPending, onPendingChange]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <form action={updateAction} className="flex min-h-0 flex-1 flex-col" key={faq.id}>
        <div className="flex-1 overflow-y-auto overscroll-y-contain px-4">
          <FaqFields categories={categories} faq={faq} prefix={`edit-${faq.id}`} />
          <FormError message={updateState && !updateState.ok ? updateState.error : null} />
        </div>
        <DrawerFooter>
          <PendingSubmit label="Save" pendingLabel="Saving…" />
        </DrawerFooter>
      </form>
    </div>
  );
}
