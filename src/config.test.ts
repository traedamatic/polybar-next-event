import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { loadConfig } from "@/config";

const REQUIRED_ENV = {
  CALENDAR_URL: "https://caldav.fastmail.com/dav/calendars/user/test@fastmail.com/",
  CALENDAR_USERNAME: "test@fastmail.com",
  CALENDAR_PASSWORD: "test-app-password",
};

// Any CALENDAR_* env key (numbered or legacy) plus the shared option keys.
const calendarKeys = (): string[] =>
  Object.keys(process.env).filter((key) => key.startsWith("CALENDAR_"));

const OPTION_KEYS = ["POLL_INTERVAL", "COLOR_FAR", "COLOR_MEDIUM", "COLOR_URGENT"];

const saveEnv = (): Record<string, string | undefined> => {
  const saved: Record<string, string | undefined> = {};
  for (const key of [...calendarKeys(), ...OPTION_KEYS]) {
    saved[key] = process.env[key];
  }
  return saved;
};

const restoreEnv = (saved: Record<string, string | undefined>): void => {
  // Clear anything set during the test, then restore the snapshot.
  clearEnv();
  for (const [key, value] of Object.entries(saved)) {
    if (value !== undefined) {
      process.env[key] = value;
    }
  }
};

const clearEnv = (): void => {
  for (const key of [...calendarKeys(), ...OPTION_KEYS]) {
    delete process.env[key];
  }
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

    expect(config.calendars).toHaveLength(1);
    expect(config.calendars[0]!.url).toBe(REQUIRED_ENV.CALENDAR_URL);
    expect(config.calendars[0]!.username).toBe(REQUIRED_ENV.CALENDAR_USERNAME);
    expect(config.calendars[0]!.password).toBe(REQUIRED_ENV.CALENDAR_PASSWORD);
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

  test("throws when no calendar is configured at all", () => {
    expect(() => loadConfig()).toThrow("No calendar configured");
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

  test("returns empty calendarFilter when CALENDAR_FILTER is unset", () => {
    Object.assign(process.env, REQUIRED_ENV);

    const config = loadConfig();

    expect(config.calendars[0]!.calendarFilter).toEqual([]);
  });

  test("parses comma-separated CALENDAR_FILTER", () => {
    Object.assign(process.env, REQUIRED_ENV);
    process.env.CALENDAR_FILTER = "Persönlich,Tredis (Fam Cal),Nicolas@konek.to";

    const config = loadConfig();

    expect(config.calendars[0]!.calendarFilter).toEqual([
      "Persönlich",
      "Tredis (Fam Cal)",
      "Nicolas@konek.to",
    ]);
  });

  test("trims whitespace around calendar filter names", () => {
    Object.assign(process.env, REQUIRED_ENV);
    process.env.CALENDAR_FILTER = " Persönlich , Tredis (Fam Cal) ";

    const config = loadConfig();

    expect(config.calendars[0]!.calendarFilter).toEqual([
      "Persönlich",
      "Tredis (Fam Cal)",
    ]);
  });

  test("ignores trailing commas and empty segments in CALENDAR_FILTER", () => {
    Object.assign(process.env, REQUIRED_ENV);
    process.env.CALENDAR_FILTER = "Persönlich,,Tredis (Fam Cal),";

    const config = loadConfig();

    expect(config.calendars[0]!.calendarFilter).toEqual([
      "Persönlich",
      "Tredis (Fam Cal)",
    ]);
  });

  test("returns empty calendarFilter for empty CALENDAR_FILTER string", () => {
    Object.assign(process.env, REQUIRED_ENV);
    process.env.CALENDAR_FILTER = "";

    const config = loadConfig();

    expect(config.calendars[0]!.calendarFilter).toEqual([]);
  });

  test("parses multiple numbered accounts in ascending index order", () => {
    process.env.CALENDAR_1_URL = "https://caldav.fastmail.com/private/";
    process.env.CALENDAR_1_USERNAME = "private@fastmail.com";
    process.env.CALENDAR_1_PASSWORD = "private-pw";
    process.env.CALENDAR_2_URL = "https://caldav.fastmail.com/work/";
    process.env.CALENDAR_2_USERNAME = "work@fastmail.com";
    process.env.CALENDAR_2_PASSWORD = "work-pw";

    const config = loadConfig();

    expect(config.calendars).toHaveLength(2);
    expect(config.calendars[0]!.username).toBe("private@fastmail.com");
    expect(config.calendars[1]!.username).toBe("work@fastmail.com");
  });

  test("parses per-account CALENDAR_N_FILTER independently", () => {
    process.env.CALENDAR_1_URL = "https://caldav.fastmail.com/private/";
    process.env.CALENDAR_1_USERNAME = "private@fastmail.com";
    process.env.CALENDAR_1_PASSWORD = "private-pw";
    process.env.CALENDAR_1_FILTER = "Persönlich";
    process.env.CALENDAR_2_URL = "https://caldav.fastmail.com/work/";
    process.env.CALENDAR_2_USERNAME = "work@fastmail.com";
    process.env.CALENDAR_2_PASSWORD = "work-pw";
    process.env.CALENDAR_2_FILTER = "Work, Team Cal";

    const config = loadConfig();

    expect(config.calendars[0]!.calendarFilter).toEqual(["Persönlich"]);
    expect(config.calendars[1]!.calendarFilter).toEqual(["Work", "Team Cal"]);
  });

  test("appends a legacy unnumbered account after numbered accounts", () => {
    process.env.CALENDAR_1_URL = "https://caldav.fastmail.com/work/";
    process.env.CALENDAR_1_USERNAME = "work@fastmail.com";
    process.env.CALENDAR_1_PASSWORD = "work-pw";
    Object.assign(process.env, REQUIRED_ENV);

    const config = loadConfig();

    expect(config.calendars).toHaveLength(2);
    expect(config.calendars[0]!.username).toBe("work@fastmail.com");
    expect(config.calendars[1]!.url).toBe(REQUIRED_ENV.CALENDAR_URL);
  });

  test("throws naming the exact missing key for a numbered account", () => {
    process.env.CALENDAR_2_URL = "https://caldav.fastmail.com/work/";
    process.env.CALENDAR_2_USERNAME = "work@fastmail.com";
    // CALENDAR_2_PASSWORD intentionally omitted

    expect(() => loadConfig()).toThrow("CALENDAR_2_PASSWORD");
  });
});
