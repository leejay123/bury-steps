import { describe, expect, it } from "vitest";
import { isResetConfirmWord } from "./site-reset";

describe("isResetConfirmWord", () => {
  it("accepts delete, ignoring case and surrounding spaces", () => {
    expect(isResetConfirmWord("delete")).toBe(true);
    expect(isResetConfirmWord("DELETE")).toBe(true);
    expect(isResetConfirmWord(" Delete ")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isResetConfirmWord("")).toBe(false);
    expect(isResetConfirmWord("yes")).toBe(false);
    expect(isResetConfirmWord("deleted")).toBe(false);
  });
});
