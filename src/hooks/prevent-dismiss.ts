/**
 * Block X / Escape / overlay dismiss while a save is in flight, without
 * reopening the dialog after a successful close (`setOpen(false)` still
 * fires Radix `onOpenChange(false)` while pending can be true).
 */
export function preventDismissWhilePending(
  isPending: boolean,
  setOpen: (open: boolean) => void,
  onClose?: () => void,
) {
  return (next: boolean) => {
    if (isPending && !next) return;
    setOpen(next);
    if (!next) onClose?.();
  };
}
