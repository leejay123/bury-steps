import { describe, expect, it } from "vitest";
import {
  EMERGENCY_CONTACT_PAIR_MESSAGE,
  EMERGENCY_CONTACT_PHONE_MESSAGE,
  EMERGENCY_CONTACT_REQUIRED_MESSAGE,
  emergencyPhoneHref,
  parseEmergencyContact,
} from "./emergency-contact";

describe("parseEmergencyContact", () => {
  it("allows both fields to be blank when a contact is optional", () => {
    expect(parseEmergencyContact("", "  ", false)).toEqual({ ok: true, name: null, phone: null });
  });

  it("refuses a blank contact when one is required", () => {
    expect(parseEmergencyContact("", "", true)).toEqual({
      ok: false,
      error: EMERGENCY_CONTACT_REQUIRED_MESSAGE,
    });
  });

  it("refuses a name without a number", () => {
    expect(parseEmergencyContact("Alex Stone", "", false)).toEqual({
      ok: false,
      error: EMERGENCY_CONTACT_PAIR_MESSAGE,
    });
  });

  it("accepts a UK mobile number and keeps the name", () => {
    expect(parseEmergencyContact("  Alex Stone  ", "07700 900 123", false)).toEqual({
      ok: true,
      name: "Alex Stone",
      phone: "07700 900 123",
    });
  });

  it("rejects words in the phone field", () => {
    expect(parseEmergencyContact("Alex", "call mum", true)).toEqual({
      ok: false,
      error: EMERGENCY_CONTACT_PHONE_MESSAGE,
    });
  });
});

describe("emergencyPhoneHref", () => {
  it("keeps a leading plus and drops spaces", () => {
    expect(emergencyPhoneHref("+44 7700 900123")).toBe("tel:+447700900123");
  });
});
