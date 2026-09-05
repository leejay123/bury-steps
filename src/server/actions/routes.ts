"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { type RoutePoint, routeDistanceMetres, validateRoutePoints } from "@/lib/route-geometry";
import { snapToFootpaths } from "@/lib/route-routing";
import { type PlaceHit, searchPlaces, searchPlacesViaHeigit } from "@/lib/geocode";
import { checkRateLimit } from "@/lib/rate-limit";
import { type ActionResult, isPrismaCode, logActionError, revalidateWalkShare } from "./shared";

const routeDetailsSchema = z.object({
  name: z.string().trim().min(3, "Give the route a name of at least 3 characters.").max(120),
  notes: z.string().trim().max(1000).optional(),
  // Nothing in a drawn line or an imported file says how hard a walk is
  // for this group — set by the organiser, never computed.
  difficulty: z.enum(["EASY", "MODERATE", "HARD"]).nullable().optional(),
});

/** Taller than Everest — past this it's bad data, not a real walk. */
const MAX_PLAUSIBLE_ELEVATION_METRES = 9000;

type ElevationFields = {
  elevationGainMetres: number | null;
  elevationLossMetres: number | null;
  maxElevationMetres: number | null;
  minElevationMetres: number | null;
};

/**
 * Reads the elevation hidden fields the route form submits when a GPX
 * import had a full elevation profile (see route-editor.tsx's onImport).
 * Stored as submitted rather than recalculated — see the comment on
 * WalkRoute.elevationGainMetres in schema.prisma for why that's the right
 * call here, unlike distance. Still sanity-checked: a route with no
 * elevation data at all is fine (most hand-drawn ones), but four numbers
 * that don't parse or land somewhere physically impossible are rejected
 * rather than silently stored.
 */
function readElevation(formData: FormData): ElevationFields | { error: string } {
  const raw = [
    formData.get("elevationGainMetres"),
    formData.get("elevationLossMetres"),
    formData.get("maxElevationMetres"),
    formData.get("minElevationMetres"),
  ];
  if (raw.every((v) => v === null)) {
    return {
      elevationGainMetres: null,
      elevationLossMetres: null,
      maxElevationMetres: null,
      minElevationMetres: null,
    };
  }

  const [gain, loss, max, min] = raw.map(Number);
  const bad =
    [gain, loss, max, min].some((v) => !Number.isFinite(v)) ||
    gain < 0 ||
    loss < 0 ||
    min > max ||
    [gain, loss, max, min].some((v) => Math.abs(v) > MAX_PLAUSIBLE_ELEVATION_METRES);
  if (bad) {
    return { error: "That route's elevation data looks wrong. Try importing the file again." };
  }
  return {
    elevationGainMetres: gain,
    elevationLossMetres: loss,
    maxElevationMetres: max,
    minElevationMetres: min,
  };
}

/**
 * The drawn points arrive as a JSON string in a hidden field so the editor
 * can live inside the ordinary `<form>` the rest of admin uses.
 */
function readPoints(formData: FormData) {
  const raw = formData.get("points");
  if (typeof raw !== "string" || raw.length === 0) {
    return { ok: false as const, error: "Draw the route on the map before saving." };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false as const, error: "That route could not be read. Try drawing it again." };
  }
  return validateRoutePoints(parsed);
}

/**
 * Live search for the route editor's "find a place" box — one free-text
 * field, no separate postcode field to guess into. Prefers HeiGIT's Pelias
 * geocoder (same free key as route snapping, a different service path
 * under the same host) since it's built for type-ahead queries; falls back
 * to the plain Nominatim lookup already used for the meeting-point field
 * when no key is configured, or if the HeiGIT call itself fails.
 */
export async function searchRoutePlaces(
  query: string,
): Promise<{ ok: true; places: PlaceHit[] } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  // Generous limit: this is called on every debounced keystroke, not once
  // per submit like the meeting-point search.
  const limited = checkRateLimit(`${admin.id}:searchRoutePlaces`, 60, 60_000);
  if (!limited.ok) {
    return { ok: false, error: `Too many searches. Try again in ${limited.retryAfterSeconds}s.` };
  }

  const q = query.trim();
  if (!q) return { ok: false, error: "Type a place, postcode, or address first." };
  if (q.length > 200) return { ok: false, error: "Keep the search under 200 characters." };

  const viaHeigit = await searchPlacesViaHeigit(q);
  const places = viaHeigit ?? (await searchPlaces(q, q));
  if (places.length === 0) {
    return { ok: false, error: "Nothing found. Try a fuller name or a postcode." };
  }
  return { ok: true, places };
}

/**
 * Snaps the drawn waypoints onto real footpaths when a maintainer has
 * configured OPENROUTESERVICE_API_KEY, unless the organiser opted out with
 * the form's "snap to real footpaths" checkbox. Falls back to the plain
 * clicked line (today's behaviour) in every other case — see
 * src/lib/route-routing.ts for what "falls back" covers.
 */
async function resolveRouteGeometry(formData: FormData, waypoints: RoutePoint[]) {
  if (formData.get("snap") === "off") {
    return { points: waypoints, distanceMetres: routeDistanceMetres(waypoints), snapped: false };
  }
  return snapToFootpaths(waypoints);
}

function saveMessage(base: string, snapped: boolean, note?: string): string {
  if (snapped) return `${base} Matched to real footpaths.`;
  if (note) return `${base} ${note}`;
  return base;
}

function revalidateRoutes(routeId?: string) {
  revalidatePath("/admin/routes");
  if (routeId) revalidatePath(`/admin/routes/${routeId}`);
  revalidatePath("/admin");
}

/** Every share page showing a walk that uses this route needs rebuilding. */
async function revalidateWalksUsingRoute(routeId: string) {
  const walks = await prisma.walk.findMany({
    where: { routeId },
    select: { token: true, slug: true, id: true },
  });
  for (const walk of walks) {
    revalidateWalkShare(walk);
    revalidatePath(`/admin/walks/${walk.id}`);
  }
}

export async function createRoute(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = routeDetailsSchema.safeParse({
    name: formData.get("name"),
    notes: formData.get("notes") || undefined,
    difficulty: formData.get("difficulty") || null,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const points = readPoints(formData);
  if (!points.ok) return { ok: false, error: points.error };

  const elevation = readElevation(formData);
  if ("error" in elevation) return { ok: false, error: elevation.error };

  try {
    // Distance (and, when configured, the geometry itself) is always
    // recalculated here rather than trusted from the browser — it feeds
    // the route list and anything built on it later.
    const geometry = await resolveRouteGeometry(formData, points.points);
    const route = await prisma.walkRoute.create({
      data: {
        name: parsed.data.name,
        notes: parsed.data.notes ?? null,
        difficulty: parsed.data.difficulty ?? null,
        points: geometry.points as unknown as Prisma.InputJsonValue,
        distanceMetres: geometry.distanceMetres,
        ...elevation,
        createdById: admin.id,
      },
      select: { id: true },
    });
    revalidateRoutes(route.id);
    return {
      ok: true,
      message: saveMessage("Route saved.", geometry.snapped, geometry.note),
      href: "/admin/routes",
    };
  } catch (err) {
    return logActionError("createRoute", err);
  }
}

export async function updateRoute(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "That route could not be found." };
  }

  const parsed = routeDetailsSchema.safeParse({
    name: formData.get("name"),
    notes: formData.get("notes") || undefined,
    difficulty: formData.get("difficulty") || null,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const points = readPoints(formData);
  if (!points.ok) return { ok: false, error: points.error };

  const elevation = readElevation(formData);
  if ("error" in elevation) return { ok: false, error: elevation.error };

  try {
    const geometry = await resolveRouteGeometry(formData, points.points);
    await prisma.walkRoute.update({
      where: { id },
      data: {
        name: parsed.data.name,
        notes: parsed.data.notes ?? null,
        difficulty: parsed.data.difficulty ?? null,
        points: geometry.points as unknown as Prisma.InputJsonValue,
        distanceMetres: geometry.distanceMetres,
        ...elevation,
      },
    });
    revalidateRoutes(id);
    await revalidateWalksUsingRoute(id);
    return { ok: true, message: saveMessage("Route updated.", geometry.snapped, geometry.note) };
  } catch (err) {
    if (isPrismaCode(err, "P2025")) return { ok: false, error: "That route could not be found." };
    return logActionError("updateRoute", err);
  }
}

export async function deleteRoute(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const id = formData.get("id");
  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: "That route could not be found." };
  }

  try {
    // Walks keep their history: the schema sets routeId to null rather than
    // cascading, so deleting a route never deletes a walk or its attendance.
    const affected = await prisma.walk.findMany({ where: { routeId: id }, select: { token: true, slug: true, id: true } });
    await prisma.walkRoute.delete({ where: { id } });
    revalidateRoutes();
    for (const walk of affected) {
      revalidateWalkShare(walk);
      revalidatePath(`/admin/walks/${walk.id}`);
    }
    return {
      ok: true,
      message:
        affected.length > 0
          ? `Route deleted. ${affected.length} ${affected.length === 1 ? "walk" : "walks"} no longer show a map, but nothing else changed.`
          : "Route deleted.",
      href: "/admin/routes",
    };
  } catch (err) {
    if (isPrismaCode(err, "P2025")) return { ok: false, error: "That route could not be found." };
    return logActionError("deleteRoute", err);
  }
}

/** Attach a saved route to a walk, or clear it by passing an empty value. */
export async function setWalkRoute(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const walkId = formData.get("walkId");
  const routeId = formData.get("routeId");
  if (typeof walkId !== "string" || walkId.length === 0) {
    return { ok: false, error: "That walk could not be found." };
  }
  const nextRouteId = typeof routeId === "string" && routeId.length > 0 ? routeId : null;

  try {
    const walk = await prisma.walk.update({
      where: { id: walkId },
      data: { routeId: nextRouteId },
      select: { id: true, token: true, slug: true },
    });
    revalidateWalkShare(walk);
    revalidatePath(`/admin/walks/${walk.id}`);
    return { ok: true, message: nextRouteId ? "Route added to this walk." : "Route removed from this walk." };
  } catch (err) {
    if (isPrismaCode(err, "P2025")) return { ok: false, error: "That walk could not be found." };
    if (isPrismaCode(err, "P2003")) return { ok: false, error: "That route could not be found." };
    return logActionError("setWalkRoute", err);
  }
}
