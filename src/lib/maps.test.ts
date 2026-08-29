import { describe, expect, it } from "vitest";
import { appleMapsUrl, googleDirectionsUrl, osmEmbedUrl, osmViewUrl } from "./maps";

const point = { lat: 53.5933, lng: -2.3014 };

describe("map URLs", () => {
  it("builds an OSM embed around the pin", () => {
    const url = new URL(osmEmbedUrl(point));
    expect(url.hostname).toBe("www.openstreetmap.org");
    expect(url.searchParams.get("marker")).toBe("53.5933,-2.3014");
    expect(url.searchParams.get("bbox")).toContain("-2.3");
  });

  it("builds a larger OSM map of the same pin", () => {
    expect(osmViewUrl(point)).toContain("mlat=53.5933");
    expect(osmViewUrl(point)).toContain("mlon=-2.3014");
  });

  it("sends coordinates to Google Maps when we have a pin", () => {
    const url = new URL(googleDirectionsUrl("Burrs Country Park, Bury", point));
    expect(url.hostname).toBe("www.google.com");
    expect(url.searchParams.get("destination")).toBe("53.5933,-2.3014");
  });

  it("falls back to the meeting-point text when there is no pin", () => {
    const url = new URL(googleDirectionsUrl("Burrs Country Park, Bury"));
    expect(url.searchParams.get("destination")).toBe("Burrs Country Park, Bury");
  });

  it("sends coordinates to Apple Maps when we have a pin", () => {
    const url = new URL(appleMapsUrl("Burrs Country Park, Bury", point));
    expect(url.searchParams.get("daddr")).toBe("53.5933,-2.3014");
    expect(url.searchParams.get("q")).toBe("Burrs Country Park, Bury");
  });
});
