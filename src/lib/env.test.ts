import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateEnv } from "./env";

const ORIGINAL_ENV = { ...process.env };

function resetEnv() {
  process.env = { ...ORIGINAL_ENV };
}

function setNodeEnv(value: string) {
  // NODE_ENV is typed as a read-only property on process.env.
  Object.assign(process.env, { NODE_ENV: value });
}

function clearAll() {
  delete process.env.DATABASE_URL;
  delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  delete process.env.CLERK_SECRET_KEY;
  delete process.env.CRON_SECRET;
  delete process.env.INITIAL_ADMIN_EMAIL;
  delete process.env.VERCEL_ENV;
  setNodeEnv("test");
}

function setAllRequired() {
  process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_123";
  process.env.CLERK_SECRET_KEY = "sk_test_123";
}

describe("validateEnv", () => {
  beforeEach(() => {
    resetEnv();
    clearAll();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    resetEnv();
    vi.restoreAllMocks();
  });

  it("throws in a real production boot when required vars are missing", () => {
    setNodeEnv("production");
    expect(() => validateEnv()).toThrow(/DATABASE_URL/);
  });

  it("does not throw in production once all required vars are set", () => {
    setNodeEnv("production");
    setAllRequired();
    expect(() => validateEnv()).not.toThrow();
  });

  it("only warns, never throws, in local dev", () => {
    setNodeEnv("development");
    expect(() => validateEnv()).not.toThrow();
    expect(console.error).toHaveBeenCalled();
  });

  it("only warns on Vercel Preview even in a production NODE_ENV", () => {
    setNodeEnv("production");
    process.env.VERCEL_ENV = "preview";
    expect(() => validateEnv()).not.toThrow();
    expect(console.error).toHaveBeenCalled();
  });

  it("warns (but does not throw) about missing recommended vars even when required ones are set", () => {
    setNodeEnv("production");
    setAllRequired();
    expect(() => validateEnv()).not.toThrow();
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("CRON_SECRET"));
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("INITIAL_ADMIN_EMAIL"));
  });

  it("stays silent about recommended vars once they're set", () => {
    setNodeEnv("production");
    setAllRequired();
    process.env.CRON_SECRET = "some-secret";
    process.env.INITIAL_ADMIN_EMAIL = "admin@example.com";
    validateEnv();
    expect(console.warn).not.toHaveBeenCalled();
  });
});
