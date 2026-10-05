"use client";

import { useEffect } from "react";

// Menus, dialogs, drawers and popovers: focus inside one of these isn't
// "on the page" for working out where to go back to.
const OVERLAY = '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [data-radix-popper-content-wrapper]';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * When a save swaps out the very control that had keyboard focus — Cancel
 * walk turning into Reopen walk, the row of someone just removed, a deleted
 * journey entry — the browser drops focus back to the top of the page, and
 * a keyboard or screen reader user has to find their way back from the
 * header. This moves focus to the nearest control in the same part of the
 * page instead. Page changes are left alone, as is anything that has
 * already put focus somewhere itself.
 *
 * When what disappeared was a menu or dialog (its whole content goes), focus
 * goes back to the last control used on the page itself — the "⋯" button
 * that opened a menu, say, whose dialog's own hidden trigger can't take it.
 *
 * A focused button that switches itself off (a Save that's busy, or has
 * nothing left to save) drops focus the same way. Focus moves to the
 * nearest control beside it straight away, and back to the button if it
 * comes back on shortly (the end of a save).
 */
export function FocusRescue() {
  useEffect(() => {
    let last: { el: HTMLElement; ancestors: HTMLElement[]; path: string } | null = null;
    let lastOnPage: HTMLElement | null = null;
    let scheduled = false;
    // Only for keyboard use: that's who is stranded at the top of the page,
    // and moving focus into a text box after a mouse click would light up
    // its focus ring for no reason.
    let viaKeyboard = false;
    const onKeyDown = () => {
      viaKeyboard = true;
    };
    const onPointerDown = () => {
      viaKeyboard = false;
    };

    function onFocusIn(event: FocusEvent) {
      const el = event.target;
      if (!(el instanceof HTMLElement)) return;
      if (el !== document.body && !el.closest(OVERLAY)) lastOnPage = el;
      const ancestors: HTMLElement[] = [];
      for (let node = el.parentElement; node && node !== document.body && ancestors.length < 8; node = node.parentElement) {
        ancestors.push(node);
      }
      last = { el, ancestors, path: location.pathname };
    }

    const isOff = (el: HTMLElement) => (el as HTMLButtonElement).disabled === true;
    const focusIsLost = () => !document.activeElement || document.activeElement === document.body;

    function rescue() {
      scheduled = false;
      const lost = last;
      if (!lost || (lost.el.isConnected && !isOff(lost.el))) return;
      if (!viaKeyboard || !focusIsLost() || location.pathname !== lost.path) return;
      last = null;
      const stand = focusNear(lost);
      if (lost.el.isConnected && stand) waitForReturn(lost.el, stand);
    }

    // Switched off: if it comes back on while focus is still where we put
    // it (nobody has moved on), hand focus back to it.
    function waitForReturn(button: HTMLElement, stand: HTMLElement, tries = 0) {
      window.setTimeout(() => {
        if (document.activeElement !== stand || !button.isConnected) return;
        if (!isOff(button)) button.focus({ preventScroll: true });
        else if (tries < 20) waitForReturn(button, stand, tries + 1);
      }, 100);
    }

    /** Focuses the nearest usable control and returns it (null if none). */
    function focusNear(lost: NonNullable<typeof last>): HTMLElement | null {
      for (const ancestor of lost.ancestors) {
        if (!ancestor.isConnected || ancestor === document.documentElement) continue;
        const target = [...ancestor.querySelectorAll<HTMLElement>(FOCUSABLE)].find(
          (node) => node !== lost.el && !isOff(node) && node.getClientRects().length > 0 && !node.closest(OVERLAY),
        );
        if (target) {
          target.focus({ preventScroll: true });
          return target;
        }
      }
      if (lastOnPage?.isConnected && lastOnPage !== lost.el && lastOnPage.getClientRects().length > 0) {
        lastOnPage.focus({ preventScroll: true });
        return lastOnPage;
      }
      return null;
    }

    const observer = new MutationObserver(() => {
      if (scheduled || !last || (last.el.isConnected && !isOff(last.el))) return;
      scheduled = true;
      requestAnimationFrame(rescue);
    });
    observer.observe(document.body, { attributeFilter: ["disabled"], childList: true, subtree: true });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      observer.disconnect();
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, []);

  return null;
}
