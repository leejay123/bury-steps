export const ACTION_GENERIC_ERROR = "Something went wrong. Try again.";

export const ACTION_NETWORK_ERROR =
  "Could not reach the server. Check your connection and try again.";

/** True when the browser likely lost connectivity or the request never completed. */
export function isLikelyNetworkError(err: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  if (err instanceof TypeError) {
    const message = err.message.toLowerCase();
    return (
      message.includes("failed to fetch") ||
      message.includes("network") ||
      message.includes("load failed")
    );
  }
  if (err instanceof Error) {
    const message = err.message.toLowerCase();
    return (
      message.includes("failed to fetch") ||
      message.includes("networkerror") ||
      message.includes("network request failed") ||
      message.includes("load failed")
    );
  }
  return false;
}

/** User-facing message for a thrown client/server-action error. */
export function actionErrorMessage(
  err: unknown,
  fallback: string = ACTION_GENERIC_ERROR,
): string {
  if (isLikelyNetworkError(err)) return ACTION_NETWORK_ERROR;
  if (typeof err === "string" && err.trim()) return err.trim();
  return fallback;
}

/** User-facing message for a structured action failure result. */
export function actionResultErrorMessage(
  error: string | undefined | null,
  fallback: string = ACTION_GENERIC_ERROR,
): string {
  const trimmed = error?.trim();
  return trimmed || fallback;
}

type ServerActionResult = { ok: true; message?: string; href?: string } | { ok: false; error: string };

type ServerAction = (
  prev: ServerActionResult | null,
  formData: FormData,
) => Promise<ServerActionResult>;

/** Catch network/action throws and return a structured failure instead. */
export function safeServerAction<T extends ServerAction>(
  action: T,
  fallback: string = ACTION_GENERIC_ERROR,
): T {
  return (async (prev, formData) => {
    try {
      return await action(prev, formData);
    } catch (err) {
      return { ok: false as const, error: actionErrorMessage(err, fallback) };
    }
  }) as T;
}
