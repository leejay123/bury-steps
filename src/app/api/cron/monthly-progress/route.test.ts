import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const { prismaMock, loadWalkGame, buildProgressSummaryEmail, sendEmailBatch } = vi.hoisted(() => ({
  prismaMock: { user: { findMany: vi.fn(async (): Promise<unknown[]> => []) } },
  loadWalkGame: vi.fn(),
  // buildProgressSummaryEmail normally returns the SendEmailInput it would
  // send; the cron hands an array of these to sendEmailBatch, which is
  // what these tests assert on instead of a per-member send call. Keeping
  // `summary`/`member` on the stub result (rather than a real
  // SendEmailInput shape) lets the assertions below check the same
  // content the old per-call assertions did.
  buildProgressSummaryEmail: vi.fn(async (summary: unknown, member: unknown) => ({ summary, member })),
  sendEmailBatch: vi.fn(async (emails: unknown[]) => ({ sent: emails.length, failed: 0 })),
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/walk-progress", () => ({ loadWalkGame }));
vi.mock("@/lib/email/mailer", () => ({ buildProgressSummaryEmail }));
vi.mock("@/lib/email/client", () => ({ sendEmailBatch }));

import { GET } from "./route";

const MEMBER = { id: "member-1", email: "jane@example.com", firstName: "Jane", unsubscribeToken: null };

function request(secret?: string): Request {
  return new Request("https://example.test/api/cron/monthly-progress", {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  sendEmailBatch.mockImplementation(async (emails: unknown[]) => ({ sent: emails.length, failed: 0 }));
  process.env.CRON_SECRET = "test-secret";
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /api/cron/monthly-progress", () => {
  it("rejects without the correct bearer token", async () => {
    const res = await GET(request("wrong"));
    expect(res.status).toBe(401);
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  it("rejects when CRON_SECRET isn't configured", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(request("anything"));
    expect(res.status).toBe(401);
  });

  it("summarises the month that just finished, not the current one", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T06:00:00Z"));
    prismaMock.user.findMany.mockResolvedValueOnce([MEMBER]);
    loadWalkGame.mockResolvedValueOnce({
      viewer: { monthCount: 3, yearCount: 20, streakWeeks: 2, badges: [] },
      together: { goal: 30, count: 18 },
    });

    const res = await GET(request("test-secret"));
    const body = await res.json();

    expect(loadWalkGame).toHaveBeenCalledWith(MEMBER.id, new Date("2026-09-01T00:00:00Z"));
    expect(buildProgressSummaryEmail).toHaveBeenCalledWith(
      expect.objectContaining({ monthLabel: "August", monthCount: 3 }),
      expect.objectContaining({ id: MEMBER.id }),
    );
    expect(sendEmailBatch).toHaveBeenCalledWith(
      [expect.objectContaining({ summary: expect.objectContaining({ monthLabel: "August" }) })],
      { idempotencyKeyPrefix: "progress-summary/2026-08" },
    );
    expect(body).toEqual({ monthKey: "2026-08", eligible: 1, sent: 1 });
  });

  it("rolls the year back correctly when the cron runs in January", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T06:00:00Z"));
    prismaMock.user.findMany.mockResolvedValueOnce([MEMBER]);
    loadWalkGame.mockResolvedValueOnce({
      viewer: { monthCount: 1, yearCount: 1, streakWeeks: 1, badges: [] },
      together: null,
    });

    await GET(request("test-secret"));

    expect(buildProgressSummaryEmail).toHaveBeenCalledWith(
      expect.objectContaining({ monthLabel: "December" }),
      expect.anything(),
    );
    expect(sendEmailBatch).toHaveBeenCalledWith(expect.anything(), {
      idempotencyKeyPrefix: "progress-summary/2025-12",
    });
  });

  it("skips a member with nothing to report, without emailing them", async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([MEMBER]);
    loadWalkGame.mockResolvedValueOnce({
      viewer: { monthCount: 0, yearCount: 0, streakWeeks: 0, badges: [] },
      together: null,
    });

    const res = await GET(request("test-secret"));
    const body = await res.json();

    expect(buildProgressSummaryEmail).not.toHaveBeenCalled();
    expect(sendEmailBatch).toHaveBeenCalledWith([], expect.anything());
    expect(body).toEqual(expect.objectContaining({ eligible: 1, sent: 0 }));
  });

  it("keeps going for other members if one fails to build", async () => {
    const memberTwo = { ...MEMBER, id: "member-2", email: "sam@example.com" };
    prismaMock.user.findMany.mockResolvedValueOnce([MEMBER, memberTwo]);
    loadWalkGame.mockResolvedValueOnce({
      viewer: { monthCount: 2, yearCount: 5, streakWeeks: 1, badges: [] },
      together: null,
    });
    loadWalkGame.mockRejectedValueOnce(new Error("load failed"));

    const res = await GET(request("test-secret"));
    const body = await res.json();

    expect(buildProgressSummaryEmail).toHaveBeenCalledTimes(1);
    expect(sendEmailBatch).toHaveBeenCalledWith([expect.anything()], expect.anything());
    expect(body).toEqual(expect.objectContaining({ eligible: 2, sent: 1 }));
  });

  it("reports however many sendEmailBatch actually sent", async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([MEMBER]);
    loadWalkGame.mockResolvedValueOnce({
      viewer: { monthCount: 2, yearCount: 5, streakWeeks: 1, badges: [] },
      together: null,
    });
    sendEmailBatch.mockResolvedValueOnce({ sent: 0, failed: 1 });

    const res = await GET(request("test-secret"));
    const body = await res.json();

    expect(body).toEqual(expect.objectContaining({ eligible: 1, sent: 0 }));
  });
});
