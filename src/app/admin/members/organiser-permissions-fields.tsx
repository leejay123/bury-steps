"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ORGANISER_PERMISSION_OPTIONS, type OrganiserPermissions } from "@/lib/organiser-permissions";

/**
 * Shared "what can they do" checklist — used both when inviting/promoting
 * someone (MemberRoleButton) and when editing an existing organiser's
 * permissions later (EditPermissionsButton). Each row's Checkbox carries
 * its own `name` so it submits with the form like any other checkbox
 * (absent when unchecked — see readOrganiserPermissions); "Full access" is
 * a pure UI convenience for ticking or clearing every row at once and
 * isn't itself a form field.
 */
export function OrganiserPermissionFields({
  disabled,
  onChange,
  permissions,
}: {
  disabled?: boolean;
  onChange: (next: OrganiserPermissions) => void;
  permissions: OrganiserPermissions;
}) {
  const values = ORGANISER_PERMISSION_OPTIONS.map((option) => permissions[option.name]);
  const allChecked = values.every(Boolean);
  const noneChecked = values.every((value) => !value);
  const masterState: boolean | "indeterminate" = allChecked
    ? true
    : noneChecked
      ? false
      : "indeterminate";

  function setAll(value: boolean) {
    const next = { ...permissions };
    for (const option of ORGANISER_PERMISSION_OPTIONS) next[option.name] = value;
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3 rounded-lg border bg-muted/30 px-4 py-3.5">
        <Checkbox
          checked={masterState}
          className="mt-0.5"
          disabled={disabled}
          id="perm-full-access"
          onCheckedChange={(checked) => setAll(checked === true)}
        />
        <Label className="flex flex-col items-start gap-0.5 font-normal" htmlFor="perm-full-access">
          <span className="text-sm font-medium">Full access</span>
          <span className="text-sm text-muted-foreground">
            Everything below, and anything added later.
          </span>
        </Label>
      </div>
      <div className="flex flex-col divide-y rounded-xl border">
        {ORGANISER_PERMISSION_OPTIONS.map((option) => (
          <div className="flex items-start gap-3 px-4 py-3.5" key={option.name}>
            <Checkbox
              checked={permissions[option.name]}
              className="mt-0.5"
              disabled={disabled}
              id={`perm-${option.name}`}
              name={option.name}
              onCheckedChange={(checked) =>
                onChange({ ...permissions, [option.name]: checked === true })
              }
            />
            <Label
              className="flex flex-col items-start gap-0.5 font-normal"
              htmlFor={`perm-${option.name}`}
            >
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-sm text-muted-foreground">{option.hint}</span>
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}
