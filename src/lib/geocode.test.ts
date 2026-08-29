import { afterEach, describe, expect, it, vi } from "vitest";
import {
  geocodeLocation,
  geocodeQuery,
  meetingPointLabel,
  normalizeUkPostcode,
  parseFormPoint,
  searchPlaces,
} from "./geocode";

describe("meetingPointLabel", () => {
  it("joins wording and postcode for members", () => {
    expect(meetingPointLabel("Visitor centre, Burrs", "BL8 1DA")).toBe(
      "Visitor centre, Burrs · BL8 1DA",
    );
  });

  it("omits blank parts", () => {
    expect(meetingPointLabel("Burrs", "")).toBe("Burrs");
    expect(meetingPointLabel(null, "BL8 1DA")).toBe("BL8 1DA");
    expect(meetingPointLabel("  ", null)).toBe("");
  });
});

describe("normalizeUkPostcode", () => {
  it("inserts the usual space and uppercases", () => {
    expect(normalizeUkPostcode("bl81da")).toBe("BL8 1DA");
    expect(normalizeUkPostcode("M1 1AE")).toBe("M1 1AE");
  });

  it("returns null for empty or too-short input", () => {
    expect(normalizeUkPostcode("")).toBeNull();
    expect(normalizeUkPostcode("BL8")).toBeNull();
  });
});

describe("geocodeQuery", () => {
  it("leaves a query that already names Bury or the UK", () => {
    expect(geocodeQuery("Burrs Country Park, Bury")).toBe("Burrs Country Park, Bury");
    expect(geocodeQuery("Heaton Park, Manchester")).toBe("Heaton Park, Manchester");
  });

  it("adds Bury, UK when the organiser only typed a local landmark", () => {
    expect(geocodeQuery("Car park, Woodhill Road")).toBe("Car park, Woodhill Road, Bury, UK");
  });

  it("puts a postcode first", () => {
    expect(geocodeQuery("Visitor centre", "BL8 1DA")).toBe(
      "BL8 1DA, Visitor centre, Bury, UK",
    );
  });

  it("can search from a postcode alone", () => {
    expect(geocodeQuery("", "bl81da")).toBe("BL8 1DA");
  });

  it("trims empty input", () => {
    expect(geocodeQuery("  ")).toBe("");
  });
});

describe("parseFormPoint", () => {
  it("reads a pin the organiser picked", () => {
    expect(parseFormPoint("53.61", "-2.30")).toEqual({ lat: 53.61, lng: -2.3 });
  });

  it("ignores blank hidden fields", () => {
    expect(parseFormPoint("", "")).toBeNull();
  });
});

describe("searchPlaces", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns up to five Nominatim hits", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { lat: "53.61", lon: "-2.30", display_name: "Burrs Country Park, Bury" },
          { lat: "53.60", lon: "-2.31", display_name: "Burrs car park, Bury" },
        ],
      }),
    );
    await expect(searchPlaces("Burrs", "BL8 1DA")).resolves.toEqual([
      { id: "53.61,-2.3", label: "Burrs Country Park, Bury", lat: 53.61, lng: -2.3 },
      { id: "53.6,-2.31", label: "Burrs car park, Bury", lat: 53.6, lng: -2.31 },
    ]);
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
        json: async () => [{ lat: "53.5933", lon: "-2.3014", display_name: "Burrs Country Park" }],
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
