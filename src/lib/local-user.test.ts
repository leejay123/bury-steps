import { describe, expect, it, vi, beforeEach } from "vitest";

const { prismaMock, transaction, sendWelcomeEmail } = vi.hoisted(() => {
  const prismaMock = {
    user: {
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    siteSetting: { upsert: vi.fn() },
  };
  const transaction = vi.fn(async (fn: (tx: unknown) => unknown) =>
    fn({ $executeRaw: vi.fn(), ...prismaMock }),
  );
  return { prismaMock, transaction, sendWelcomeEmail: vi.fn(async () => {}) };
});

vi.mock("./db", () => ({ prisma: { ...prismaMock, $transaction: transaction } }));
// Dynamically imported inside syncLocalUser — see the comment there for why.
vi.mock("./email/mailer", () => ({ sendWelcomeEmail }));

import { syncLocalUser } from "./local-user";

const INPUT = {
  clerkId: "clerk-1",
  email: "jo@example.com",
  firstName: "Jo",
  lastName: "Bloggs",
};

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.INITIAL_ADMIN_EMAIL;
});

describe("syncLocalUser", () => {
  it("updates an already-existing account without touching site ownership", async () => {
    const existing = { id: "user-1", clerkId: INPUT.clerkId, role: "MEMBER" };
    prismaMock.user.findUnique.mockResolvedValueOnce(existing);
    prismaMock.user.update.mockResolvedValueOnce(existing);

    await syncLocalUser(INPUT);

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { clerkId: INPUT.clerkId },
      data: { email: INPUT.email, firstName: INPUT.firstName, lastName: INPUT.lastName },
    });
    expect(prismaMock.siteSetting.upsert).not.toHaveBeenCalled();
    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it("bootstraps the first-ever account as ADMIN and makes them the site owner", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.count.mockResolvedValueOnce(0);
    const created = { id: "user-1", ...INPUT, role: "ADMIN" };
    prismaMock.user.create.mockResolvedValueOnce(created);

    await syncLocalUser(INPUT);

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        clerkId: INPUT.clerkId,
        email: INPUT.email,
        firstName: INPUT.firstName,
        lastName: INPUT.lastName,
        role: "ADMIN",
      },
    });
    expect(prismaMock.siteSetting.upsert).toHaveBeenCalledWith({
      where: { id: "site" },
      create: expect.objectContaining({ id: "site", ownerId: created.id }),
      update: { ownerId: created.id },
    });
    expect(sendWelcomeEmail).toHaveBeenCalledWith(created);
  });

  it("does not bootstrap as ADMIN, or touch site ownership, when other accounts already exist", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.count.mockResolvedValueOnce(3);
    const created = { id: "user-2", ...INPUT, role: "MEMBER" };
    prismaMock.user.create.mockResolvedValueOnce(created);

    await syncLocalUser(INPUT);

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: "MEMBER" }) }),
    );
    expect(prismaMock.siteSetting.upsert).not.toHaveBeenCalled();
  });

  it("refuses to bootstrap the first account as ADMIN when it doesn't match INITIAL_ADMIN_EMAIL", async () => {
    process.env.INITIAL_ADMIN_EMAIL = "owner@example.com";
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.count.mockResolvedValueOnce(0);
    const created = { id: "user-1", ...INPUT, role: "MEMBER" };
    prismaMock.user.create.mockResolvedValueOnce(created);
    vi.spyOn(console, "error").mockImplementation(() => {});

    await syncLocalUser(INPUT);

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: "MEMBER" }) }),
    );
    expect(prismaMock.siteSetting.upsert).not.toHaveBeenCalled();
  });

  it("bootstraps as ADMIN when the first account matches INITIAL_ADMIN_EMAIL (case-insensitively)", async () => {
    process.env.INITIAL_ADMIN_EMAIL = "Jo@Example.com";
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    prismaMock.user.count.mockResolvedValueOnce(0);
    const created = { id: "user-1", ...INPUT, role: "ADMIN" };
    prismaMock.user.create.mockResolvedValueOnce(created);
    vi.spyOn(console, "warn").mockImplementation(() => {});

    await syncLocalUser(INPUT);

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: "ADMIN" }) }),
    );
    expect(prismaMock.siteSetting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { ownerId: created.id } }),
    );
  });
});
