import { describe, expect, it, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { walk: { findMany: vi.fn() } },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { getAllWalksSiteWide } from "./walk-members";

function walk(overrides: Partial<Parameters<typeof baseWalk>[0]> = {}) {
  return baseWalk(overrides);
}

function baseWalk(overrides: {
  id?: string;
  startsAt?: Date;
  durationMins?: number;
  cancelledAt?: Date | null;
  attendances?: number;
}) {
  const now = new Date("2026-06-15T12:00:00Z");
  return {
    id: overrides.id ?? "walk-1",
    token: "tok",
    slug: null,
    title: "Sunday stroll",
    location: "The car park",
    startsAt: overrides.startsAt ?? new Date(now.getTime() - 60 * 60_000),
    durationMins: overrides.durationMins ?? 30,
    cancelledAt: overrides.cancelledAt ?? null,
    _count: { attendances: overrides.attendances ?? 3 },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-15T12:00:00Z"));
});

describe("getAllWalksSiteWide", () => {
  it("includes a walk that has fully finished", async () => {
    prismaMock.walk.findMany.mockResolvedValueOnce([walk({ id: "done" })]);
    const rows = await getAllWalksSiteWide();
    expect(rows.map((r) => r.id)).toEqual(["done"]);
    expect(rows[0].attendanceCount).toBe(3);
    expect(rows[0].cancelledAt).toBeNull();
  });

  it("excludes a walk that's still upcoming or in progress", async () => {
    prismaMock.walk.findMany.mockResolvedValueOnce([
      walk({ id: "future", startsAt: new Date("2026-06-20T10:00:00Z") }),
      walk({ id: "in-progress", startsAt: new Date(), durationMins: 90 }),
    ]);
    const rows = await getAllWalksSiteWide();
    expect(rows).toEqual([]);
  });

  it("includes a cancelled walk even if its original time hasn't passed yet", async () => {
    const cancelledAt = new Date("2026-06-14T10:00:00Z");
    prismaMock.walk.findMany.mockResolvedValueOnce([
      walk({ id: "cancelled", startsAt: new Date("2026-06-20T10:00:00Z"), cancelledAt }),
    ]);
    const rows = await getAllWalksSiteWide();
    expect(rows.map((r) => r.id)).toEqual(["cancelled"]);
    expect(rows[0].cancelledAt).toEqual(cancelledAt);
  });

  it("queries for anything already cancelled or already started, ordered newest first", async () => {
    prismaMock.walk.findMany.mockResolvedValueOnce([]);
    await getAllWalksSiteWide();
    expect(prismaMock.walk.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ cancelledAt: { not: null } }, { startsAt: { lte: expect.any(Date) } }] },
        orderBy: { startsAt: "desc" },
      }),
    );
  });
});
