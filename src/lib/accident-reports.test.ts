import { describe, expect, it } from "vitest";
import {
  involvedSummaryText,
  nextAccidentReportNumber,
  numberedForMemberId,
  reportNumberPrefix,
} from "./accident-reports";

describe("involvedSummaryText", () => {
  it("returns just the free text when no members are tagged", () => {
    expect(involvedSummaryText("A passerby who stopped to help", [])).toBe(
      "A passerby who stopped to help",
    );
  });

  it("returns just the tagged member names when there's no free text", () => {
    expect(
      involvedSummaryText(undefined, [
        { user: { firstName: "Jane", lastName: "Doe" } },
        { user: { firstName: "John", lastName: null } },
      ]),
    ).toBe("Jane Doe, John");
  });

  it("combines tagged members and free text, members first", () => {
    expect(
      involvedSummaryText("A passerby who isn't a member", [
        { user: { firstName: "Jane", lastName: "Doe" } },
      ]),
    ).toBe("Jane Doe, A passerby who isn't a member");
  });

  it("returns an empty string when there's nothing at all", () => {
    expect(involvedSummaryText("", [])).toBe("");
    expect(involvedSummaryText(null, [])).toBe("");
  });
});

describe("numberedForMemberId", () => {
  it("has no numbered-for member when nobody was tagged", () => {
    expect(numberedForMemberId([], undefined)).toEqual({ ok: true, userId: null });
  });

  it("uses the only tagged member, even if the form didn't send a pick", () => {
    expect(numberedForMemberId(["member-1"], undefined)).toEqual({ ok: true, userId: "member-1" });
  });

  it("uses the pick when several members were tagged", () => {
    expect(numberedForMemberId(["member-1", "member-2"], "member-2")).toEqual({
      ok: true,
      userId: "member-2",
    });
  });

  it("asks for a pick when several members were tagged and none was chosen", () => {
    expect(numberedForMemberId(["member-1", "member-2"], undefined)).toEqual({
      ok: false,
      error: "Pick who this report is numbered for.",
    });
  });

  it("rejects a pick who was not tagged as involved", () => {
    expect(numberedForMemberId(["member-1", "member-2"], "member-3")).toEqual({
      ok: false,
      error: "Pick who this report is numbered for.",
    });
  });
});

describe("accident report numbers", () => {
  it("takes the member's initials as the prefix", () => {
    expect(reportNumberPrefix("Tom Robert")).toBe("TR");
    expect(reportNumberPrefix("Chris Berman")).toBe("CB");
    expect(reportNumberPrefix("John Smith")).toBe("JS");
  });

  it("starts at 001 for that person's first report", () => {
    expect(nextAccidentReportNumber("TR", [])).toBe("TR001");
    expect(nextAccidentReportNumber("CB", [])).toBe("CB001");
  });

  it("adds one to the highest number already used for those initials", () => {
    expect(nextAccidentReportNumber("TR", ["TR001"])).toBe("TR002");
    expect(nextAccidentReportNumber("TR", ["TR001", "TR002", "CB001"])).toBe("TR003");
  });
});
