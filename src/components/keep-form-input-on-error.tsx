"use client";

import { useEffect } from "react";

type Saved = { name: string; value: string; checked?: boolean };

/** Fields worth putting back: what someone typed or picked — not hidden
 * plumbing, files, buttons or passwords. */
function keepable(el: Element): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return !!el.name;
  if (!(el instanceof HTMLInputElement) || !el.name) return false;
  return !["hidden", "file", "submit", "button", "reset", "image", "password"].includes(el.type);
}

/**
 * React empties a form after every send — even when the answer is an error
 * like "Message needs to be at least 10 characters", so everything typed was
 * lost. This remembers each form's entries as it's sent and, if the form
 * then shows its error box (FormError, role="alert"), puts them back. A
 * successful send still clears the form as before. One place, so every form
 * on the site behaves the same.
 */
export function KeepFormInputOnError() {
  useEffect(() => {
    const saved = new WeakMap<HTMLFormElement, Saved[]>();

    // Capture phase: runs before React handles the send.
    const onSubmit = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const entries: Saved[] = [];
      for (const el of form.elements) {
        if (!keepable(el)) continue;
        if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
          entries.push({ name: el.name, value: el.value, checked: el.checked });
        } else {
          entries.push({ name: el.name, value: el.value });
        }
      }
      saved.set(form, entries);
    };

    const restore = (form: HTMLFormElement, entries: Saved[]) => {
      const fields = [...form.elements].filter(keepable);
      for (const entry of entries) {
        for (const el of fields) {
          if (el.name !== entry.name) continue;
          if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
            if (el.value === entry.value) el.checked = !!entry.checked;
          } else {
            el.value = entry.value;
          }
        }
      }
    };

    const onReset = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const entries = saved.get(form);
      if (!entries) return;
      // The error box is drawn in the same update as the reset; look once
      // the browser has finished it.
      requestAnimationFrame(() => {
        if (form.querySelector('[role="alert"]')) restore(form, entries);
        else saved.delete(form);
      });
    };

    document.addEventListener("submit", onSubmit, true);
    document.addEventListener("reset", onReset, true);
    return () => {
      document.removeEventListener("submit", onSubmit, true);
      document.removeEventListener("reset", onReset, true);
    };
  }, []);

  return null;
}
