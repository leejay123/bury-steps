import { describe, expect, it } from "vitest";
import { pushEndpointAllowed, startingSoonPushPayload, startingSoonPushWindow } from "./walk-push";

describe("startingSoonPushWindow", () => {
  it("covers from now until seventy minutes ahead, and not after the start", () => {
    const now = new Date("2026-10-06T13:00:00.000Z");
    const window = startingSoonPushWindow(now);
    expect(window.from.toISOString()).toBe("2026-10-06T13:00:00.000Z");
    expect(window.until.toISOString()).toBe("2026-10-06T14:10:00.000Z");
  });
});

describe("startingSoonPushPayload", () => {
  it("names the walk, the London time, and the share path", () => {
    const payload = startingSoonPushPayload({
      id: "walk-1",
      title: "Burrs",
      startsAt: new Date("2026-10-11T13:30:00.000Z"),
      slug: "burrs",
      token: "token",
    });
    expect(payload.title).toBe("Walk starting soon");
    expect(payload.body).toContain("Burrs");
    expect(payload.body).toContain("clock in");
    expect(payload.url).toBe("/w/burrs");
  });
});

describe("pushEndpointAllowed", () => {
  it("allows https and localhost only", () => {
    expect(pushEndpointAllowed("https://updates.push.services.mozilla.com/wpush/abc")).toBe(true);
    expect(pushEndpointAllowed("http://localhost:3000/push")).toBe(true);
    expect(pushEndpointAllowed("http://example.com/push")).toBe(false);
    expect(pushEndpointAllowed("not a url")).toBe(false);
  });
});
