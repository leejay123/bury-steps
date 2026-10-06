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

  it("sends once and marks the walk so a later run does not repeat it", async () => {
    prismaMock.walk.findMany.mockResolvedValue([walk]);
    const response = await GET(request("test-secret"));
    expect(response.status).toBe(200);
    expect(sendStartingSoonPush).toHaveBeenCalledWith(walk);
    expect(prismaMock.walk.update).toHaveBeenCalledWith({
      where: { id: "walk-1" },
      data: { startingSoonPushSentAt: expect.any(Date) },
    });
  });

  it("leaves the walk unmarked when every alert failed, so the next run can retry", async () => {
    prismaMock.walk.findMany.mockResolvedValue([walk]);
    sendStartingSoonPush.mockResolvedValue({ sent: 0, failed: 2, removed: 0 });
    await GET(request("test-secret"));
    expect(prismaMock.walk.update).not.toHaveBeenCalled();
  });
});
