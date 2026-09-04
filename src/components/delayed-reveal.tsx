/**
 * Wraps a loading.tsx fallback so it only becomes visible if the page is
 * still loading after DELAY_MS — most navigations resolve faster than that
 * (especially a prefetched one) and never show anything at all, rather than
 * flashing a skeleton for a moment before the real content replaces it.
 *
 * Pure CSS (an animation-delay that flips opacity from 0 to 1), so this
 * needs no client JS and works the same whether the fallback is server- or
 * client-rendered. If the real page finishes first, React unmounts this
 * before the delay ever elapses — nothing to clean up, no timer to cancel.
 */
const DELAY_MS = 250;

export function DelayedReveal({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="opacity-0"
      style={{ animation: `delayed-reveal 0s ${DELAY_MS}ms forwards` }}
    >
      {children}
    </div>
  );
}
