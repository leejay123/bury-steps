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
 */
export function FocusRescue() {
  useEffect(() => {
    let last: { el: HTMLElement; ancestors: HTMLElement[]; path: string } | null = null;
    let lastOnPage: HTMLElement | null = null;
    let scheduled = false;

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

    function rescue() {
      scheduled = false;
      const lost = last;
      if (!lost || lost.el.isConnected) return;
      last = null;
      const active = document.activeElement;
      if ((active && active !== document.body) || location.pathname !== lost.path) return;
      for (const ancestor of lost.ancestors) {
        if (!ancestor.isConnected || ancestor === document.documentElement) continue;
        const target = [...ancestor.querySelectorAll<HTMLElement>(FOCUSABLE)].find(
          (node) => node.getClientRects().length > 0 && !node.closest(OVERLAY),
        );
        if (target) {
          target.focus({ preventScroll: true });
          return;
        }
      }
      if (lastOnPage?.isConnected && lastOnPage.getClientRects().length > 0) {
        lastOnPage.focus({ preventScroll: true });
      }
    }

    const observer = new MutationObserver(() => {
      if (scheduled || !last || last.el.isConnected) return;
      scheduled = true;
      requestAnimationFrame(rescue);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("focusin", onFocusIn);
    return () => {
      observer.disconnect();
      document.removeEventListener("focusin", onFocusIn);
    };
  }, []);

  return null;
}
