"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { ChevronRight, ImageIcon } from "lucide-react";
import {
  addHomepageSlide,
  deleteHomepageSlide,
  reorderHomepageSlides,
  replaceHomepageSlideImage,
  type ActionResult,
} from "@/server/actions";
import type { SlideView } from "@/lib/slides";
import { preventDismissWhilePending, useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { ImageDropzone } from "@/components/image-dropzone";
import { EmptyState } from "@/components/empty-state";
import { ReorderButtons, useReorderableIds } from "@/components/sortable-rows";
import { DataList, DataListActions, DataListBody, DataListItem } from "@/components/data-list";
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

type DrawerMode = { type: "add" } | { type: "edit"; slide: SlideView; index: number };

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

function SlideFields({
  disabled,
  prefix,
  slide,
}: {
  disabled?: boolean;
  prefix: string;
  slide?: SlideView;
}) {
  return (
    <div className="flex flex-col gap-3">
      {slide ? <input name="slideId" type="hidden" value={slide.id} /> : null}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-image`} required={!slide}>
          Photo
        </Label>
        <ImageDropzone
          clearable={false}
          disabled={disabled}
          existingAlt={slide?.alt}
          existingSrc={slide?.src}
          id={`${prefix}-image`}
          required={!slide}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${prefix}-alt`}>Short description</Label>
        <Input
          defaultValue={slide?.alt}
          disabled={disabled}
          id={`${prefix}-alt`}
          name="alt"
          placeholder="Walkers on a path near Bury"
        />
      </div>
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
    addHomepageSlide,
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
        <SlideFields disabled={disabled} prefix="new" />
        <FormError message={state && !state.ok ? state.error : null} />
      </div>
      <DrawerFooter>
        <PendingSubmit disabled={disabled} label="Add slide" pendingLabel="Adding…" />
      </DrawerFooter>
    </form>
  );
}

function EditDrawerForm({
  onPendingChange,
  onSaved,
  slide,
}: {
  onPendingChange?: (pending: boolean) => void;
  onSaved: () => void;
  slide: SlideView;
}) {
  const [updateState, updateAction, isPending] = useActionState<ActionResult | null, FormData>(
    replaceHomepageSlideImage,
    null,
  );

  useActionToast(updateState, onSaved);
  useEffect(() => onPendingChange?.(isPending), [isPending, onPendingChange]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <form action={updateAction} className="flex min-h-0 flex-1 flex-col" key={slide.id}>
        <div className="flex-1 overflow-y-auto overscroll-y-contain px-4">
          <SlideFields prefix={`edit-${slide.id}`} slide={slide} />
          <FormError message={updateState && !updateState.ok ? updateState.error : null} />
        </div>
        <DrawerFooter>
          <PendingSubmit label="Save" pendingLabel="Saving…" />
        </DrawerFooter>
      </form>
    </div>
  );
}

function RemoveSlideButton({
  onRemoved,
  slideId,
  title,
}: {
  onRemoved: () => void;
  slideId: string;
  title: string;
}) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    deleteHomepageSlide,
    null,
  );
  const [open, setOpen] = useState(false);
  useActionToast(state, () => {
    setOpen(false);
    onRemoved();
  });

  return (
    <AlertDialog
      closeDisabled={isPending}
      onOpenChange={preventDismissWhilePending(isPending, setOpen)}
      open={open}
    >
      <AlertDialogTrigger asChild>
        <Button size="xs" variant="destructive">
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent closeDisabled={isPending}>
        <form action={action} className="flex flex-col gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this slide?</AlertDialogTitle>
            <AlertDialogDescription>
              {title} will come off the homepage carousel. You can add a new photo afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="slideId" type="hidden" value={slideId} />
          <FormError message={state && !state.ok ? state.error : null} />
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

export function HomepageSlideManager({
  maxSlides,
  slides,
}: {
  maxSlides: number;
  slides: SlideView[];
}) {
  const [mode, setMode] = useState<DrawerMode | null>(null);
  const [isPending, setIsPending] = useState(false);
  const slideIds = slides.map((item) => item.id);
  const { moveDown, moveUp, order } = useReorderableIds(slideIds, (ids) => {
    if (ids.join() === slideIds.join()) return;
    return reorderHomepageSlides(ids);
  });
  const sorted = order
    .map((id) => slides.find((item) => item.id === id))
    .filter((item): item is SlideView => Boolean(item));
  const atLimit = slides.length >= maxSlides;
  const editingId = mode?.type === "edit" ? mode.slide.id : null;
  const liveIndex = editingId ? slides.findIndex((item) => item.id === editingId) : -1;
  const editing =
    mode?.type === "edit"
      ? {
          slide: slides.find((item) => item.id === mode.slide.id) ?? mode.slide,
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
          Add slide
        </Button>
      </div>
      {atLimit ? (
        <p className="text-sm text-muted-foreground">
          You already have {maxSlides} slides. Remove one to add another.
        </p>
      ) : null}

      {slides.length === 0 ? (
        <EmptyState
          description="Add one to show it in the homepage carousel."
          icon={ImageIcon}
          title="No slides yet"
        />
      ) : (
        <DataList>
          {sorted.map((slide, index) => (
            <DataListItem
              key={slide.id}
              onClick={() => setMode({ type: "edit", slide, index })}
            >
              <ReorderButtons
                canMoveDown={index < sorted.length - 1}
                canMoveUp={index > 0}
                label={`slide ${index + 1}`}
                onMoveDown={() => moveDown(slide.id)}
                onMoveUp={() => moveUp(slide.id)}
              />
              <Image
                alt=""
                className="size-10 shrink-0 rounded-md object-cover"
                height={40}
                src={slide.src}
                width={40}
              />
              <DataListBody>
                <p className="font-medium">Slide {index + 1}</p>
                <p className="text-sm text-muted-foreground wrap-break-word">{slide.alt}</p>
              </DataListBody>
              <DataListActions>
                <RemoveSlideButton
                  onRemoved={() =>
                    setMode((current) =>
                      current?.type === "edit" && current.slide.id === slide.id ? null : current,
                    )
                  }
                  slideId={slide.id}
                  title={`Slide ${index + 1}`}
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
            <DrawerTitle>{editing ? `Slide ${editing.index + 1}` : "Add a slide"}</DrawerTitle>
            <DrawerDescription>
              {editing
                ? "Change the photo or the short description. Save when you are done."
                : "Add a photo for the homepage carousel. JPEG, PNG or WebP, under 4 MB."}
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
              key={editing.slide.id}
              onPendingChange={setIsPending}
              onSaved={() => setMode(null)}
              slide={editing.slide}
            />
          ) : null}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
