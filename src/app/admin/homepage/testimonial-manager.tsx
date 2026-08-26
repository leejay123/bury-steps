"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronRight, Quote } from "lucide-react";
import { toast } from "sonner";
import {
  addHomepageTestimonial,
  deleteHomepageTestimonial,
  moveHomepageTestimonial,
  updateHomepageTestimonial,
  type ActionResult,
} from "@/server/actions";
import type { TestimonialView } from "@/lib/testimonials";
import { ImageDropzone } from "@/components/image-dropzone";
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
  onSaved,
}: {
  disabled: boolean;
  onSaved: () => void;
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    addHomepageTestimonial,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useActionToast(state, () => {
    formRef.current?.reset();
    onSaved();
  });

  return (
    <form action={action} className="flex min-h-0 flex-1 flex-col" ref={formRef}>
      <div className="flex-1 overflow-y-auto px-4">
        <TestimonialFields disabled={disabled} prefix="new" />
      </div>
      <DrawerFooter>
        <PendingSubmit disabled={disabled} label="Add testimonial" pendingLabel="Adding…" />
      </DrawerFooter>
    </form>
  );
}

function EditDrawerForm({
  index,
  onSaved,
  testimonial,
  total,
}: {
  index: number;
  onSaved: () => void;
  testimonial: TestimonialView;
  total: number;
}) {
  const [updateState, updateAction] = useActionState<ActionResult | null, FormData>(
    updateHomepageTestimonial,
    null,
  );
  const [moveState, moveAction] = useActionState<ActionResult | null, FormData>(
    moveHomepageTestimonial,
    null,
  );

  useActionToast(updateState, onSaved);
  useActionToast(moveState);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <form action={updateAction} className="flex min-h-0 flex-1 flex-col" key={testimonial.id}>
        <div className="flex-1 overflow-y-auto px-4">
          <TestimonialFields prefix={`edit-${testimonial.id}`} testimonial={testimonial} />
        </div>
        <DrawerFooter>
          <PendingSubmit label="Save" pendingLabel="Saving…" />
        </DrawerFooter>
      </form>
      <div className="flex flex-wrap gap-2 px-4 pb-4">
        <form action={moveAction}>
          <input name="testimonialId" type="hidden" value={testimonial.id} />
          <input name="direction" type="hidden" value="up" />
          <Button disabled={index === 0} size="sm" type="submit" variant="outline">
            Move up
          </Button>
        </form>
        <form action={moveAction}>
          <input name="testimonialId" type="hidden" value={testimonial.id} />
          <input name="direction" type="hidden" value="down" />
          <Button disabled={index === total - 1} size="sm" type="submit" variant="outline">
            Move down
          </Button>
        </form>
        <RemoveTestimonialButton name={testimonial.name} onRemoved={onSaved} testimonialId={testimonial.id} />
      </div>
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
  const [state, action] = useActionState<ActionResult | null, FormData>(
    deleteHomepageTestimonial,
    null,
  );
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
            <AlertDialogTitle>Remove this testimonial?</AlertDialogTitle>
            <AlertDialogDescription>
              {name}’s quote will come off the public homepage. You can add a new one afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="testimonialId" type="hidden" value={testimonialId} />
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

export function HomepageTestimonialManager({
  maxTestimonials,
  testimonials,
}: {
  maxTestimonials: number;
  testimonials: TestimonialView[];
}) {
  const [mode, setMode] = useState<DrawerMode | null>(null);
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
        <Button disabled={atLimit} onClick={() => setMode({ type: "add" })}>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Testimonial</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-8">
                <span className="sr-only">Edit</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {testimonials.map((testimonial, index) => (
              <TableRow
                className="relative cursor-pointer"
                key={testimonial.id}
                onClick={() => setMode({ type: "edit", testimonial, index })}
              >
                <TableCell className="font-medium">Testimonial {index + 1}</TableCell>
                <TableCell className="text-muted-foreground">{testimonial.name}</TableCell>
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
            <AddDrawerForm disabled={atLimit} onSaved={() => setMode(null)} />
          ) : null}
          {editing ? (
            <EditDrawerForm
              index={editing.index}
              key={editing.testimonial.id}
              onSaved={() => setMode(null)}
              testimonial={editing.testimonial}
              total={testimonials.length}
            />
          ) : null}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
