// Single import path for everything a template needs, so adding a template
// never means guessing which of layout.tsx/brand.ts a given export lives in.
export { EmailLayout, EmailText, EmailParagraphs, EmailFact, EmailButton } from "./layout";
export type { EmailBrand } from "./brand";
