import { describe, expect, it } from "vitest";
import { involvedSummaryText } from "./accident-reports";

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
