"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { ImageIcon, UploadIcon, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function assignFile(input: HTMLInputElement, file: File | null) {
  const data = new DataTransfer();
  if (file) data.items.add(file);
  input.files = data.files;
}

export function ImageDropzone({
  aspect = "video",
  clearable = true,
  disabled,
  existingAlt,
  existingSrc,
  hint = "JPEG, PNG or WebP, under 4 MB.",
  id,
  name = "image",
  required,
}: {
  aspect?: "video" | "square";
  clearable?: boolean;
  disabled?: boolean;
  existingAlt?: string;
  existingSrc?: string;
  hint?: string;
  id?: string;
  name?: string;
  required?: boolean;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function applyFile(next: File | null) {
    const input = inputRef.current;
    if (!input) return;

    if (next) {
      if (!ALLOWED.has(next.type)) {
        toast.error("Use a JPEG, PNG or WebP image.");
        return;
      }
      if (next.size > MAX_BYTES) {
        toast.error("Keep the image under 4 MB.");
        return;
      }
      setRemoved(false);
    }

    assignFile(input, next);
    setFile(next);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return next ? URL.createObjectURL(next) : null;
    });
  }

  function openPicker() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function clearPhoto(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;

    if (file) {
      applyFile(null);
      return;
    }

    if (existingSrc && clearable) {
      applyFile(null);
      setRemoved(true);
    }
  }

  const preview = previewUrl ?? (removed ? null : existingSrc);
  const showRemove = Boolean(preview) && !disabled && Boolean(file || clearable);
  const aspectClass = aspect === "square" ? "aspect-square w-full" : "aspect-video w-full";

  return (
    <div className="flex w-full flex-col gap-2">
      <input
        accept={ACCEPT}
        className="sr-only"
        disabled={disabled}
        id={inputId}
        name={name}
        onChange={(event) => applyFile(event.target.files?.[0] ?? null)}
        ref={inputRef}
        required={required && !preview}
        type="file"
      />
      {removed && !file ? <input name="removeImage" type="hidden" value="on" /> : null}

      {preview ? (
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border",
            aspectClass,
            dragging && "ring-ring ring-[3px]",
          )}
        >
          <button
            aria-label="Change photo"
            className={cn(
              "absolute inset-0 block text-left outline-none",
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
              "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            )}
            disabled={disabled}
            onClick={openPicker}
            onDragLeave={() => setDragging(false)}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
              if (!disabled) setDragging(true);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              applyFile(event.dataTransfer.files[0] ?? null);
            }}
            type="button"
          >
            <Image
              alt={existingAlt || "Selected photo"}
              className="object-cover object-center"
              fill
              sizes="(min-width: 640px) 33vw, 100vw"
              // Local previews are blob: URLs the image optimizer can't fetch,
              // and this is a brief admin-only preview anyway — skip
              // optimization entirely rather than special-case each source.
              unoptimized
              src={preview}
            />
          </button>
          {showRemove ? (
            <Button
              aria-label="Remove photo"
              className="absolute top-2 right-2 z-10"
              onClick={clearPhoto}
              size="icon"
              type="button"
              variant="secondary"
            >
              <X />
            </Button>
          ) : null}
          <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/55 p-3 text-white">
            <span className="truncate text-sm font-medium">
              {file ? file.name : "Change photo"}
            </span>
            <Badge variant="secondary">{file ? "New" : "Replace"}</Badge>
          </span>
        </div>
      ) : (
        <Empty
          aria-label="Choose a photo"
          className={cn(
            "w-full flex-none border border-dashed outline-none",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-muted/40",
            dragging && "border-foreground bg-muted/40",
          )}
          onClick={openPicker}
          onDragLeave={() => setDragging(false)}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            if (!disabled) setDragging(true);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            applyFile(event.dataTransfer.files[0] ?? null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openPicker();
            }
          }}
          role="button"
          tabIndex={disabled ? -1 : 0}
        >
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ImageIcon />
            </EmptyMedia>
            <EmptyTitle>Drop a photo here</EmptyTitle>
            <EmptyDescription>{hint}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <span className={cn(buttonVariants({ size: "sm", variant: "outline" }), "pointer-events-none")}>
              <UploadIcon data-icon="inline-start" />
              Choose photo
            </span>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}
