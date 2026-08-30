import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Server action errors were toast-only: a message that appears for a couple
 * of seconds and then is gone, with no trace left in the form itself. That's
 * invisible to anyone who missed the toast — including screen reader users,
 * since a `sonner` toast isn't reliably announced the way an in-page
 * `role="alert"` region is. This renders the same message inline, next to
 * the form it belongs to, and keeps it up for as long as the error stands.
 */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <Alert variant="destructive">
      <CircleAlert />
      <AlertDescription className="text-destructive">{message}</AlertDescription>
    </Alert>
  );
}
