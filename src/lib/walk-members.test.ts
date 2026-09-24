import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { walk: { findMany: vi.fn() } },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { getAllWalksSiteWide } from "./walk-members";

function walk(overrides: {
  id?: string;
  startsAt?: Date;
  durationMins?: number;
  cancelledAt?: Date | null;
  endedAt?: Date | null;
  attendances?: number;
} = {}) {
  const now = new Date("2026-06-15T12:00:00Z");
  return {
    id: overrides.id ?? "walk-1",
    token: "tok",
    slug: null,
    title: "Sunday stroll",
    location: "The car park",
    startsAt: overrides.startsAt ?? new Date(now.getTime() - 60 * 60_000),
    durationMins: overrides.durationMins ?? 30,
    endedAt: overrides.endedAt ?? null,
    cancelledAt: overrides.cancelledAt ?? null,
    _count: { attendances: overrides.attendances ?? 3 },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getAllWalksSiteWide", () => {
  it("includes a walk that has fully finished", async () => {
    prismaMock.walk.findMany
      .mockResolvedValueOnce([walk({ id: "done" })])
      .mockResolvedValueOnce([]);
    const rows = await getAllWalksSiteWide();
    expect(rows.map((r) => r.id)).toEqual(["done"]);
    expect(rows[0].attendanceCount).toBe(3);
    expect(rows[0].cancelledAt).toBeNull();
  });

  it("excludes a walk that's still upcoming or in progress", async () => {
    prismaMock.walk.findMany
      .mockResolvedValueOnce([
        walk({ id: "in-progress", startsAt: new Date(), durationMins: 90 }),
      ])
      .mockResolvedValueOnce([
        walk({ id: "future", startsAt: new Date("2026-06-20T10:00:00Z") }),
      ]);
    const rows = await getAllWalksSiteWide();
    expect(rows).toEqual([]);
  });

  it("includes a cancelled walk even if its original time hasn't passed yet", async () => {
    const cancelledAt = new Date("2026-06-14T10:00:00Z");
    prismaMock.walk.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        walk({ id: "cancelled", startsAt: new Date("2026-06-20T10:00:00Z"), cancelledAt }),
      ]);
    const rows = await getAllWalksSiteWide();
    expect(rows.map((r) => r.id)).toEqual(["cancelled"]);
    expect(rows[0].cancelledAt).toEqual(cancelledAt);
  });

  it("loads past/started walks and future cancellations in separate queries", async () => {
    prismaMock.walk.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    await getAllWalksSiteWide();
    expect(prismaMock.walk.findMany).toHaveBeenCalledTimes(2);
    expect(prismaMock.walk.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: {
          OR: [
            { cancelledAt: { not: null }, startsAt: { lte: expect.any(Date) } },
            { cancelledAt: null, startsAt: { lte: expect.any(Date) } },
          ],
        },
        orderBy: { startsAt: "desc" },
        take: 500,
      }),
    );
    expect(prismaMock.walk.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { cancelledAt: { not: null }, startsAt: { gt: expect.any(Date) } },
        orderBy: { startsAt: "asc" },
        take: 50,
      }),
    );
  });

  it("keeps completed history when many future cancellations exist", async () => {
    const cancelledAt = new Date("2026-06-14T10:00:00Z");
    prismaMock.walk.findMany
      .mockResolvedValueOnce([walk({ id: "old-completed", startsAt: new Date("2025-01-01T10:00:00Z") })])
      .mockResolvedValueOnce([
        walk({
          id: "future-cancel",
          startsAt: new Date("2026-12-01T10:00:00Z"),
          cancelledAt,
        }),
      ]);
    const rows = await getAllWalksSiteWide();
    expect(rows.map((r) => r.id).sort()).toEqual(["future-cancel", "old-completed"]);
  });
});
