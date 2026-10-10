import fs from "node:fs";
import path from "node:path";
import { createSerwistRoute } from "@serwist/turbopack";

/**
 * Writes the service worker (offline page + walk alerts) to
 * public/serwist/sw.js once, after `next build`, so it is a plain file.
 *
 * It used to be a Route Handler that Vercel pre-built, but every
 * revalidatePath("/", "layout") after an admin save marked it stale too, and
 * rebuilding it on the live server failed (Serwist needs next.config, the
 * source file and esbuild, none of which are deployed). Visitors kept the old
 * copy, but each save filled the logs with "Cannot find module
 * next/dist/server/config.js". A file in public/ is never revalidated.
 *
 * Uses Serwist's own route code to build it, so the file is the same as before.
 * `npm run dev` runs this with NODE_ENV=development (no precache list).
 */
const outDir = path.join(process.cwd(), "public", "serwist");
// Start clean: the precache list includes public/**, so an old copy would list itself.
fs.rmSync(outDir, { recursive: true, force: true });

const revision = process.env.VERCEL_GIT_COMMIT_SHA ?? "local";
const { GET } = createSerwistRoute({
  additionalPrecacheEntries: [{ url: "/offline", revision }],
  swSrc: "src/sw.ts",
  useNativeEsbuild: true,
});

fs.mkdirSync(outDir, { recursive: true });
for (const file of ["sw.js", "sw.js.map"]) {
  const response = await GET(new Request("http://localhost/"), { params: Promise.resolve({ path: file }) });
  const body = await response.text();
  if (!body) throw new Error(`Service worker build produced an empty ${file}`);
  fs.writeFileSync(path.join(outDir, file), body);
}
console.log("Service worker written to public/serwist/sw.js");
