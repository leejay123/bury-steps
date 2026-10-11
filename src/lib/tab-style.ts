/**
 * How every tab bar on the site looks (Settings → Site behaviour → Tabs):
 * "standard" is the grey pill; "underline" is the shadcn-space tabs-05
 * look — a line under the chosen tab that slides to the next one, a soft
 * highlight that follows the pointer, and the new tab's content sliding in
 * from the side it was picked on.
 */
export type TabStyle = "standard" | "underline";

export function parseTabStyle(value: string | null | undefined): TabStyle {
  return value === "underline" ? "underline" : "standard";
}
