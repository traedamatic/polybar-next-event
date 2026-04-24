import { log } from "./logger";

export interface Config {
  calendar: {
    url: string;
    username: string;
    password: string;
    calendarFilter: string[];
  };
  polling: {
    intervalSeconds: number;
  };
  colors: {
    far: string;
    medium: string;
    urgent: string;
  };
}

const DEFAULTS = {
  pollingIntervalSeconds: 60,
  colors: {
    far: "#A3BE8C",
    medium: "#EBCB8B",
    urgent: "#BF616A",
  },
} as const;

const isValidHexColor = (value: string): boolean =>
  /^#[0-9A-Fa-f]{6}$/.test(value);

const parsePositiveInt = (
  value: string | undefined,
  fallback: number,
): number => {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const parseColor = (value: string | undefined, fallback: string): string => {
  if (!value) return fallback;
  if (!isValidHexColor(value)) return fallback;
  return value;
};

const parseCalendarFilter = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

export const loadConfig = (): Config => {
  const missing: string[] = [];

  const url = process.env.CALENDAR_URL;
  const username = process.env.CALENDAR_USERNAME;
  const password = process.env.CALENDAR_PASSWORD;

  if (!url) missing.push("CALENDAR_URL");
  if (!username) missing.push("CALENDAR_USERNAME");
  if (!password) missing.push("CALENDAR_PASSWORD");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        `Set them in your .env file or environment.`,
    );
  }

  return {
    calendar: {
      url: url!,
      username: username!,
      password: password!,
      calendarFilter: parseCalendarFilter(process.env.CALENDAR_FILTER),
    },
    polling: {
      intervalSeconds: parsePositiveInt(
        process.env.POLL_INTERVAL,
        DEFAULTS.pollingIntervalSeconds,
      ),
    },
    colors: {
      far: parseColor(process.env.COLOR_FAR, DEFAULTS.colors.far),
      medium: parseColor(process.env.COLOR_MEDIUM, DEFAULTS.colors.medium),
      urgent: parseColor(process.env.COLOR_URGENT, DEFAULTS.colors.urgent),
    },
  };
};
