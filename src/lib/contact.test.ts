import { describe, expect, it } from "vitest";
import { parseContactEmail, parseContactMessage, parseContactName } from "./contact";

describe("parseContactName", () => {
  it("rejects a name that's too short", () => {
    expect(parseContactName("A")).toBe("invalid");
  });

  it("trims and collapses whitespace", () => {
    expect(parseContactName("  Jane   Doe  ")).toBe("Jane Doe");
  });

  it("rejects a name over the max length", () => {
    expect(parseContactName("x".repeat(101))).toBe("invalid");
  });
});

describe("parseContactEmail", () => {
  it("accepts a well-formed email", () => {
    expect(parseContactEmail("jane@example.com")).toBe("jane@example.com");
  });

  it("rejects an address with no @", () => {
    expect(parseContactEmail("not-an-email")).toBe("invalid");
  });

  it("rejects an address with no domain", () => {
    expect(parseContactEmail("jane@")).toBe("invalid");
  });

  it("rejects an empty string", () => {
    expect(parseContactEmail("   ")).toBe("invalid");
  });
});

describe("parseContactMessage", () => {
  it("rejects a message under 10 characters", () => {
    expect(parseContactMessage("too short")).toBe("invalid");
  });

  it("accepts a message at least 10 characters", () => {
    expect(parseContactMessage("Hello there!")).toBe("Hello there!");
  });

  it("rejects a message over the max length", () => {
    expect(parseContactMessage("x".repeat(2001))).toBe("invalid");
  });
});
