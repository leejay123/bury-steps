/**
 * Story photos in Supabase Storage: a private bucket, reached with the
 * project's secret key (server only), so a photo is only ever shown through a
 * short-lived signed link handed to a signed-in person. The same requests
 * supabase-js makes (StorageFileApi), without the library.
 */
export const STORY_BUCKET = "stories";
/** Signed links last an hour: plenty to watch, useless if shared later. */
const SIGNED_LINK_SECONDS = 60 * 60;
/** The largest photo the bucket takes (they're shrunk on the phone first). */
const MAX_BYTES = 1_500_000;

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { base: `${url.replace(/\/$/, "")}/storage/v1`, key };
}

/** Whether Stories can be used here (the two Supabase settings are set). */
export function storiesConfigured(): boolean {
  return config() !== null;
}

async function storage(path: string, init: RequestInit = {}) {
  const c = config();
  if (!c) throw new Error("Stories storage isn't set up.");
  return fetch(`${c.base}${path}`, {
    ...init,
    cache: "no-store",
    headers: { apikey: c.key, Authorization: `Bearer ${c.key}`, ...init.headers },
  });
}

let bucketReady = false;
/** Makes the private "stories" bucket the first time it's needed. */
async function ensureBucket() {
  if (bucketReady) return;
  const res = await storage("/bucket", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      id: STORY_BUCKET,
      name: STORY_BUCKET,
      public: false,
      file_size_limit: MAX_BYTES,
      allowed_mime_types: ["image/jpeg", "image/webp", "image/png"],
    }),
  });
  // Already there (409, or 400 "already exists") is fine.
  if (!res.ok && res.status !== 409) {
    const text = await res.text();
    if (!/exist/i.test(text)) throw new Error(`Couldn't set up story storage (${res.status}).`);
  }
  bucketReady = true;
}

export async function uploadStoryPhoto(path: string, body: Blob, contentType: string) {
  await ensureBucket();
  const res = await storage(`/object/${STORY_BUCKET}/${path}`, {
    method: "POST",
    headers: { "content-type": contentType, "cache-control": "max-age=3600", "x-upsert": "false" },
    body,
  });
  if (!res.ok) throw new Error(`The photo didn't upload (${res.status}).`);
}

/** Signed links for many photos at once: path → link (missing ones left out). */
export async function signStoryPhotos(paths: string[]): Promise<Map<string, string>> {
  const links = new Map<string, string>();
  if (paths.length === 0) return links;
  const c = config();
  if (!c) return links;
  const res = await storage(`/object/sign/${STORY_BUCKET}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ expiresIn: SIGNED_LINK_SECONDS, paths }),
  });
  if (!res.ok) return links;
  const data = (await res.json()) as { path?: string; signedURL?: string | null; error?: string | null }[];
  for (const item of data) {
    if (item.path && item.signedURL) links.set(item.path, encodeURI(`${c.base}${item.signedURL}`));
  }
  return links;
}

/** Deletes photos (frees their space). Best effort: a failure is retried by the daily sweep. */
export async function removeStoryPhotos(paths: string[]) {
  if (paths.length === 0) return;
  await storage(`/object/${STORY_BUCKET}`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prefixes: paths }),
  }).catch(() => undefined);
}

/**
 * Every photo in the bucket older than `olderThan` (the daily sweep's safety
 * net: photos whose story row is already gone, e.g. a removed account).
 * Photos sit in one folder per person.
 */
export async function listOldStoryPhotos(olderThan: Date): Promise<string[]> {
  const list = async (prefix: string) => {
    const res = await storage(`/object/list/${STORY_BUCKET}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prefix, limit: 1000, offset: 0 }),
    });
    if (!res.ok) return [];
    return (await res.json()) as { name: string; id: string | null; created_at?: string | null }[];
  };
  const old: string[] = [];
  for (const folder of await list("")) {
    if (folder.id) continue; // a file at the top (shouldn't happen)
    for (const file of await list(folder.name)) {
      if (file.id && file.created_at && new Date(file.created_at) < olderThan)
        old.push(`${folder.name}/${file.name}`);
    }
  }
  return old;
}
