"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import {
  addHomepageSlide,
  deleteHomepageSlide,
  moveHomepageSlide,
  replaceHomepageSlideImage,
  type ActionResult,
} from "@/server/actions";
import type { SlideView } from "@/lib/slides";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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

function AddSlideForm({ disabled }: { disabled: boolean }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(addHomepageSlide, null);
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h3 className="font-semibold">Add a slide</h3>
        <p className="text-muted-foreground text-sm">
          {disabled ? "You already have 3 slides. Remove one to add another." : "JPEG, PNG or WebP, under 4 MB."}
        </p>
      </div>
      <form ref={formRef} action={action} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-image">Image</Label>
            <Input id="new-image" name="image" type="file" accept="image/jpeg,image/png,image/webp" required disabled={disabled} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-alt">Short description</Label>
            <Input
              id="new-alt"
              name="alt"
              placeholder="Walkers on a path near Bury"
              disabled={disabled}
            />
          </div>
          <PendingSubmit label="Add slide" pendingLabel="Adding…" disabled={disabled} />
        </form>
    </section>
  );
}

function SlideCard({
  slide,
  index,
  total,
}: {
  slide: SlideView;
  index: number;
  total: number;
}) {
  const [replaceState, replaceAction] = useActionState<ActionResult | null, FormData>(
    replaceHomepageSlideImage,
    null,
  );
  const [moveState, moveAction] = useActionState<ActionResult | null, FormData>(moveHomepageSlide, null);
  const [deleteState, deleteAction] = useActionState<ActionResult | null, FormData>(
    deleteHomepageSlide,
    null,
  );

  useActionToast(replaceState);
  useActionToast(moveState);
  useActionToast(deleteState);

  return (
    <li>
      <div className="aspect-[16/9] bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slide.src} alt={slide.alt} className="size-full object-cover" />
      </div>
      <div className="space-y-3 p-4">
        <p className="text-sm font-medium">Slide {index + 1}</p>
        <form action={replaceAction} className="space-y-3">
          <input type="hidden" name="slideId" value={slide.id} />
          <div className="space-y-1.5">
            <Label htmlFor={`image-${slide.id}`}>Change image</Label>
            <Input
              id={`image-${slide.id}`}
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`alt-${slide.id}`}>Short description</Label>
            <Input id={`alt-${slide.id}`} name="alt" defaultValue={slide.alt} />
          </div>
          <PendingSubmit label="Save image" pendingLabel="Saving…" />
        </form>
        <div className="flex flex-wrap gap-2">
          <form action={moveAction}>
            <input type="hidden" name="slideId" value={slide.id} />
            <input type="hidden" name="direction" value="up" />
            <Button type="submit" size="sm" variant="outline" disabled={index === 0}>
              Move up
            </Button>
          </form>
          <form action={moveAction}>
            <input type="hidden" name="slideId" value={slide.id} />
            <input type="hidden" name="direction" value="down" />
            <Button type="submit" size="sm" variant="outline" disabled={index === total - 1}>
              Move down
            </Button>
          </form>
          <form action={deleteAction}>
            <input type="hidden" name="slideId" value={slide.id} />
            <Button type="submit" size="sm" variant="destructive">
              Remove
            </Button>
          </form>
        </div>
      </div>
    </li>
  );
}

export function HomepageSlideManager({
  slides,
  maxSlides,
}: {
  slides: SlideView[];
  maxSlides: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      {slides.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No slides yet. Add one below and it will show in the homepage hero carousel.
        </p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border">
          {slides.map((slide, index) => (
            <SlideCard key={slide.id} slide={slide} index={index} total={slides.length} />
          ))}
        </ul>
      )}
      <Separator />
      <AddSlideForm disabled={slides.length >= maxSlides} />
    </div>
  );
}
