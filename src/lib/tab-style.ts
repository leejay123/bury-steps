/**
 * How every tab bar on the site looks (Settings → Site behaviour → Tabs):
 * "standard" is the grey pill; "underline" is the shadcn-space tabs-05
 * look — a line under the chosen tab that slides to the next one, and the
 * new tab's content sliding in from the side it was picked on; "transition"
 * is pills (the chosen one filled in) whose content drops in from above,
 * sharpening from a slight blur.
 */
export type TabStyle = "standard" | "underline" | "transition";

export function parseTabStyle(value: string | null | undefined): TabStyle {
  return value === "underline" || value === "transition" ? value : "standard";
}
