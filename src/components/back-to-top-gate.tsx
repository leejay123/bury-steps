import { BackToTop } from "@/components/back-to-top";

/**
 * Split out from the root layout so this floating button can't hold up the
 * first byte of every page. Always on — the old Site behaviour switch was
 * removed.
 */
export async function BackToTopGate() {
  return <BackToTop />;
}
