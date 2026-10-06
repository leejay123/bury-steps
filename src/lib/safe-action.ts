import { createSafeActionClient, flattenValidationErrors } from "next-safe-action";
import { z, type ZodTypeAny } from "zod";
import { requireAdmin, requireUser } from "@/lib/auth";
import { ACTION_GENERIC_ERROR, actionErrorMessage } from "@/lib/action-errors";
import type { ActionResult } from "@/server/actions/shared";

/**
 * Every save goes through one of these clients. The zod schema runs before
 * the handler, so a form that doesn't match never reaches the database.
 * Member and organiser clients also sign the person in before the handler.
 */
export const actionClient = createSafeActionClient({
  handleServerError(error) {
    console.error("[save]", error);
    return actionErrorMessage(error);
  },
});

export const memberActionClient = actionClient.use(async ({ next }) => {
  const user = await requireUser();
  return next({ ctx: { user } });
});

export const organiserActionClient = actionClient.use(async ({ next }) => {
  const user = await requireAdmin();
  return next({ ctx: { user } });
});

export type SaveGate = "public" | "member" | "organiser";

function clientFor(gate: SaveGate) {
  if (gate === "member") return memberActionClient;
  if (gate === "organiser") return organiserActionClient;
  return actionClient;
}

function validationMessage(errors: unknown): string {
  const flat = flattenValidationErrors(
    errors as Parameters<typeof flattenValidationErrors>[0],
  );
  const field = Object.values(flat.fieldErrors).flat().find((message) => message);
  return field || flat.formErrors[0] || "Check the form and try again.";
}

type SafeResult<T> = {
  data?: T;
  serverError?: string;
  validationErrors?: unknown;
} | undefined;

function unwrap(result: SafeResult<ActionResult>): ActionResult {
  if (!result) return { ok: false, error: ACTION_GENERIC_ERROR };
  if (result.validationErrors) return { ok: false, error: validationMessage(result.validationErrors) };
  if (result.serverError) return { ok: false, error: String(result.serverError) };
  if (result.data) return result.data;
  return { ok: false, error: ACTION_GENERIC_ERROR };
}

/**
 * Wraps a form save. `read` pulls the fields, the schema checks them, and
 * only then does `execute` run. The returned function keeps the
 * (previous state, form data) shape the forms and tests already use.
 */
export function guardForm<S extends ZodTypeAny>(
  gate: SaveGate,
  schema: S,
  read: (formData: FormData) => z.input<S>,
  execute: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>,
) {
  return async function save(prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
    const safe = clientFor(gate)
      .schema(schema)
      .action(async () => execute(prev, formData));
    return unwrap(await safe(read(formData)));
  };
}

/** A save that takes a value rather than form data (an id, or a list of ids). */
export function guardArgs<S extends ZodTypeAny>(
  gate: SaveGate,
  schema: S,
  execute: (input: z.output<S>) => Promise<ActionResult>,
) {
  const safe = clientFor(gate)
    .schema(schema)
    .action(async ({ parsedInput }) => execute(parsedInput));
  return async (input: z.input<S>): Promise<ActionResult> => unwrap(await safe(input));
}

/** A save with no arguments, such as "mark all notices read". */
const noArgs = z.object({});

export function guardCall(gate: SaveGate, execute: () => Promise<ActionResult>) {
  const safe = clientFor(gate)
    .schema(noArgs)
    .action(async () => execute());
  return async (): Promise<ActionResult> => unwrap(await safe({}));
}
