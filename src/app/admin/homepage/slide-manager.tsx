"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronRight, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import {
  addHomepageSlide,
  deleteHomepageSlide,
  reorderHomepageSlides,
  replaceHomepageSlideImage,
  type ActionResult,
} from "@/server/actions";
import type { SlideView } from "@/lib/slides";
import { ImageDropzone } from "@/components/image-dropzone";
import { EmptyState } from "@/components/empty-state";
import { DragHandle, useSortableIds } from "@/components/sortable-rows";
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
        <Label htmlFor={`${prefix}-image`}>Photo</Label>
        <ImageDropzone
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
  onSaved,
}: {
  disabled: boolean;
  onSaved: () => void;
}) {
  const [state, action] = useActionState<ActionResult | null, FormData>(addHomepageSlide, null);
  const formRef = useRef<HTMLFormElement>(null);

  useActionToast(state, () => {
    formRef.current?.reset();
    onSaved();
  });

  return (
    <form action={action} className="flex min-h-0 flex-1 flex-col" ref={formRef}>
      <div className="flex-1 overflow-y-auto px-4">
        <SlideFields disabled={disabled} prefix="new" />
      </div>
      <DrawerFooter>
        <PendingSubmit disabled={disabled} label="Add slide" pendingLabel="Adding…" />
      </DrawerFooter>
    </form>
  );
}

function EditDrawerForm({
  onSaved,
  slide,
}: {
  onSaved: () => void;
  slide: SlideView;
}) {
  const [updateState, updateAction] = useActionState<ActionResult | null, FormData>(
    replaceHomepageSlideImage,
    null,
  );

  useActionToast(updateState, onSaved);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <form action={updateAction} className="flex min-h-0 flex-1 flex-col" key={slide.id}>
        <div className="flex-1 overflow-y-auto px-4">
          <SlideFields prefix={`edit-${slide.id}`} slide={slide} />
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
  const [state, action] = useActionState<ActionResult | null, FormData>(deleteHomepageSlide, null);
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
            <AlertDialogTitle>Remove this slide?</AlertDialogTitle>
            <AlertDialogDescription>
              {title} will come off the homepage carousel. You can add a new photo afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input name="slideId" type="hidden" value={slideId} />
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

export function HomepageSlideManager({
  maxSlides,
  slides,
}: {
  maxSlides: number;
  slides: SlideView[];
}) {
  const [mode, setMode] = useState<DrawerMode | null>(null);
  const [, startTransition] = useTransition();
  const slideIds = slides.map((item) => item.id);
  const { handleProps, order, rowProps } = useSortableIds(slideIds, (ids) => {
    if (ids.join() === slideIds.join()) return;
    startTransition(() => {
      void reorderHomepageSlides(ids);
    });
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
        <Button disabled={atLimit} onClick={() => setMode({ type: "add" })} size="sm">
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <span className="sr-only">Reorder</span>
              </TableHead>
              <TableHead className="w-16">Photo</TableHead>
              <TableHead>Slide</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-20 text-right">
                <span className="sr-only">Remove</span>
              </TableHead>
              <TableHead className="w-8">
                <span className="sr-only">Edit</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((slide, index) => (
              <TableRow
                className="relative cursor-pointer"
                key={slide.id}
                onClick={() => setMode({ type: "edit", slide, index })}
                {...rowProps(slide.id)}
              >
                <TableCell onClick={(event) => event.stopPropagation()}>
                  <DragHandle label={`Reorder slide ${index + 1}`} {...handleProps(slide.id)} />
                </TableCell>
                <TableCell>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt=""
                    className="size-10 rounded-md object-cover"
                    src={slide.src}
                  />
                </TableCell>
                <TableCell className="font-medium">Slide {index + 1}</TableCell>
                <TableCell className="text-muted-foreground">{slide.alt}</TableCell>
                <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                  <RemoveSlideButton
                    onRemoved={() =>
                      setMode((current) =>
                        current?.type === "edit" && current.slide.id === slide.id ? null : current,
                      )
                    }
                    slideId={slide.id}
                    title={`Slide ${index + 1}`}
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
            <DrawerTitle>{editing ? `Slide ${editing.index + 1}` : "Add a slide"}</DrawerTitle>
            <DrawerDescription>
              {editing
                ? "Change the photo or the short description. Save when you are done."
                : "Add a photo for the homepage carousel. JPEG, PNG or WebP, under 4 MB."}
            </DrawerDescription>
          </DrawerHeader>
          {mode?.type === "add" ? (
            <AddDrawerForm disabled={atLimit} onSaved={() => setMode(null)} />
          ) : null}
          {editing ? (
            <EditDrawerForm
              key={editing.slide.id}
              onSaved={() => setMode(null)}
              slide={editing.slide}
            />
          ) : null}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
