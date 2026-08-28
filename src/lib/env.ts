/**
 * Startup environment validation. Run once per server instance from
 * `instrumentation.ts`'s `register()`, which fires when a server actually
 * boots (dev, `next start`, or a Vercel function's cold start) — never
 * during `next build`, so this can't break a build that intentionally runs
 * without a real `DATABASE_URL` (see scripts/next-build.mjs).
 *
 * Without this, a missing Clerk key or `DATABASE_URL` used to fail late and
 * quietly: the app would boot fine and only blow up on the first request
 * that actually touches auth or the database, with an error buried in
 * per-request logs instead of a clear message at boot.
 */

type EnvCheck = { name: string; hint: string };

const REQUIRED: EnvCheck[] = [
  { name: "DATABASE_URL", hint: "Supabase → Connect → Session pooler connection string." },
  {
    name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    hint: "Clerk dashboard → your app → API Keys (starts with pk_).",
  },
  { name: "CLERK_SECRET_KEY", hint: "Clerk dashboard → your app → API Keys (starts with sk_)." },
];

const RECOMMENDED: EnvCheck[] = [
  {
    name: "CRON_SECRET",
    hint: "Without it the nightly health-note purge cron is unauthenticated and never runs.",
  },
  {
    name: "INITIAL_ADMIN_EMAIL",
    hint: "Without it, the first person to sign up against an empty database becomes admin.",
  },
];

function isSet(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

/**
 * Vercel Preview deployments may intentionally run without `DATABASE_URL`
 * until it's enabled for Preview in the dashboard — the build script already
 * accounts for this, so it's a warning here too, not a hard failure.
 */
export function validateEnv(): void {
  const isPreview = process.env.VERCEL_ENV === "preview";
  const isProductionRuntime = process.env.NODE_ENV === "production" && !isPreview;

  const missingRequired = REQUIRED.filter((check) => !isSet(check.name));
  const missingRecommended = RECOMMENDED.filter((check) => !isSet(check.name));

  for (const check of missingRecommended) {
    console.warn(`[env] ${check.name} is not set. ${check.hint}`);
  }

  if (missingRequired.length === 0) return;

  const message =
    `Missing required environment variable(s): ${missingRequired.map((c) => c.name).join(", ")}. ` +
    missingRequired.map((c) => c.hint).join(" ");

  if (isProductionRuntime) {
    // Crash the boot immediately with one clear message instead of letting
    // every page render hit its own Prisma/Clerk error one request at a time.
    throw new Error(`[env] ${message}`);
  }

  console.error(`[env] ${message}`);
}
