/**
 * Signing out has to end with the page being loaded afresh.
 *
 * Clerk signs someone out and then only asks Next.js to refresh the page in place. The header
 * (Sign in, or the bell, Dashboard and avatar) lives in the layout every page shares, which the
 * browser keeps between pages — so it went on showing Dashboard until the page was reloaded by
 * hand. A real page load always comes back right, so that is what sign-out now finishes with.
 *
 * The load must wait until Clerk has really ended the session: it tells Clerk's servers first and
 * only then removes its sign-in cookie, so leaving any sooner could cut the sign-out off half way.
 */

/** Whether Clerk's sign-in cookie (`__session`, or `__session_<suffix>`) is in this cookie string. */
export function hasSessionCookie(cookie: string): boolean {
  return /(?:^|;\s*)__session(?:_[^=;]+)?=[^;\s]/.test(cookie);
}

/**
 * Calls `done` once, as soon as the sign-in cookie is gone. Gives up quietly if it never goes
 * (the sign-out failed, or it was not a sign-out at all). Returns a way to stop waiting.
 */
export function onceSignedOut({
  cookie,
  done,
  gaveUp,
  everyMs = 50,
  giveUpAfterMs = 15000,
}: {
  cookie: () => string;
  done: () => void;
  gaveUp?: () => void;
  everyMs?: number;
  giveUpAfterMs?: number;
}): () => void {
  let waited = 0;
  const timer = setInterval(() => {
    waited += everyMs;
    if (!hasSessionCookie(cookie())) {
      clearInterval(timer);
      done();
    } else if (waited >= giveUpAfterMs) {
      clearInterval(timer);
      gaveUp?.();
    }
  }, everyMs);
  return () => clearInterval(timer);
}
