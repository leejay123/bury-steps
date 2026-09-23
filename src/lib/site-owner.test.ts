import { describe, expect, it, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { user: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn() } },
}));

vi.mock("./db", () => ({ prisma: prismaMock }));

import { getOwnerIds, isOwner, ownerCount } from "./site-owner";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isOwner", () => {
  it("is true for an account with isOwner set", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ isOwner: true });
    expect(await isOwner("user-1")).toBe(true);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { isOwner: true },
    });
  });

  it("is false for an account without it, or one that no longer exists", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ isOwner: false });
    expect(await isOwner("user-2")).toBe(false);

    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    expect(await isOwner("gone")).toBe(false);
  });
});

describe("getOwnerIds", () => {
  it("returns every owner's id", async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([{ id: "user-1" }, { id: "user-2" }]);
    expect(await getOwnerIds()).toEqual(["user-1", "user-2"]);
    expect(prismaMock.user.findMany).toHaveBeenCalledWith({
      where: { isOwner: true },
      select: { id: true },
    });
  });

  it("returns an empty array when there are none", async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([]);
    expect(await getOwnerIds()).toEqual([]);
  });
});

describe("ownerCount", () => {
  it("counts owners", async () => {
    prismaMock.user.count.mockResolvedValueOnce(2);
    expect(await ownerCount()).toBe(2);
    expect(prismaMock.user.count).toHaveBeenCalledWith({ where: { isOwner: true } });
  });
});
