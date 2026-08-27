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
execFileSync(prismaBin, ["migrate", "deploy"], { stdio: "inherit" });
