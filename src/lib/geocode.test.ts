import { afterEach, describe, expect, it, vi } from "vitest";
import { geocodeLocation, geocodeQuery } from "./geocode";

describe("geocodeQuery", () => {
  it("leaves a query that already names Bury or the UK", () => {
    expect(geocodeQuery("Burrs Country Park, Bury")).toBe("Burrs Country Park, Bury");
    expect(geocodeQuery("Heaton Park, Manchester")).toBe("Heaton Park, Manchester");
  });

  it("adds Bury, UK when the organiser only typed a local landmark", () => {
    expect(geocodeQuery("Car park, Woodhill Road")).toBe("Car park, Woodhill Road, Bury, UK");
  });

  it("trims empty input", () => {
    expect(geocodeQuery("  ")).toBe("");
  });
});

describe("geocodeLocation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the first Nominatim hit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ lat: "53.5933", lon: "-2.3014" }],
      }),
    );
    await expect(geocodeLocation("Burrs Country Park, Bury")).resolves.toEqual({
      lat: 53.5933,
      lng: -2.3014,
    });
  });

  it("returns null when Nominatim finds nothing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }),
    );
    await expect(geocodeLocation("not a real place xyz")).resolves.toBeNull();
  });

  it("returns null when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    await expect(geocodeLocation("Burrs Country Park")).resolves.toBeNull();
  });
});
