"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { setRolePermissions, type ActionResult } from "@/server/actions";
import { useActionToast } from "@/hooks/use-action-toast";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ORGANISER_PERMISSION_OPTIONS,
  hasFullAccess,
  type OrganiserPermissions,
} from "@/lib/organiser-permissions";
import { SettingsSectionGroup } from "../settings-page";

const GROUPS: ("Walks" | "Core" | "Settings & homepage")[] = ["Walks", "Core", "Settings & homepage"];

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={disabled || pending} type="submit">
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

export function RolePermissionsForm({ permissions }: { permissions: OrganiserPermissions }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(setRolePermissions, null);
  const [current, setCurrent] = useState(permissions);
  useActionToast(state);
  useResetOnChange([permissions], () => setCurrent(permissions));

  const dirty = useMemo(
    () => ORGANISER_PERMISSION_OPTIONS.some((option) => current[option.name] !== permissions[option.name]),
    [current, permissions],
  );

  function setAll(value: boolean) {
    const next = { ...current };
    for (const option of ORGANISER_PERMISSION_OPTIONS) next[option.name] = value;
    setCurrent(next);
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {hasFullAccess(current) ? "Full access — everything below is on." : "Tick what organisers can do."}
        </p>
        <div className="flex gap-2">
          <Button onClick={() => setAll(true)} size="sm" type="button" variant="outline">
            Select all
          </Button>
          <Button onClick={() => setAll(false)} size="sm" type="button" variant="outline">
            Clear all
          </Button>
        </div>
      </div>

      {GROUPS.map((group) => {
        const options = ORGANISER_PERMISSION_OPTIONS.filter((option) => option.group === group);
        return (
          <SettingsSectionGroup key={group} title={group}>
            {options.map((option) => (
              <div
                className="flex items-start justify-between gap-4 bg-card px-4 py-3.5 first:rounded-t-xl last:rounded-b-xl"
                key={option.name}
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <Label className="font-medium" htmlFor={`role-${option.name}`}>
                    {option.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{option.hint}</p>
                </div>
                <Checkbox
                  checked={current[option.name]}
                  className="mt-0.5 shrink-0"
                  id={`role-${option.name}`}
                  name={option.name}
                  onCheckedChange={(value) =>
                    setCurrent((prev) => ({ ...prev, [option.name]: value === true }))
                  }
                />
              </div>
            ))}
          </SettingsSectionGroup>
        );
      })}

      <FormError message={state && !state.ok ? state.error : null} />
      <div className="flex flex-wrap gap-2">
        <Submit disabled={!dirty} />
        {dirty ? (
          <Button onClick={() => setCurrent(permissions)} type="button" variant="outline">
            Discard
          </Button>
        ) : null}
      </div>
    </form>
  );
}
