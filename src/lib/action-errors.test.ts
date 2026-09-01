import { describe, expect, it } from "vitest";
import {
  ACTION_GENERIC_ERROR,
  ACTION_NETWORK_ERROR,
  actionErrorMessage,
  actionResultErrorMessage,
  isLikelyNetworkError,
} from "./action-errors";

describe("isLikelyNetworkError", () => {
  it("detects failed fetch errors", () => {
    expect(isLikelyNetworkError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isLikelyNetworkError(new Error("NetworkError when attempting to fetch resource."))).toBe(
      true,
    );
  });

  it("ignores ordinary validation errors", () => {
    expect(isLikelyNetworkError(new Error("Give a short intro of 8–280 characters."))).toBe(false);
  });
});

describe("actionErrorMessage", () => {
  it("returns the network hint for fetch failures", () => {
    expect(actionErrorMessage(new TypeError("Failed to fetch"))).toBe(ACTION_NETWORK_ERROR);
  });

  it("falls back when the error is not useful", () => {
    expect(actionErrorMessage(new Error(" at foo"))).toBe(ACTION_GENERIC_ERROR);
  });
});

describe("actionResultErrorMessage", () => {
  it("uses the server message when present", () => {
    expect(actionResultErrorMessage("Could not save that setting. Try again.")).toBe(
      "Could not save that setting. Try again.",
    );
  });

  it("falls back when empty", () => {
    expect(actionResultErrorMessage("")).toBe(ACTION_GENERIC_ERROR);
  });
});
