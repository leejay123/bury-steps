import { describe, expect, it, vi, beforeEach } from "vitest";

const { prismaMock, getResendClient, audiencesCreate } = vi.hoisted(() => ({
  prismaMock: {
    siteSetting: { findUnique: vi.fn(), update: vi.fn() },
  },
  getResendClient: vi.fn(),
  audiencesCreate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("./client", () => ({ getResendClient }));

import { clearAudienceCache, getOrCreateAudienceId } from "./resend-audience";

beforeEach(() => {
  vi.clearAllMocks();
  clearAudienceCache();
  getResendClient.mockReturnValue({ audiences: { create: audiencesCreate } });
});

describe("getOrCreateAudienceId", () => {
  it("re-reads SiteSetting every call so a reset on another instance is not ignored", async () => {
    prismaMock.siteSetting.findUnique
      .mockResolvedValueOnce({ resendAudienceId: "aud-old" })
      .mockResolvedValueOnce({ resendAudienceId: null });
    audiencesCreate.mockResolvedValueOnce({ data: { id: "aud-new" }, error: null });
    prismaMock.siteSetting.update.mockResolvedValueOnce({});

    expect(await getOrCreateAudienceId()).toBe("aud-old");
    // Second call sees wiped DB (simulating reset on another warm instance)
    // and must create a replacement rather than returning aud-old from cache.
    expect(await getOrCreateAudienceId()).toBe("aud-new");
    expect(audiencesCreate).toHaveBeenCalledTimes(1);
    expect(prismaMock.siteSetting.findUnique).toHaveBeenCalledTimes(2);
  });

  it("returns null when Resend is not configured", async () => {
    getResendClient.mockReturnValueOnce(null);
    expect(await getOrCreateAudienceId()).toBeNull();
    expect(prismaMock.siteSetting.findUnique).not.toHaveBeenCalled();
  });
});
