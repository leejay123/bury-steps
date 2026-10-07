import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, sendStartingSoonPush, vapidConfig } = vi.hoisted(() => ({
  prismaMock: {
    walk: {
      findMany: vi.fn(async (): Promise<unknown[]> => []),
      update: vi.fn(async () => ({})),
    },
  },
  sendStartingSoonPush: vi.fn(async () => ({ sent: 1, failed: 0, removed: 0 })),
  vapidConfig: vi.fn(
    (): { publicKey: string; privateKey: string; subject: string } | null => ({
      publicKey: "pub",
      privateKey: "priv",
      subject: "https://example.test",
    }),
  ),
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/push-send", () => ({ sendStartingSoonPush }));
vi.mock("@/lib/vapid", () => ({ vapidConfig }));

import { GET } from "./route";

const walk = {
  id: "walk-1",
  title: "Burrs",
  startsAt: new Date("2026-10-06T14:00:00.000Z"),
  slug: "burrs",
  token: "token",
};

function request(secret?: string) {
  return new Request("https://example.test/api/cron/walk-starting-soon", {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "test-secret";
  vapidConfig.mockReturnValue({ publicKey: "pub", privateKey: "priv", subject: "https://example.test" });
  sendStartingSoonPush.mockResolvedValue({ sent: 1, failed: 0, removed: 0 });
  prismaMock.walk.findMany.mockResolvedValue([]);
});

describe("GET /api/cron/walk-starting-soon", () => {
  it("refuses a request without the cron secret", async () => {
    const response = await GET(request());
    expect(response.status).toBe(401);
    expect(prismaMock.walk.findMany).not.toHaveBeenCalled();
  });

  it("skips when the alert keys are not set", async () => {
    vapidConfig.mockReturnValue(null);
    const response = await GET(request("test-secret"));
    expect(await response.json()).toEqual({ skipped: true, reason: "no-vapid" });
    expect(prismaMock.walk.findMany).not.toHaveBeenCalled();
  });

  it("sends without closing the walk, so a phone turned on later still gets it", async () => {
    prismaMock.walk.findMany.mockResolvedValue([walk]);
    const response = await GET(request("test-secret"));
    expect(response.status).toBe(200);
    expect(sendStartingSoonPush).toHaveBeenCalledWith(walk);
    expect(prismaMock.walk.update).not.toHaveBeenCalled();
    const calls = prismaMock.walk.findMany.mock.calls as unknown as Array<
      [{ where: { startsAt: { gt: Date; lte: Date } } }]
    >;
    const startsAt = calls[0][0].where.startsAt;
    expect(startsAt.gt).toBeInstanceOf(Date);
    expect(startsAt.lte.getTime() - startsAt.gt.getTime()).toBe(70 * 60 * 1000);
  });

  it("still sends when some phones failed, so the next look can retry those", async () => {
    prismaMock.walk.findMany.mockResolvedValue([walk]);
    sendStartingSoonPush.mockResolvedValue({ sent: 0, failed: 2, removed: 0 });
    const response = await GET(request("test-secret"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      walks: [{ id: "walk-1", sent: 0, failed: 2, removed: 0 }],
    });
  });
});
