import { describe, expect, it, vi, beforeEach } from "vitest";
import type { RateLimitResult } from "@/lib/rate-limit";
import type { PlaceHit } from "@/lib/geocode";

const {
  revalidatePath,
  requireAdmin,
  checkRateLimit,
  allocateWalkSlug,
  geocodeFields,
  searchPlaces,
  isWalkScheduleLocked,
  isWalkStartInThePast,
  walkStatus,
  prismaMock,
  transaction,
} = vi.hoisted(() => {
  const prismaMock: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {
    walk: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), findUnique: vi.fn() },
  };
  const transaction = vi.fn(async (arg: unknown) => {
    if (Array.isArray(arg)) return Promise.all(arg);
    // cancelWalk uses withCountLimitLock, which locks via $executeRawUnsafe
    // before invoking the callback.
    return (arg as (tx: unknown) => unknown)({ $executeRawUnsafe: vi.fn(), ...prismaMock });
  });
  return {
    revalidatePath: vi.fn(),
    requireAdmin: vi.fn(),
    checkRateLimit: vi.fn((): RateLimitResult => ({ ok: true })),
    allocateWalkSlug: vi.fn(async () => "sunday-stroll"),
    geocodeFields: vi.fn(async () => ({ latitude: null, longitude: null })),
    searchPlaces: vi.fn(async (): Promise<PlaceHit[]> => []),
    isWalkScheduleLocked: vi.fn(() => false),
    isWalkStartInThePast: vi.fn(() => false),
    walkStatus: vi.fn(() => "upcoming"),
    prismaMock,
    transaction,
  };
});

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/db", () => ({ prisma: { ...prismaMock, $transaction: transaction } }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit }));
vi.mock("@/lib/walk-slug", () => ({ allocateWalkSlug }));
vi.mock("@/lib/walk-window", async () => {
  const actual = await vi.importActual<typeof import("@/lib/walk-window")>("@/lib/walk-window");
  return { ...actual, isWalkScheduleLocked, isWalkStartInThePast, walkStatus };
});
vi.mock("@/lib/geocode", async () => {
  const actual = await vi.importActual<typeof import("@/lib/geocode")>("@/lib/geocode");
  return { ...actual, geocodeFields, searchPlaces };
});
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAdmin };
});

import { cancelWalk, deleteWalk, duplicateWalk, reopenWalk, searchWalkPlaces, updateWalk } from "./walks";

const ADMIN = { id: "admin-1" };

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdmin.mockResolvedValue(ADMIN);
  checkRateLimit.mockReturnValue({ ok: true });
  allocateWalkSlug.mockResolvedValue("sunday-stroll");
  geocodeFields.mockResolvedValue({ latitude: null, longitude: null });
  isWalkScheduleLocked.mockReturnValue(false);
  isWalkStartInThePast.mockReturnValue(false);
  walkStatus.mockReturnValue("upcoming");
});

describe("duplicateWalk", () => {
  it("reports the walk as gone if the source no longer exists", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce(null);
    const result = await duplicateWalk(null, form({ walkId: "walk-1" }));
    expect(result).toEqual({ ok: false, error: "That walk is no longer there." });
  });

  it("copies the source walk's details onto a new walk one week later", async () => {
    const source = {
      title: "Sunday stroll",
      description: "A nice walk",
      location: "The park",
      postcode: "BL9 0AA",
      latitude: 53.6,
      longitude: -2.3,
      startsAt: new Date("2026-01-04T14:00:00Z"),
      durationMins: 60,
    };
    prismaMock.walk.findUnique.mockResolvedValueOnce(source);
    prismaMock.walk.create.mockResolvedValueOnce({
      id: "walk-2",
      title: source.title,
      token: "tok-2",
      slug: "sunday-stroll",
    });

    const result = await duplicateWalk(null, form({ walkId: "walk-1" }));

    const createCall = prismaMock.walk.create.mock.calls[0][0];
    expect(createCall.data.title).toBe(source.title);
    expect(createCall.data.startsAt.getTime()).toBe(
      source.startsAt.getTime() + 7 * 24 * 60 * 60 * 1000,
    );
    expect(result).toEqual({
      ok: true,
      message: "“Sunday stroll” duplicated for next week. Check the date before you share it.",
      href: "/admin/walks/walk-2",
    });
  });

  it("keeps bumping a week at a time until the copy lands in the future", async () => {
    const longAgo = new Date("2020-01-01T14:00:00Z");
    prismaMock.walk.findUnique.mockResolvedValueOnce({
      title: "Old walk",
      description: null,
      location: null,
      postcode: null,
      latitude: null,
      longitude: null,
      startsAt: longAgo,
      durationMins: 60,
    });
    // "in the past" until the 3rd check, matching >2 weekly bumps from 2020.
    isWalkStartInThePast.mockReturnValueOnce(true).mockReturnValueOnce(true).mockReturnValue(false);
    prismaMock.walk.create.mockResolvedValueOnce({
      id: "walk-2",
      title: "Old walk",
      token: "tok-2",
      slug: "old-walk",
    });

    await duplicateWalk(null, form({ walkId: "walk-1" }));

    const createCall = prismaMock.walk.create.mock.calls[0][0];
    const weeksBumped =
      (createCall.data.startsAt.getTime() - longAgo.getTime()) / (7 * 24 * 60 * 60 * 1000);
    expect(weeksBumped).toBe(3);
  });
});

describe("searchWalkPlaces", () => {
  it("rate-limits repeated searches", async () => {
    checkRateLimit.mockReturnValueOnce({ ok: false, retryAfterSeconds: 12 });
    const result = await searchWalkPlaces("The park", "");
    expect(result).toEqual({ ok: false, error: "Too many searches. Try again in 12s." });
  });

  it("requires a meeting point or a postcode", async () => {
    const result = await searchWalkPlaces("  ", "  ");
    expect(result).toEqual({ ok: false, error: "Type a meeting point or a postcode first." });
  });

  it("reports nothing found when the search comes back empty", async () => {
    searchPlaces.mockResolvedValueOnce([]);
    const result = await searchWalkPlaces("Nowhereville", "");
    expect(result).toEqual({ ok: false, error: "Nothing found. Try a postcode or a fuller name." });
  });

  it("returns the matched places", async () => {
    const places: PlaceHit[] = [{ id: "1", label: "The Rock, Bury", lat: 53.6, lng: -2.3 }];
    searchPlaces.mockResolvedValueOnce(places);
    const result = await searchWalkPlaces("Rock", "");
    expect(result).toEqual({ ok: true, places });
  });
});

describe("cancelWalk", () => {
  it("requires a walk to be selected", async () => {
    const result = await cancelWalk(null, form({}));
    expect(result).toEqual({ ok: false, error: "No walk selected." });
  });

  it("reports the walk as gone if it no longer exists", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce(null);
    const result = await cancelWalk(null, form({ walkId: "walk-1" }));
    expect(result).toEqual({ ok: false, error: "That walk is no longer there." });
  });

  it("refuses to cancel an already-cancelled walk", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce({
      id: "walk-1",
      token: "tok-1",
      slug: null,
      cancelledAt: new Date(),
      startsAt: new Date(),
      durationMins: 60,
    });
    const result = await cancelWalk(null, form({ walkId: "walk-1" }));
    expect(result).toEqual({ ok: false, error: "This walk is already cancelled." });
  });

  it("refuses to cancel a walk that has already finished", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce({
      id: "walk-1",
      token: "tok-1",
      slug: null,
      cancelledAt: null,
      startsAt: new Date(),
      durationMins: 60,
    });
    walkStatus.mockReturnValueOnce("completed");
    const result = await cancelWalk(null, form({ walkId: "walk-1" }));
    expect(result).toEqual({
      ok: false,
      error: "This walk has already finished, so it can't be cancelled.",
    });
  });

  it("cancels the walk with the given reason", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce({
      id: "walk-1",
      token: "tok-1",
      slug: "sunday-stroll",
      cancelledAt: null,
      startsAt: new Date(),
      durationMins: 60,
    });
    prismaMock.walk.update.mockResolvedValueOnce({});

    const result = await cancelWalk(null, form({ walkId: "walk-1", reason: "Bad weather" }));

    expect(prismaMock.walk.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ cancelledReason: "Bad weather" }),
      }),
    );
    expect(result).toEqual({
      ok: true,
      message: "Walk cancelled. Members will see it marked as cancelled.",
    });
  });
});

describe("reopenWalk", () => {
  it("reports the walk as gone if it no longer exists", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce(null);
    const result = await reopenWalk(null, form({ walkId: "walk-1" }));
    expect(result).toEqual({ ok: false, error: "That walk is no longer there." });
  });

  it("says a not-cancelled walk is already open", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce({
      id: "walk-1",
      token: "tok-1",
      slug: null,
      cancelledAt: null,
    });
    const result = await reopenWalk(null, form({ walkId: "walk-1" }));
    expect(result).toEqual({ ok: false, error: "This walk is already open." });
  });

  it("clears the cancellation", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce({
      id: "walk-1",
      token: "tok-1",
      slug: null,
      cancelledAt: new Date(),
    });
    prismaMock.walk.update.mockResolvedValueOnce({});

    const result = await reopenWalk(null, form({ walkId: "walk-1" }));

    expect(prismaMock.walk.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { cancelledAt: null, cancelledReason: null } }),
    );
    expect(result.ok).toBe(true);
  });
});

describe("updateWalk", () => {
  function updateForm(overrides: Partial<Record<string, string>> = {}) {
    return form({
      walkId: "walk-1",
      title: "Sunday stroll",
      startsAt: "2026-02-01T14:00",
      durationMins: "90",
      ...overrides,
    });
  }

  it("blocks editing a walk that has already finished", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce({
      cancelledAt: null,
      startsAt: new Date(),
      durationMins: 60,
      token: "tok-1",
      slug: null,
    });
    walkStatus.mockReturnValueOnce("completed");

    const result = await updateWalk(null, updateForm());
    expect(result).toEqual({
      ok: false,
      error: "This walk has already finished, so it can't be edited.",
    });
  });

  it("keeps the original date/time once the schedule is locked, even if the form posted a different one", async () => {
    const original = new Date("2026-02-01T14:00:00Z");
    prismaMock.walk.findUnique.mockResolvedValueOnce({
      cancelledAt: null,
      startsAt: original,
      durationMins: 60,
      token: "tok-1",
      slug: "sunday-stroll",
    });
    isWalkScheduleLocked.mockReturnValueOnce(true);
    prismaMock.walk.update.mockResolvedValueOnce({ token: "tok-1", slug: "sunday-stroll" });

    // Form posts a *different* start time and duration than what's stored.
    await updateWalk(null, updateForm({ startsAt: "2030-01-01T09:00", durationMins: "30" }));

    const updateCall = prismaMock.walk.update.mock.calls[0][0];
    expect(updateCall.data.startsAt).toEqual(original);
    expect(updateCall.data.durationMins).toBe(60);
  });

  it("rejects a new start time in the past when the schedule isn't locked", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce({
      cancelledAt: null,
      startsAt: new Date("2026-06-01T14:00:00Z"),
      durationMins: 60,
      token: "tok-1",
      slug: null,
    });
    isWalkScheduleLocked.mockReturnValueOnce(false);
    isWalkStartInThePast.mockReturnValueOnce(true);

    const result = await updateWalk(null, updateForm());
    expect(result).toEqual({ ok: false, error: "Choose a start time that has not passed yet." });
  });

  it("reopens a walk when the reopen flag is set", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce({
      cancelledAt: new Date(),
      startsAt: new Date("2026-06-01T14:00:00Z"),
      durationMins: 60,
      token: "tok-1",
      slug: "sunday-stroll",
    });
    prismaMock.walk.update.mockResolvedValueOnce({ token: "tok-1", slug: "sunday-stroll" });

    const result = await updateWalk(null, updateForm({ wasCancelled: "on" }));

    const updateCall = prismaMock.walk.update.mock.calls[0][0];
    expect(updateCall.data.cancelledAt).toBeNull();
    expect(result).toEqual({ ok: true, message: "Walk updated and put back on the diary." });
  });
});

describe("deleteWalk", () => {
  it("requires a walk to be selected", async () => {
    const result = await deleteWalk(null, form({}));
    expect(result).toEqual({ ok: false, error: "No walk selected." });
  });

  it("reports the walk as already gone (P2025) rather than a generic failure", async () => {
    prismaMock.walk.delete.mockRejectedValueOnce({ code: "P2025" });
    const result = await deleteWalk(null, form({ walkId: "walk-1" }));
    expect(result).toEqual({ ok: false, error: "That walk is no longer there." });
  });

  it("deletes the walk and sends the caller back to /admin", async () => {
    prismaMock.walk.delete.mockResolvedValueOnce({
      token: "tok-1",
      slug: null,
      title: "Sunday stroll",
    });
    const result = await deleteWalk(null, form({ walkId: "walk-1" }));
    expect(result).toEqual({
      ok: true,
      message: "“Sunday stroll” has been removed.",
      href: "/admin",
    });
  });
});
