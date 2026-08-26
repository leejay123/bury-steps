"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { updateCarouselEnabled, type ActionResult } from "@/server/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function CarouselToggle({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled);
  const [state, action] = useActionState<ActionResult | null, FormData>(
    updateCarouselEnabled,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => setOn(enabled), [enabled]);

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(state.message ?? "Saved.");
    else toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="flex items-start gap-3" ref={formRef}>
      <input name="carouselEnabled" type="hidden" value={on ? "on" : ""} />
      <Checkbox
        checked={on}
        id="carousel-enabled"
        onCheckedChange={(value) => {
          const next = value === true;
          setOn(next);
          const input = formRef.current?.elements.namedItem("carouselEnabled");
          if (input instanceof HTMLInputElement) input.value = next ? "on" : "";
          formRef.current?.requestSubmit();
        }}
      />
      <div className="flex flex-col gap-1">
        <Label htmlFor="carousel-enabled">Show carousel on the homepage</Label>
        <p className="text-sm text-muted-foreground">
          Turn this off to hide the photo slider completely. You can still keep photos here for later.
        </p>
      </div>
    </form>
  );
}
