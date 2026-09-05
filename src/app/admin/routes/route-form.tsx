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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { RoutePoint } from "@/lib/route-geometry";
import type { ElevationStats } from "@/lib/gpx";

const NO_DIFFICULTY = "none";
const DIFFICULTIES = [
  { value: "EASY", label: "Easy" },
  { value: "MODERATE", label: "Moderate" },
  { value: "HARD", label: "Hard" },
];

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
  route?: {
    id: string;
    name: string;
    notes: string | null;
    points: RoutePoint[];
    elevationGainMetres: number | null;
    elevationLossMetres: number | null;
    maxElevationMetres: number | null;
    minElevationMetres: number | null;
    /** Already validated against `points.length` by the page loading it. */
    elevationProfile: number[] | null;
    difficulty: string | null;
  };
  /** Whether a maintainer has configured OPENROUTESERVICE_API_KEY. */
  snappingAvailable?: boolean;
  /** Centre the map somewhere sensible for a brand-new route. */
  startNear?: { lat: number; lng: number } | null;
}) {
  const [points, setPoints] = useState<RoutePoint[]>(route?.points ?? []);
  const [snap, setSnap] = useState(true);
  const [difficulty, setDifficulty] = useState(route?.difficulty ?? NO_DIFFICULTY);
  // Kept alongside points rather than recalculated: elevation gain/loss
  // describes the ORIGINAL recorded trace, which doesn't survive
  // re-drawing or re-snapping the way the plan-view line does — see the
  // comment on WalkRoute.elevationGainMetres in schema.prisma.
  const [elevation, setElevation] = useState<ElevationStats | null>(
    route?.elevationGainMetres != null &&
      route.elevationLossMetres != null &&
      route.maxElevationMetres != null &&
      route.minElevationMetres != null
      ? {
          gainMetres: route.elevationGainMetres,
          lossMetres: route.elevationLossMetres,
          maxMetres: route.maxElevationMetres,
          minMetres: route.minElevationMetres,
        }
      : null,
  );
  // Aligned 1:1 with `points` — dropped whenever the point count changes
  // for any reason other than a fresh import (which sets a matching one of
  // its own right after), since a stale-length profile would mislabel the
  // chart. Untouched by a plain drag, which only moves a point without
  // changing how many there are.
  const [elevationProfile, setElevationProfile] = useState<number[] | null>(
    route?.elevationProfile ?? null,
  );
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
      {/* Set from a GPX import (see route-editor.tsx's onImport) and stored
          as submitted — not recalculated server-side, since it describes
          the original recording, not necessarily today's plan-view line. */}
      {elevation ? (
        <>
          <input name="elevationGainMetres" type="hidden" value={elevation.gainMetres} />
          <input name="elevationLossMetres" type="hidden" value={elevation.lossMetres} />
          <input name="maxElevationMetres" type="hidden" value={elevation.maxMetres} />
          <input name="minElevationMetres" type="hidden" value={elevation.minMetres} />
        </>
      ) : null}
      {/* One sample per point in `points` above, for the elevation-profile
          chart — see the comment on WalkRoute.elevationProfile. */}
      {elevationProfile ? (
        <input name="elevationProfile" type="hidden" value={JSON.stringify(elevationProfile)} />
      ) : null}

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

      <div className="flex max-w-xs flex-col gap-2">
        <Label htmlFor="difficulty">
          Difficulty <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        {/* Radix Select, so its value needs carrying into the form data by
            hand — same pattern as walk-route-picker.tsx's route dropdown. */}
        <input
          name="difficulty"
          type="hidden"
          value={difficulty === NO_DIFFICULTY ? "" : difficulty}
        />
        <Select onValueChange={setDifficulty} value={difficulty}>
          <SelectTrigger id="difficulty">
            <SelectValue placeholder="Not set" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_DIFFICULTY}>Not set</SelectItem>
            {DIFFICULTIES.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Nothing in a drawn line or an imported file says how hard a walk actually is for this
          group — set it from what you know.
        </p>
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
              On save, matches these points onto real paths and recalculates the distance from
              that — mainly useful after dragging the start or finish of an older, hand-drawn
              route. Turn off to save the line exactly as it is. A GPX import always turns this
              off itself, since a real trace is already the true path.
            </span>
          </Label>
        </div>
      ) : null}

      <RouteEditor
        elevation={elevation}
        onChange={(next) => {
          // A changed point count (dragging never changes it) means
          // whatever profile is held no longer lines up index-for-index —
          // drop it. A fresh import corrects this right after, in the same
          // batch, since it calls onChange then onImport in one go.
          if (next.length !== points.length) setElevationProfile(null);
          setPoints(next);
          if (next.length === 0) setElevation(null);
        }}
        onImport={({ elevation: imported, elevationProfile: importedProfile }) => {
          setSnap(false);
          setElevation(imported);
          setElevationProfile(importedProfile);
        }}
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
