import { describe, expect, it } from "vitest";
import { buildWalkIcs, walkIcsFilename } from "./walk-ics";

describe("buildWalkIcs", () => {
  const base = {
    id: "cmwalkics02",
    title: "Burrs loop",
    location: null,
    postcode: null,
    startsAt: new Date("2026-08-30T10:00:00.000Z"),
    durationMins: 90,
    token: "abc123token",
    slug: "burrs-x7k2m9",
    cancelledAt: null,
  };

  it("turns textarea CRLF line endings into escaped newlines, leaving no stray CR", () => {
    const ics = buildWalkIcs({ ...base, description: "Easy pace.\r\nBring water." });
    expect(ics).toContain("Easy pace.\\nBring water.");
    // Every CR in the file is part of a CRLF line terminator.
    expect(ics.replace(/\r\n/g, "")).not.toContain("\r");
  });

  it("folds long lines at 75 bytes without splitting a character", () => {
    const description = "Boots recommended after rain — mud on the “top field” 🥾🥾🥾 ".repeat(6);
    const ics = buildWalkIcs({ ...base, description });
    for (const line of ics.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
      expect(line).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/); // no half emoji
    }
    // Unfolding (CRLF + space) gives back the original text intact.
    expect(ics.replace(/\r\n /g, "")).toContain(description.trim().replace(/,/g, "\\,"));
  });

  it("emits a VEVENT with UTC times and the share URL", () => {
    const ics = buildWalkIcs({
      id: "cmwalkics01",
      title: "Burrs loop",
      description: "Easy pace.\nBring water.",
      location: "Visitor centre",
      postcode: "BL9 1AA",
      startsAt: new Date("2026-08-30T10:00:00.000Z"),
      durationMins: 90,
      token: "abc123token",
      slug: "burrs-x7k2m9",
      cancelledAt: null,
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART:20260830T100000Z");
    expect(ics).toContain("DTEND:20260830T113000Z");
    expect(ics).toContain("SUMMARY:Burrs loop");
    expect(ics).toContain("LOCATION:Visitor centre\\, BL9 1AA");
    expect(ics).toContain("Easy pace.\\nBring water.");
    expect(ics).toContain("UID:walk-cmwalkics01@burysteps-walkinggroup.co.uk");
    expect(ics).toMatch(/URL:https?:\/\/.+\/w\/burrs-x7k2m9/);
    expect(ics.endsWith("\r\n")).toBe(true);
  });

  it("prefixes cancelled walks in the summary", () => {
    const ics = buildWalkIcs({
      id: "cmwalkics02",
      title: "Rain check",
      description: null,
      location: null,
      postcode: null,
      startsAt: new Date("2026-09-06T09:00:00.000Z"),
      durationMins: 60,
      token: "tok",
      slug: null,
      cancelledAt: new Date("2026-09-05T12:00:00.000Z"),
    });
    expect(ics).toContain("SUMMARY:Cancelled: Rain check");
    expect(ics).toContain("This walk has been cancelled.");
  });
});

describe("walkIcsFilename", () => {
  it("uses the London calendar date, not the UTC day", () => {
    expect(walkIcsFilename(new Date("2026-08-30T10:00:00.000Z"))).toBe("bury-steps-2026-08-30.ics");
    // 00:30 BST = previous UTC calendar day.
    expect(walkIcsFilename(new Date("2026-08-29T23:30:00.000Z"))).toBe("bury-steps-2026-08-30.ics");
  });
});
