import { describe, expect, it, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { siteSetting: { findUnique: vi.fn() } },
}));

vi.mock("./db", () => ({ prisma: prismaMock }));

import { getOwnerId, isOwner } from "./site-owner";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getOwnerId", () => {
  it("returns the stored ownerId", async () => {
    prismaMock.siteSetting.findUnique.mockResolvedValueOnce({ ownerId: "user-1" });
    expect(await getOwnerId()).toBe("user-1");
    expect(prismaMock.siteSetting.findUnique).toHaveBeenCalledWith({
      where: { id: "site" },
      select: { ownerId: true },
    });
  });

  it("returns null when no owner has ever been set", async () => {
    prismaMock.siteSetting.findUnique.mockResolvedValueOnce({ ownerId: null });
    expect(await getOwnerId()).toBeNull();
  });

  it("returns null when the SiteSetting row doesn't exist yet", async () => {
    prismaMock.siteSetting.findUnique.mockResolvedValueOnce(null);
    expect(await getOwnerId()).toBeNull();
  });
});

describe("isOwner", () => {
  it("is true only for the account matching the stored ownerId", async () => {
    prismaMock.siteSetting.findUnique.mockResolvedValueOnce({ ownerId: "user-1" });
    expect(await isOwner("user-1")).toBe(true);
  });

  it("is false for anyone else, including when no owner is set", async () => {
    prismaMock.siteSetting.findUnique.mockResolvedValueOnce({ ownerId: "user-1" });
    expect(await isOwner("user-2")).toBe(false);

    prismaMock.siteSetting.findUnique.mockResolvedValueOnce(null);
    expect(await isOwner("user-1")).toBe(false);
  });
});
