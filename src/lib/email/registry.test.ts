import { describe, expect, it } from "vitest";
import { EMAIL_TEMPLATES, getEmailTemplateMeta, isEmailTemplateKey } from "./registry";

describe("EMAIL_TEMPLATES", () => {
  it("has a unique key for every entry", () => {
    const keys = EMAIL_TEMPLATES.map((meta) => meta.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("only uses tokens in its default subject/body that are actually listed as placeholders", () => {
    // The reverse isn't required — welcome lists {firstName} as available
    // for an admin to use even though the built-in default doesn't, since
    // the heading already greets by name.
    for (const meta of EMAIL_TEMPLATES) {
      const declared = new Set(meta.placeholders.map((p) => p.token));
      const used = [...`${meta.defaultSubject}\n${meta.defaultBody}`.matchAll(/\{(\w+)\}/g)].map(
        (match) => match[1],
      );
      for (const token of used) {
        expect(declared.has(token), `${meta.key}: {${token}} is used but not listed as a placeholder`).toBe(
          true,
        );
      }
    }
  });
});

describe("getEmailTemplateMeta", () => {
  it("returns the matching entry", () => {
    expect(getEmailTemplateMeta("welcome").label).toBe("Welcome");
  });

  it("throws for an unknown key", () => {
    // @ts-expect-error deliberately invalid for the test
    expect(() => getEmailTemplateMeta("not-a-real-key")).toThrow();
  });
});

describe("isEmailTemplateKey", () => {
  it("accepts every real key", () => {
    for (const meta of EMAIL_TEMPLATES) {
      expect(isEmailTemplateKey(meta.key)).toBe(true);
    }
  });

  it("rejects an unknown string", () => {
    expect(isEmailTemplateKey("not-a-real-key")).toBe(false);
  });
});
