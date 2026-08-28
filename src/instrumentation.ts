/**
 * Runs once when a new Next.js server instance boots (dev, `next start`, or
 * a Vercel serverless function's cold start) — not during `next build`.
 * See src/lib/env.ts for what's actually being checked and why.
 */
export async function register() {
  const { validateEnv } = await import("@/lib/env");
  validateEnv();
}
