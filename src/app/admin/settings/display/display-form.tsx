"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { updateScrollToTopEnabled, type ActionResult } from "@/server/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function DisplaySettings({ scrollToTopEnabled }: { scrollToTopEnabled: boolean }) {
  const [on, setOn] = useState(scrollToTopEnabled);
  const [state, action] = useActionState<ActionResult | null, FormData>(
    updateScrollToTopEnabled,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => setOn(scrollToTopEnabled), [scrollToTopEnabled]);

  useEffect(() => {
    if (!state) return;
    if (!state.ok) toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="flex items-start gap-3" ref={formRef}>
      <input name="scrollToTopEnabled" type="hidden" value={on ? "on" : ""} />
      <Checkbox
        checked={on}
        id="scroll-to-top"
        onCheckedChange={(value) => {
          const next = value === true;
          setOn(next);
          toast.success(next ? "Back to top is on." : "Back to top is off.");
          const input = formRef.current?.elements.namedItem("scrollToTopEnabled");
          if (input instanceof HTMLInputElement) input.value = next ? "on" : "";
          formRef.current?.requestSubmit();
        }}
      />
      <div className="flex flex-col gap-1">
        <Label htmlFor="scroll-to-top">Show the back to top button</Label>
        <p className="text-sm text-muted-foreground">
          After you scroll down, a button appears in the corner to jump back to the top. Turn this
          off if you would rather not have it.
        </p>
      </div>
    </form>
  );
}
