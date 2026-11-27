import { beforeEach, describe, expect, it, vi } from "vitest";

const { getOptionalUser, findUnique, findMany } = vi.hoisted(() => ({
  getOptionalUser: vi.fn(),
  findUnique: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: { story: { findUnique }, storyView: { findMany } } }));
vi.mock("@/lib/auth", () => ({
  getOptionalUser,
  memberDisplayName: (u: { firstName: string | null }) => u.firstName ?? "Member",
}));

import { GET } from "./route";

const ask = () => GET(new Request("http://x"), { params: Promise.resolve({ id: "s1" }) });
const mine = () => ({ userId: "me", expiresAt: new Date(Date.now() + 60_000) });

beforeEach(() => {
  vi.clearAllMocks();
  getOptionalUser.mockResolvedValue({ id: "me", role: "MEMBER" });
});

describe("story viewers list", () => {
  it("turns away signed-out visitors", async () => {
    getOptionalUser.mockResolvedValue(null);
    expect((await ask()).status).toBe(401);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("is only for the person who posted, not even organisers", async () => {
    getOptionalUser.mockResolvedValue({ id: "boss", role: "ADMIN" });
    findUnique.mockResolvedValue(mine());
    expect((await ask()).status).toBe(404);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("gives nothing for a story that has expired or gone", async () => {
    for (const story of [null, { userId: "me", expiresAt: new Date(Date.now() - 1) }]) {
      findUnique.mockResolvedValue(story);
      expect((await ask()).status).toBe(404);
    }
    expect(findMany).not.toHaveBeenCalled();
  });

  it("lists the poster's viewers, newest first, never cached", async () => {
    findUnique.mockResolvedValue(mine());
    findMany.mockResolvedValue([
      { userId: "u2", viewedAt: new Date("2026-11-27T10:00:00Z"), user: { firstName: "Sam", lastName: null, imageUrl: null } },
    ]);
    const res = await ask();
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(await res.json()).toEqual({
      viewers: [{ id: "u2", name: "Sam", imageUrl: null, viewedAt: "2026-11-27T10:00:00.000Z" }],
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { storyId: "s1" }, orderBy: { viewedAt: "desc" } }),
    );
  });
});
