"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronRight, Quote } from "lucide-react";
import { toast } from "sonner";
import {
  addHomepageTestimonial,
  deleteHomepageTestimonial,
  reorderHomepageTestimonials,
  updateHomepageTestimonial,
  type ActionResult,
} from "@/server/actions";
import type { TestimonialView } from "@/lib/testimonials";
import { ImageDropzone } from "@/components/image-dropzone";
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
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DEMO_TESTIMONIAL = {
  name: "Jane H.",
  role: "Member, Bury",
  quote:
    "I used to struggle to get out on a Sunday. These walks gave me a reason to leave the house, and I have made friends I would never have met otherwise.",
};

type DrawerMode = { type: "add" } | { type: "edit"; testimonial: TestimonialView; index: number };

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

function TestimonialFields({
  disabled,
  prefix,
  testimonial,
}: {
  disabled?: boolean;
  prefix: string;
  testimonial?: TestimonialView;
}) {
  const [name, setName] = useState(testimonial?.name ?? "");
  const [role, setRole] = useState(testimonial?.role ?? "");
  const [quote, setQuote] = useState(testimonial?.quote ?? "");

  return (
    <div className="flex flex-col gap-3">
      {testimonial ? <input name="testimonialId" type="hidden" value={testimonial.id} /> : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-name`}>Name</Label>
        <Input
          disabled={disabled}
          id={`${prefix}-name`}
          name="name"
          onChange={(event) => setName(event.target.value)}
          placeholder={DEMO_TESTIMONIAL.name}
          required
          value={name}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-role`}>Line under the name</Label>
        <Input
          disabled={disabled}
          id={`${prefix}-role`}
          name="role"
          onChange={(event) => setRole(event.target.value)}
          placeholder={DEMO_TESTIMONIAL.role}
          value={role}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-quote`}>Testimonial</Label>
        <Textarea
          disabled={disabled}
          id={`${prefix}-quote`}
          name="quote"
          onChange={(event) => setQuote(event.target.value)}
          placeholder={DEMO_TESTIMONIAL.quote}
          required
          rows={5}
          value={quote}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-photo`}>{testimonial ? "Photo" : "Photo (optional)"}</Label>
        <ImageDropzone
          aspect="square"
          disabled={disabled}
          existingAlt={testimonial?.name}
          existingSrc={testimonial?.image}
          id={`${prefix}-photo`}
        />
      </div>
      {!testimonial ? (
        <Button
          disabled={disabled}
          onClick={() => {
            setName(DEMO_TESTIMONIAL.name);
            setRole(DEMO_TESTIMONIAL.role);
            setQuote(DEMO_TESTIMONIAL.quote);
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

function AddDrawerForm({
  disabled,
  onPendingChange,
  onSaved,
}: {
  disabled: boolean;
  onPendingChange?: (pending: boolean) => void;
  onSaved: () => void;
}) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    addHomepageTestimonial,
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
        <TestimonialFields disabled={disabled} prefix="new" />
      </div>
      <DrawerFooter>
        <PendingSubmit disabled={disabled} label="Add testimonial" pendingLabel="Adding…" />
      </DrawerFooter>
    </form>
  );
}

function EditDrawerForm({
  onPendingChange,
  onSaved,
  testimonial,
}: {
  onPendingChange?: (pending: boolean) => void;
  onSaved: () => void;
  testimonial: TestimonialView;
}) {
  const [updateState, updateAction, isPending] = useActionState<ActionResult | null, FormData>(
    updateHomepageTestimonial,
    null,
  );

  useActionToast(updateState, onSaved);
  useEffect(() => onPendingChange?.(isPending), [isPending, onPendingChange]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <form action={updateAction} className="flex min-h-0 flex-1 flex-col" key={testimonial.id}>
        <div className="flex-1 overflow-y-auto overscroll-y-contain px-4">
          <TestimonialFields prefix={`edit-${testimonial.id}`} testimonial={testimonial} />
        </div>
        <DrawerFooter>
          <PendingSubmit label="Save" pendingLabel="Saving…" />
        </DrawerFooter>
      </form>
    </div>
  );
}

function RemoveTestimonialButton({
  name,
  onRemoved,
  testimonialId,
}: {
  name: string;
  onRemoved: () => void;
  testimonialId: string;
}) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    deleteHomepageTestimonial,
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
            <AlertDialogTitle>Remove this testimonial?</AlertDialogTitle>
            <AlertDialogDescription>
              {name}’s quote will come off the public homepage. You can add a new one afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="testimonialId" type="hidden" value={testimonialId} />
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

export function HomepageTestimonialManager({
  maxTestimonials,
  testimonials,
}: {
  maxTestimonials: number;
  testimonials: TestimonialView[];
}) {
  const [mode, setMode] = useState<DrawerMode | null>(null);
  const [isPending, setIsPending] = useState(false);
  const testimonialIds = testimonials.map((item) => item.id);
  const { moveDown, moveUp, order } = useReorderableIds(testimonialIds, (ids) => {
    if (ids.join() === testimonialIds.join()) return;
    return reorderHomepageTestimonials(ids);
  });
  const sorted = order
    .map((id) => testimonials.find((item) => item.id === id))
    .filter((item): item is TestimonialView => Boolean(item));
  const atLimit = testimonials.length >= maxTestimonials;
  const editingId = mode?.type === "edit" ? mode.testimonial.id : null;
  const liveIndex = editingId ? testimonials.findIndex((item) => item.id === editingId) : -1;
  const editing =
    mode?.type === "edit"
      ? {
          testimonial:
            testimonials.find((item) => item.id === mode.testimonial.id) ?? mode.testimonial,
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
          Add testimonial
        </Button>
      </div>
      {atLimit ? (
        <p className="text-sm text-muted-foreground">
          You already have {maxTestimonials} testimonials. Remove one to add another.
        </p>
      ) : null}

      {testimonials.length === 0 ? (
        <EmptyState
          description="Add one to show it on the homepage."
          icon={Quote}
          title="No testimonials yet"
        />
      ) : (
        <DataList>
          {sorted.map((testimonial, index) => (
            <DataListItem
              key={testimonial.id}
              onClick={() => setMode({ type: "edit", testimonial, index })}
            >
              <ReorderButtons
                canMoveDown={index < sorted.length - 1}
                canMoveUp={index > 0}
                label={`testimonial ${index + 1}`}
                onMoveDown={() => moveDown(testimonial.id)}
                onMoveUp={() => moveUp(testimonial.id)}
              />
              <DataListBody>
                <p className="font-medium">Testimonial {index + 1}</p>
                <p className="text-sm text-muted-foreground">{testimonial.name}</p>
              </DataListBody>
              <DataListActions>
                <RemoveTestimonialButton
                  name={testimonial.name}
                  onRemoved={() =>
                    setMode((current) =>
                      current?.type === "edit" && current.testimonial.id === testimonial.id
                        ? null
                        : current,
                    )
                  }
                  testimonialId={testimonial.id}
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
            <DrawerTitle>
              {editing ? `Testimonial ${editing.index + 1}` : "Add a testimonial"}
            </DrawerTitle>
            <DrawerDescription>
              {editing
                ? "Change the name, quote, or photo. Save when you are done."
                : "Name, the line under the name, and the quote. Photo is optional."}
            </DrawerDescription>
          </DrawerHeader>
          {mode?.type === "add" ? (
            <AddDrawerForm
              disabled={atLimit}
              onPendingChange={setIsPending}
              onSaved={() => setMode(null)}
            />
          ) : null}
          {editing ? (
            <EditDrawerForm
              key={editing.testimonial.id}
              onPendingChange={setIsPending}
              onSaved={() => setMode(null)}
              testimonial={editing.testimonial}
            />
          ) : null}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
