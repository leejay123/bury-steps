"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  addHomepageTestimonial,
  deleteHomepageTestimonial,
  moveHomepageTestimonial,
  updateHomepageTestimonial,
  type ActionResult,
} from "@/server/actions";
import type { TestimonialView } from "@/lib/testimonials";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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

function AddTestimonialForm({ disabled }: { disabled: boolean }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    addHomepageTestimonial,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [quote, setQuote] = useState("");

  useActionToast(state, () => {
    formRef.current?.reset();
    setName("");
    setRole("");
    setQuote("");
  });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h3 className="font-semibold">Add a testimonial</h3>
        <p className="text-muted-foreground text-sm">
          {disabled
            ? "You already have 12 testimonials. Remove one to add another."
            : "Name, the line under the name, and the quote. Photo is optional. Use the example if you want a starting point."}
        </p>
      </div>
      <form ref={formRef} action={action} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-name">Name</Label>
            <Input
              id="new-name"
              name="name"
              required
              disabled={disabled}
              placeholder={DEMO_TESTIMONIAL.name}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-role">Line under the name</Label>
            <Input
              id="new-role"
              name="role"
              disabled={disabled}
              placeholder={DEMO_TESTIMONIAL.role}
              value={role}
              onChange={(event) => setRole(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-quote">Testimonial</Label>
            <Textarea
              id="new-quote"
              name="quote"
              required
              disabled={disabled}
              rows={4}
              placeholder={DEMO_TESTIMONIAL.quote}
              value={quote}
              onChange={(event) => setQuote(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-photo">Photo (optional)</Label>
            <Input
              id="new-photo"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={disabled}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => {
                setName(DEMO_TESTIMONIAL.name);
                setRole(DEMO_TESTIMONIAL.role);
                setQuote(DEMO_TESTIMONIAL.quote);
              }}
            >
              Fill with example
            </Button>
            <PendingSubmit label="Add testimonial" pendingLabel="Adding…" disabled={disabled} />
          </div>
        </form>
    </section>
  );
}

function RemoveTestimonialButton({
  testimonialId,
  name,
}: {
  testimonialId: string;
  name: string;
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    deleteHomepageTestimonial,
    null,
  );
  const [open, setOpen] = useState(false);
  useActionToast(state, () => setOpen(false));

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
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
          <input type="hidden" name="testimonialId" value={testimonialId} />
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
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? "Removing…" : "Remove"}
    </Button>
  );
}

function TestimonialCard({
  testimonial,
  index,
  total,
}: {
  testimonial: TestimonialView;
  index: number;
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

  useActionToast(updateState);
  useActionToast(moveState);

  return (
    <li>
      <div className="flex items-center gap-3 bg-muted/40 p-4">
        {testimonial.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={testimonial.image} alt="" className="size-10 rounded-full object-cover" />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
            {testimonial.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{testimonial.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {testimonial.role || "No line under the name"}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm font-medium">Testimonial {index + 1}</p>
        <form action={updateAction} className="flex flex-col gap-3">
          <input type="hidden" name="testimonialId" value={testimonial.id} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`name-${testimonial.id}`}>Name</Label>
            <Input id={`name-${testimonial.id}`} name="name" defaultValue={testimonial.name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`role-${testimonial.id}`}>Line under the name</Label>
            <Input id={`role-${testimonial.id}`} name="role" defaultValue={testimonial.role} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`quote-${testimonial.id}`}>Testimonial</Label>
            <Textarea
              id={`quote-${testimonial.id}`}
              name="quote"
              defaultValue={testimonial.quote}
              required
              rows={4}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`image-${testimonial.id}`}>Change photo</Label>
            <Input
              id={`image-${testimonial.id}`}
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
            />
          </div>
          <PendingSubmit label="Save" pendingLabel="Saving…" />
        </form>
        <div className="flex flex-wrap gap-2">
          <form action={moveAction}>
            <input type="hidden" name="testimonialId" value={testimonial.id} />
            <input type="hidden" name="direction" value="up" />
            <Button type="submit" size="sm" variant="outline" disabled={index === 0}>
              Move up
            </Button>
          </form>
          <form action={moveAction}>
            <input type="hidden" name="testimonialId" value={testimonial.id} />
            <input type="hidden" name="direction" value="down" />
            <Button type="submit" size="sm" variant="outline" disabled={index === total - 1}>
              Move down
            </Button>
          </form>
          <RemoveTestimonialButton testimonialId={testimonial.id} name={testimonial.name} />
        </div>
      </div>
    </li>
  );
}

export function HomepageTestimonialManager({
  testimonials,
  maxTestimonials,
}: {
  testimonials: TestimonialView[];
  maxTestimonials: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <AddTestimonialForm disabled={testimonials.length >= maxTestimonials} />
      <Separator />
      {testimonials.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No testimonials on the homepage yet. Add one above, or fill the example and then add it.
        </p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              index={index}
              total={testimonials.length}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
