"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { setWalkRoute, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE = "none";

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={disabled || pending} size="sm" type="submit">
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function WalkRoutePicker({
  routes,
  selectedRouteId,
  walkId,
}: {
  routes: { id: string; name: string; distanceLabel: string }[];
  selectedRouteId: string | null;
  walkId: string;
}) {
  const saved = selectedRouteId ?? NONE;
  const [value, setValue] = useState(saved);
  const [state, action] = useActionState<ActionResult | null, FormData>(setWalkRoute, null);
  useActionToast(state);

  useResetOnChange([saved], () => setValue(saved));

  const dirty = value !== saved;

  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-base">Walking route</CardTitle>
        <CardDescription>
          Members see the route drawn on a map with its distance. Leave it as none if this walk
          doesn&apos;t follow one of your saved routes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {routes.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">
              You haven&apos;t drawn any routes yet.
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/routes/new">Draw your first route</Link>
            </Button>
          </div>
        ) : (
          <form action={action} className="flex flex-col gap-4">
            <input name="walkId" type="hidden" value={walkId} />
            {/* Select is a Radix component, so its value needs carrying into
                the form data by hand. "none" maps to clearing the route. */}
            <input name="routeId" type="hidden" value={value === NONE ? "" : value} />

            <div className="flex max-w-sm flex-col gap-2">
              <Label htmlFor="walk-route">Route</Label>
              <Select onValueChange={setValue} value={value}>
                <SelectTrigger id="walk-route">
                  <SelectValue placeholder="Choose a route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No route</SelectItem>
                  {routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.name} · {route.distanceLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <FormError message={state && !state.ok ? state.error : null} />

            <div className="flex flex-wrap items-center gap-2">
              <Submit disabled={!dirty} />
              {dirty ? (
                <Button onClick={() => setValue(saved)} size="sm" type="button" variant="outline">
                  Discard
                </Button>
              ) : null}
              <Button asChild size="sm" variant="ghost">
                <Link href="/admin/routes">Manage routes</Link>
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
