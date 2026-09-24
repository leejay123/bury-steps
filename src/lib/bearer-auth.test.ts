import { describe, expect, it } from "vitest";
import { bearerMatches } from "./bearer-auth";

describe("bearerMatches", () => {
  it("accepts an exact Bearer match", () => {
    expect(bearerMatches("Bearer secret-value", "secret-value")).toBe(true);
  });

  it("rejects a wrong secret, missing header, or missing env secret", () => {
    expect(bearerMatches("Bearer wrong", "secret-value")).toBe(false);
    expect(bearerMatches("Bearer secret-value", undefined)).toBe(false);
    expect(bearerMatches(null, "secret-value")).toBe(false);
    expect(bearerMatches("secret-value", "secret-value")).toBe(false);
  });

  it("rejects secrets of a different length without throwing", () => {
    expect(bearerMatches("Bearer short", "much-longer-secret")).toBe(false);
  });
});
