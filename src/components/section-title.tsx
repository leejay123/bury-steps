"use client";

import { createContext, useContext, type ReactNode } from "react";
import { TextReveal } from "@/components/velora/text-reveal";

const TitleRevealContext = createContext(false);

/** Turns on the word-by-word reveal for section titles inside it
 * (Settings → Homepage layout → "Animate section titles"). */
export function TitleRevealProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return <TitleRevealContext value={enabled}>{children}</TitleRevealContext>;
}

/** A section's h2: Velora's Text Reveal when switched on, plain text otherwise. */
export function SectionTitle({ text, className }: { text: string; className: string }) {
  const reveal = useContext(TitleRevealContext);
  if (reveal) return <TextReveal as="h2" className={className} text={text} />;
  return <h2 className={className}>{text}</h2>;
}
