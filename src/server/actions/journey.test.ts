import { describe, expect, it, vi, beforeEach } from "vitest";

const { revalidatePath, requireAdmin, canOrganiserEditJourney, prismaMock, transaction } =
  vi.hoisted(() => {
    const prismaMock: Record<string, Record<string, ReturnType<typeof vi.fn>>> = {
      walk: { findUnique: vi.fn() },
      walkJourneyEvent: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), findUnique: vi.fn() },
    };
    const transaction = vi.fn(async (arg: unknown) => {
      if (Array.isArray(arg)) return Promise.all(arg);
      return (arg as (tx: unknown) => unknown)({ $executeRawUnsafe: vi.fn(), ...prismaMock });
    });
    return {
      revalidatePath: vi.fn(),
      requireAdmin: vi.fn(),
      canOrganiserEditJourney: vi.fn(),
      prismaMock,
      transaction,
    };
  });

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/db", () => ({ prisma: { ...prismaMock, $transaction: transaction } }));
vi.mock("@/lib/walk-window", async () => {
  const actual = await vi.importActual<typeof import("@/lib/walk-window")>("@/lib/walk-window");
  return { ...actual, canOrganiserEditJourney };
});
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, requireAdmin };
});

import { createJourneyEvent, deleteJourneyEvent, updateJourneyEvent } from "./journey";

const ADMIN = { id: "admin-1" };

function form(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

const walk = {
  id: "walk-1",
  token: "tok-1",
  slug: "sunday-stroll",
  startsAt: new Date("2026-01-05T14:00:00Z"),
  durationMins: 60,
  cancelledAt: null as Date | null,
};

beforeEach(() => {
  vi.clearAllMocks();
  requireAdmin.mockResolvedValue(ADMIN);
  canOrganiserEditJourney.mockReturnValue(true);
});

describe("createJourneyEvent", () => {
  function eventForm(overrides: Partial<Record<string, string>> = {}) {
    return form({
      walkId: "walk-1",
      title: "Rest stop",
      happenedAt: "2026-01-05T14:30",
      ...overrides,
    });
  }

  it("rejects an empty title", async () => {
    const result = await createJourneyEvent(null, eventForm({ title: "" }));
    expect(result.ok).toBe(false);
  });

  it("reports the walk as gone if it no longer exists", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce(null);
    const result = await createJourneyEvent(null, eventForm());
    expect(result).toEqual({ ok: false, error: "That walk is no longer there." });
  });

  it("blocks adding an event before the walk has started", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce({
      ...walk,
      _count: { journeyEvents: 0 },
    });
    canOrganiserEditJourney.mockReturnValueOnce(false);

    const result = await createJourneyEvent(null, eventForm());
    expect(result).toEqual({
      ok: false,
      error: "Journey events can be added once the walk has started.",
    });
  });

  it("gives a different message on a cancelled walk than a not-yet-started one", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce({
      ...walk,
      cancelledAt: new Date(),
      _count: { journeyEvents: 0 },
    });
    canOrganiserEditJourney.mockReturnValueOnce(false);

    const result = await createJourneyEvent(null, eventForm());
    expect(result).toEqual({
      ok: false,
      error: "Cancelled walks keep their journey, but you cannot add more.",
    });
  });

  it("blocks adding once the walk already has the maximum number of events", async () => {
    prismaMock.walk.findUnique.mockResolvedValueOnce({
      ...walk,
      _count: { journeyEvents: 40 },
    });

    const result = await createJourneyEvent(null, eventForm());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/up to \d+ events/);
  });

  it("adds the event and revalidates the walk's pages", async () => {
    prismaMock.walk.findUnique
      .mockResolvedValueOnce({ ...walk, _count: { journeyEvents: 1 } })
      .mockResolvedValueOnce(walk); // the re-fetch used for revalidation
    prismaMock.walkJourneyEvent.create.mockResolvedValueOnce({});

    const result = await createJourneyEvent(null, eventForm({ title: "Rest stop" }));

    expect(prismaMock.walkJourneyEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ walkId: "walk-1", title: "Rest stop" }),
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/admin/walks/walk-1");
    expect(result).toEqual({ ok: true, message: "Event added to the journey." });
  });
});

describe("updateJourneyEvent", () => {
  function eventForm(overrides: Partial<Record<string, string>> = {}) {
    return form({
      eventId: "event-1",
      walkId: "walk-1",
      title: "Rest stop",
      happenedAt: "2026-01-05T14:30",
      ...overrides,
    });
  }

  it("reports the event as gone if it no longer exists", async () => {
    prismaMock.walkJourneyEvent.findUnique.mockResolvedValueOnce(null);
    const result = await updateJourneyEvent(null, eventForm());
    expect(result).toEqual({ ok: false, error: "That event is no longer there." });
  });

  it("reports the event as gone if it belongs to a different walk than claimed", async () => {
    prismaMock.walkJourneyEvent.findUnique.mockResolvedValueOnce({
      id: "event-1",
      walkId: "walk-2",
      walk,
    });
    const result = await updateJourneyEvent(null, eventForm());
    expect(result).toEqual({ ok: false, error: "That event is no longer there." });
  });

  it("blocks editing before the walk has started", async () => {
    prismaMock.walkJourneyEvent.findUnique.mockResolvedValueOnce({
      id: "event-1",
      walkId: "walk-1",
      walk,
    });
    canOrganiserEditJourney.mockReturnValueOnce(false);

    const result = await updateJourneyEvent(null, eventForm());
    expect(result).toEqual({
      ok: false,
      error: "Journey events can be edited once the walk has started.",
    });
  });

  it("updates the event", async () => {
    prismaMock.walkJourneyEvent.findUnique.mockResolvedValueOnce({
      id: "event-1",
      walkId: "walk-1",
      walk,
    });
    prismaMock.walkJourneyEvent.update.mockResolvedValueOnce({});

    const result = await updateJourneyEvent(null, eventForm({ title: "Updated title" }));

    expect(prismaMock.walkJourneyEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "event-1" },
        data: expect.objectContaining({ title: "Updated title" }),
      }),
    );
    expect(result).toEqual({ ok: true, message: "Event updated." });
  });
});

describe("deleteJourneyEvent", () => {
  it("reports the event as gone if it no longer exists", async () => {
    prismaMock.walkJourneyEvent.findUnique.mockResolvedValueOnce(null);
    const result = await deleteJourneyEvent(null, form({ eventId: "event-1" }));
    expect(result).toEqual({ ok: false, error: "That event is no longer there." });
  });

  it("blocks removing an event before the walk has started", async () => {
    prismaMock.walkJourneyEvent.findUnique.mockResolvedValueOnce({ id: "event-1", walk });
    canOrganiserEditJourney.mockReturnValueOnce(false);

    const result = await deleteJourneyEvent(null, form({ eventId: "event-1" }));
    expect(result).toEqual({
      ok: false,
      error: "Journey events can be removed once the walk has started.",
    });
    expect(prismaMock.walkJourneyEvent.delete).not.toHaveBeenCalled();
  });

  it("removes the event", async () => {
    prismaMock.walkJourneyEvent.findUnique.mockResolvedValueOnce({ id: "event-1", walk });
    prismaMock.walkJourneyEvent.delete.mockResolvedValueOnce({});

    const result = await deleteJourneyEvent(null, form({ eventId: "event-1" }));
    expect(prismaMock.walkJourneyEvent.delete).toHaveBeenCalledWith({ where: { id: "event-1" } });
    expect(result).toEqual({ ok: true, message: "Event removed." });
  });
});
