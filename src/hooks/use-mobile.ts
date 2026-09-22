import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

// useSyncExternalStore, not useState+useEffect: matches the same
// media-query pattern already used for Drawer's useIsDesktop (see
// @/components/ui/drawer) — reading matchMedia synchronously in the
// snapshot function instead of setState-ing it from an effect body.
function subscribeToMobileQuery(onChange: () => void) {
  const media = window.matchMedia(MOBILE_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribeToMobileQuery,
    () => window.matchMedia(MOBILE_QUERY).matches,
    // No matchMedia on the server — default to desktop so hydration agrees.
    () => false,
  );
}
