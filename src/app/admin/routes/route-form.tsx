"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { createRoute, updateRoute, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { FormError } from "@/components/form-error";
import { RouteEditor } from "@/components/map/route-editor";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { RoutePoint } from "@/lib/route-geometry";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? "Saving…" : label}
    </Button>
  );
}

export function RouteForm({
  route,
  snappingAvailable = false,
  startNear,
}: {
  route?: { id: string; name: string; notes: string | null; points: RoutePoint[] };
  /** Whether a maintainer has configured OPENROUTESERVICE_API_KEY. */
  snappingAvailable?: boolean;
  /** Centre the map somewhere sensible for a brand-new route. */
  startNear?: { lat: number; lng: number } | null;
}) {
  const [points, setPoints] = useState<RoutePoint[]>(route?.points ?? []);
  const [snap, setSnap] = useState(true);
  const [state, action] = useActionState<ActionResult | null, FormData>(
    route ? updateRoute : createRoute,
    null,
  );
  useActionToast(state);

  return (
    <form action={action} className="flex flex-col gap-6">
      {route ? <input name="id" type="hidden" value={route.id} /> : null}
      {/* The map is a canvas, not a field — the drawn points ride along in a
          hidden input so this stays an ordinary progressively-enhanced form. */}
      <input name="points" type="hidden" value={JSON.stringify(points)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Route name</Label>
          <Input
            defaultValue={route?.name ?? ""}
            id="name"
            maxLength={120}
            name="name"
            placeholder="e.g. Burrs Country Park loop"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="notes">
            Notes <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            className="min-h-[38px]"
            defaultValue={route?.notes ?? ""}
            id="notes"
            maxLength={1000}
            name="notes"
            placeholder="e.g. one steep bit, gate halfway"
            rows={1}
          />
        </div>
      </div>

      {snappingAvailable ? (
        <div className="flex items-start gap-2">
          <input name="snap" type="hidden" value={snap ? "on" : "off"} />
          <Checkbox
            checked={snap}
            id="snap-to-paths"
            onCheckedChange={(value) => setSnap(value === true)}
          />
          <Label className="flex flex-col items-start gap-0.5 font-normal" htmlFor="snap-to-paths">
            Snap to real footpaths <span className="text-muted-foreground">(recommended)</span>
            <span className="text-xs font-normal text-muted-foreground">
              On save, matches your clicked points onto real paths and recalculates the distance
              from that. Turn off to save the line exactly as clicked.
            </span>
          </Label>
        </div>
      ) : null}

      <RouteEditor
        onChange={setPoints}
        onImport={() => setSnap(false)}
        startNear={startNear}
        value={points}
      />

      <FormError message={state && !state.ok ? state.error : null} />

      <div className="flex flex-wrap gap-2">
        <Submit label={route ? "Save changes" : "Save route"} />
        <Button asChild type="button" variant="outline">
          <Link href="/admin/routes">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
