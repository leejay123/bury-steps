import { describe, expect, it, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { walk: { findMany: vi.fn() } },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { getAllCompletedWalks } from "./walk-members";

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

describe("getAllCompletedWalks", () => {
  it("includes a walk that has fully finished", async () => {
    prismaMock.walk.findMany.mockResolvedValueOnce([walk({ id: "done" })]);
    const rows = await getAllCompletedWalks();
    expect(rows.map((r) => r.id)).toEqual(["done"]);
    expect(rows[0].attendanceCount).toBe(3);
  });

  it("excludes a walk that's still upcoming or in progress", async () => {
    prismaMock.walk.findMany.mockResolvedValueOnce([
      walk({ id: "future", startsAt: new Date("2026-06-20T10:00:00Z") }),
      walk({ id: "in-progress", startsAt: new Date(), durationMins: 90 }),
    ]);
    const rows = await getAllCompletedWalks();
    expect(rows).toEqual([]);
  });

  it("excludes a cancelled walk even if its time has passed", async () => {
    prismaMock.walk.findMany.mockResolvedValueOnce([
      walk({ id: "cancelled", cancelledAt: new Date("2026-06-14T10:00:00Z") }),
    ]);
    // cancelled walks are already excluded at the query level (where:
    // cancelledAt: null), but the status filter is a second safety net.
    const rows = await getAllCompletedWalks();
    expect(rows).toEqual([]);
  });

  it("queries with cancelledAt: null so cancelled walks never reach the filter", async () => {
    prismaMock.walk.findMany.mockResolvedValueOnce([]);
    await getAllCompletedWalks();
    expect(prismaMock.walk.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { cancelledAt: null } }),
    );
  });
});
