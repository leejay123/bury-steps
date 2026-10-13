/**
 * Whether a saved walk page design (Puck data) uses a block anywhere, in
 * columns, tabs and other blocks included — e.g. a design with its own Back
 * link block doesn't get the fixed one above it.
 */
export function designHasBlock(design: unknown, type: string): boolean {
  if (!design || typeof design !== "object") return false;
  return JSON.stringify(design).includes(`"type":${JSON.stringify(type)}`);
}

/** Whether a designed walk page draws its own Back link (a page with no saved design uses a ready-made one, which does). */
export function designHasBackLink(design: unknown): boolean {
  const saved =
    typeof design === "object" &&
    design !== null &&
    Array.isArray((design as { content?: unknown }).content);
  return !saved || designHasBlock(design, "BackLink");
}
