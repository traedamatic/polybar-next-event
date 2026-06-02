export interface CalendarAccount {
  url: string;
  username: string;
  password: string;
  calendarFilter: string[];
}

export interface Config {
  calendars: CalendarAccount[];
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

const parseAccount = (
  prefix: string,
  missing: string[],
): CalendarAccount | null => {
  const url = process.env[`${prefix}URL`];
  const username = process.env[`${prefix}USERNAME`];
  const password = process.env[`${prefix}PASSWORD`];

  // Account is only considered present if its URL is set.
  if (!url) return null;

  if (!username) missing.push(`${prefix}USERNAME`);
  if (!password) missing.push(`${prefix}PASSWORD`);

  return {
    url,
    username: username ?? "",
    password: password ?? "",
    calendarFilter: parseCalendarFilter(process.env[`${prefix}FILTER`]),
  };
};

const collectAccounts = (missing: string[]): CalendarAccount[] => {
  const accounts: CalendarAccount[] = [];

  // Numbered accounts: CALENDAR_1_URL, CALENDAR_2_URL, ...
  const indices = Object.keys(process.env)
    .map((key) => key.match(/^CALENDAR_(\d+)_URL$/))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => parseInt(m[1]!, 10))
    .sort((a, b) => a - b);

  for (const index of indices) {
    const account = parseAccount(`CALENDAR_${index}_`, missing);
    if (account) accounts.push(account);
  }

  // Legacy unnumbered account (backward compatible single-calendar setup).
  const legacy = parseAccount("CALENDAR_", missing);
  if (legacy) accounts.push(legacy);

  return accounts;
};

export const loadConfig = (): Config => {
  const missing: string[] = [];
  const calendars = collectAccounts(missing);

  if (calendars.length === 0) {
    throw new Error(
      "No calendar configured. Set CALENDAR_URL (single account) or " +
        "CALENDAR_1_URL, CALENDAR_2_URL, ... (multiple accounts) along with " +
        "the matching USERNAME and PASSWORD variables in your .env file or environment.",
    );
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        `Set them in your .env file or environment.`,
    );
  }

  return {
    calendars,
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
