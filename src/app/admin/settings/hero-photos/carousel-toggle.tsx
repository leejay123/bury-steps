"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
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

  useEffect(() => setOn(enabled), [enabled]);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      if (state.message) toast.success(state.message);
    } else {
      // The checkbox already flipped optimistically when tapped — put it
      // back so the UI doesn't keep claiming a state the save never reached.
      setOn(enabled);
      toast.error(state.error);
    }
  }, [state, enabled]);

  return (
    <div className="flex items-start gap-3 rounded-xl border p-4">
      <Checkbox
        checked={on}
        id="carousel-enabled"
        onCheckedChange={(value) => {
          const next = value === true;
          if (next === on) return;
          setOn(next);
          const formData = new FormData();
          formData.set("carouselEnabled", next ? "on" : "");
          startTransition(() => {
            action(formData);
          });
        }}
      />
      <div className="flex flex-col gap-1">
        <Label htmlFor="carousel-enabled">Show carousel on the homepage</Label>
        <p className="text-sm text-muted-foreground">
          Turn this off to hide the photo slider completely. You can still keep photos here for later.
        </p>
      </div>
    </div>
  );
}
