import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { loadConfig } from "@/config";

const REQUIRED_ENV = {
  CALENDAR_URL: "https://caldav.fastmail.com/dav/calendars/user/test@fastmail.com/",
  CALENDAR_USERNAME: "test@fastmail.com",
  CALENDAR_PASSWORD: "test-app-password",
};

const saveEnv = (): Record<string, string | undefined> => {
  const saved: Record<string, string | undefined> = {};
  const keys = [
    "CALENDAR_URL", "CALENDAR_USERNAME", "CALENDAR_PASSWORD",
    "POLL_INTERVAL", "COLOR_FAR", "COLOR_MEDIUM", "COLOR_URGENT",
  ];
  for (const key of keys) {
    saved[key] = process.env[key];
  }
  return saved;
};

const restoreEnv = (saved: Record<string, string | undefined>): void => {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
};

const clearEnv = (): void => {
  delete process.env.CALENDAR_URL;
  delete process.env.CALENDAR_USERNAME;
  delete process.env.CALENDAR_PASSWORD;
  delete process.env.POLL_INTERVAL;
  delete process.env.COLOR_FAR;
  delete process.env.COLOR_MEDIUM;
  delete process.env.COLOR_URGENT;
};

describe("loadConfig", () => {
  let savedEnv: Record<string, string | undefined>;

  beforeEach(() => {
    savedEnv = saveEnv();
    clearEnv();
  });

  afterEach(() => {
    restoreEnv(savedEnv);
  });

  test("returns valid config with all required env vars", () => {
    Object.assign(process.env, REQUIRED_ENV);

    const config = loadConfig();

    expect(config.calendar.url).toBe(REQUIRED_ENV.CALENDAR_URL);
    expect(config.calendar.username).toBe(REQUIRED_ENV.CALENDAR_USERNAME);
    expect(config.calendar.password).toBe(REQUIRED_ENV.CALENDAR_PASSWORD);
  });

  test("throws when CALENDAR_URL is missing", () => {
    process.env.CALENDAR_USERNAME = "user";
    process.env.CALENDAR_PASSWORD = "pass";

    expect(() => loadConfig()).toThrow("CALENDAR_URL");
  });

  test("throws when CALENDAR_USERNAME is missing", () => {
    process.env.CALENDAR_URL = "https://example.com";
    process.env.CALENDAR_PASSWORD = "pass";

    expect(() => loadConfig()).toThrow("CALENDAR_USERNAME");
  });

  test("throws when CALENDAR_PASSWORD is missing", () => {
    process.env.CALENDAR_URL = "https://example.com";
    process.env.CALENDAR_USERNAME = "user";

    expect(() => loadConfig()).toThrow("CALENDAR_PASSWORD");
  });

  test("throws listing all missing vars at once", () => {
    expect(() => loadConfig()).toThrow(
      "Missing required environment variables: CALENDAR_URL, CALENDAR_USERNAME, CALENDAR_PASSWORD"
    );
  });

  test("uses default polling interval of 60s", () => {
    Object.assign(process.env, REQUIRED_ENV);

    const config = loadConfig();

    expect(config.polling.intervalSeconds).toBe(60);
  });

  test("accepts custom polling interval", () => {
    Object.assign(process.env, REQUIRED_ENV);
    process.env.POLL_INTERVAL = "120";

    const config = loadConfig();

    expect(config.polling.intervalSeconds).toBe(120);
  });

  test("falls back to default for invalid polling interval", () => {
    Object.assign(process.env, REQUIRED_ENV);
    process.env.POLL_INTERVAL = "abc";

    const config = loadConfig();

    expect(config.polling.intervalSeconds).toBe(60);
  });

  test("falls back to default for negative polling interval", () => {
    Object.assign(process.env, REQUIRED_ENV);
    process.env.POLL_INTERVAL = "-5";

    const config = loadConfig();

    expect(config.polling.intervalSeconds).toBe(60);
  });

  test("uses default colors", () => {
    Object.assign(process.env, REQUIRED_ENV);

    const config = loadConfig();

    expect(config.colors.far).toBe("#A3BE8C");
    expect(config.colors.medium).toBe("#EBCB8B");
    expect(config.colors.urgent).toBe("#BF616A");
  });

  test("accepts custom valid hex colors", () => {
    Object.assign(process.env, REQUIRED_ENV);
    process.env.COLOR_FAR = "#00FF00";
    process.env.COLOR_MEDIUM = "#FFFF00";
    process.env.COLOR_URGENT = "#FF0000";

    const config = loadConfig();

    expect(config.colors.far).toBe("#00FF00");
    expect(config.colors.medium).toBe("#FFFF00");
    expect(config.colors.urgent).toBe("#FF0000");
  });

  test("falls back to default for invalid hex color", () => {
    Object.assign(process.env, REQUIRED_ENV);
    process.env.COLOR_FAR = "not-a-color";
    process.env.COLOR_MEDIUM = "#GGG";
    process.env.COLOR_URGENT = "red";

    const config = loadConfig();

    expect(config.colors.far).toBe("#A3BE8C");
    expect(config.colors.medium).toBe("#EBCB8B");
    expect(config.colors.urgent).toBe("#BF616A");
  });
});
