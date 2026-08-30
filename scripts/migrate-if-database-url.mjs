import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * Preview deploys may not have DATABASE_URL until it is enabled for Preview in
 * Vercel. Production always has it. Skip migrate rather than failing the build.
 */
if (!process.env.DATABASE_URL?.trim()) {
  console.log("Skipping prisma migrate deploy (DATABASE_URL not set).");
  process.exit(0);
}

const prismaBin = path.join(process.cwd(), "node_modules", ".bin", "prisma");

/** Migrations that failed and were fully rolled back; safe to clear and retry. */
const ROLL_FORWARD_FAILED = ["20260830170000_notice_audience_visitors"];

function migrateDeploy() {
  execFileSync(prismaBin, ["migrate", "deploy"], { stdio: "inherit" });
}

try {
  migrateDeploy();
} catch (firstError) {
  const detail =
    firstError instanceof Error ? `${firstError.message}\n${firstError.stack ?? ""}` : String(firstError);
  // Prisma prints P3009 to stderr via stdio inherit; the thrown Error often
  // only says "Command failed". Always try the known failed migration once.
  let cleared = false;
  for (const name of ROLL_FORWARD_FAILED) {
    console.warn(
      `migrate deploy failed (P3009 likely). Marking ${name} as rolled back, then retrying…`,
    );
    try {
      execFileSync(prismaBin, ["migrate", "resolve", "--rolled-back", name], {
        stdio: "inherit",
      });
      cleared = true;
    } catch {
      // Not in a failed state, or already resolved — keep trying others / retry.
    }
  }
  if (!cleared) throw firstError;
  try {
    migrateDeploy();
  } catch (secondError) {
    console.error(detail);
    throw secondError;
  }
}
