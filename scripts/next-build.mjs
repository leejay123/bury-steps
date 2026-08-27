import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * When Preview has no DATABASE_URL, Prisma refuses to run queries and some
 * page data loaders still need a configured URL to initialise. Use a
 * localhost placeholder so `next build` can finish; data loaders already
 * catch connection failures and return empty/fallback content.
 */
if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = "postgresql://build:build@127.0.0.1:1/build";
  console.log("DATABASE_URL unset; using local placeholder for Next.js build.");
}

const nextBin = path.join(process.cwd(), "node_modules", ".bin", "next");
execFileSync(nextBin, ["build"], {
  stdio: "inherit",
  env: process.env,
});
