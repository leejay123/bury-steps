"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

function useActionToast(state: ActionResult | null) {
  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(state.message ?? "Saved.");
    else toast.error(state.error);
  }, [state]);
}

function AddTestimonialForm({ disabled }: { disabled: boolean }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    addHomepageTestimonial,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add a testimonial</CardTitle>
        <CardDescription>
          {disabled
            ? "You already have 12 testimonials. Remove one to add another."
            : "Name, the line under the name, and the quote. Photo is optional."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={action} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-name">Name</Label>
            <Input id="new-name" name="name" required disabled={disabled} placeholder="Sarah" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-role">Line under the name</Label>
            <Input
              id="new-role"
              name="role"
              disabled={disabled}
              placeholder="Member, Bury Steps"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-quote">Testimonial</Label>
            <Textarea
              id="new-quote"
              name="quote"
              required
              disabled={disabled}
              rows={4}
              placeholder="The Sunday walks have given me a reason to get out and I have made real friends."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-photo">Photo (optional)</Label>
            <Input
              id="new-photo"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={disabled}
            />
          </div>
          <PendingSubmit label="Add testimonial" pendingLabel="Adding…" disabled={disabled} />
        </form>
      </CardContent>
    </Card>
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
  const [deleteState, deleteAction] = useActionState<ActionResult | null, FormData>(
    deleteHomepageTestimonial,
    null,
  );

  useActionToast(updateState);
  useActionToast(moveState);
  useActionToast(deleteState);

  return (
    <li className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-3 border-b bg-muted/40 p-4">
        {testimonial.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={testimonial.image}
            alt=""
            className="size-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
            {testimonial.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{testimonial.name}</p>
          <p className="truncate text-xs text-muted-foreground">{testimonial.role || "No line under the name"}</p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <p className="text-sm font-medium">Testimonial {index + 1}</p>
        <form action={updateAction} className="space-y-3">
          <input type="hidden" name="testimonialId" value={testimonial.id} />
          <div className="space-y-1.5">
            <Label htmlFor={`name-${testimonial.id}`}>Name</Label>
            <Input id={`name-${testimonial.id}`} name="name" defaultValue={testimonial.name} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`role-${testimonial.id}`}>Line under the name</Label>
            <Input id={`role-${testimonial.id}`} name="role" defaultValue={testimonial.role} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`quote-${testimonial.id}`}>Testimonial</Label>
            <Textarea
              id={`quote-${testimonial.id}`}
              name="quote"
              defaultValue={testimonial.quote}
              required
              rows={4}
            />
          </div>
          <div className="space-y-1.5">
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
          <form action={deleteAction}>
            <input type="hidden" name="testimonialId" value={testimonial.id} />
            <Button type="submit" size="sm" variant="destructive">
              Remove
            </Button>
          </form>
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
    <div className="space-y-6">
      {testimonials.length === 0 ? (
        <p className="rounded-lg border py-8 text-center text-sm text-muted-foreground">
          No testimonials yet. Add one below and it will show on the public homepage.
        </p>
      ) : (
        <ul className="space-y-4">
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
      <AddTestimonialForm disabled={testimonials.length >= maxTestimonials} />
    </div>
  );
}
