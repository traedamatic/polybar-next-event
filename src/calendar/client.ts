import { createDAVClient, type DAVCalendar } from "tsdav";
import type { Config } from "@/config";
import { log } from "@/logger";
import { parseICS } from "./parser";
import type { CalendarEvent, CalendarInfo, FetchOptions } from "./types";

export class CalendarClient {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async fetchCalendars(): Promise<CalendarInfo[]> {
    const client = await this.createClient();
    const calendars = await client.fetchCalendars();

    return calendars.map((cal: DAVCalendar) => ({
      url: cal.url,
      displayName: String(cal.displayName || cal.url),
    }));
  }

  async fetchEvents(options: FetchOptions): Promise<CalendarEvent[]> {
    log("Creating CalDAV client...");
    const client = await this.createClient();

    log("Fetching calendars...");
    const calendars = await client.fetchCalendars();
    log(`Found ${calendars.length} calendar(s): ${calendars.map((c: DAVCalendar) => String(c.displayName || c.url)).join(", ")}`);

    if (calendars.length === 0) {
      log("No calendars found");
      return [];
    }

    const filter = this.config.calendar.calendarFilter;
    const filteredCalendars = filter.length > 0
      ? calendars.filter((c: DAVCalendar) => {
          const name = String(c.displayName || c.url);
          const included = filter.includes(name);
          if (!included) log(`Skipping calendar "${name}" (not in CALENDAR_FILTER)`);
          return included;
        })
      : calendars;

    const allEvents: CalendarEvent[] = [];

    for (const calendar of filteredCalendars) {
      const calName = String(calendar.displayName || calendar.url);
      log(`Fetching events from "${calName}"...`);

      const objects = await client.fetchCalendarObjects({
        calendar,
        timeRange: {
          start: formatDateUTC(options.timeRangeStart),
          end: formatDateUTC(options.timeRangeEnd),
        },
      });
      log(`Got ${objects.length} calendar object(s) from "${calName}"`);

      for (const obj of objects) {
        if (!obj.data) {
          log(`Skipping object with no data: ${obj.url}`);
          continue;
        }
        const events = parseICS(obj.data, {
          start: options.timeRangeStart,
          end: options.timeRangeEnd,
        });
        allEvents.push(...events);
      }
    }

    log(`Total events parsed: ${allEvents.length}`);
    return allEvents.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );
  }

  private async createClient() {
    try {
      return await createDAVClient({
        serverUrl: this.config.calendar.url,
        credentials: {
          username: this.config.calendar.username,
          password: this.config.calendar.password,
        },
        authMethod: "Basic",
        defaultAccountType: "caldav",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      log(`CalDAV client error: ${message}`);
      if (stack) log(stack);

      if (message.includes("401") || message.includes("Unauthorized")) {
        throw new Error(
          "Calendar authentication failed. Check your CALENDAR_USERNAME and CALENDAR_PASSWORD. " +
          "Fastmail requires an app-specific password (not your login password)."
        );
      }

      if (message.includes("ENOTFOUND") || message.includes("ECONNREFUSED")) {
        throw new Error(
          `Cannot reach calendar server at ${this.config.calendar.url}. Check your CALENDAR_URL.`
        );
      }

      if (message.includes("timeout") || message.includes("ETIMEDOUT")) {
        throw new Error(
          `Calendar server timed out at ${this.config.calendar.url}. Try again later.`
        );
      }

      throw new Error(`Calendar error: ${message}`);
    }
  }
}

const formatDateUTC = (date: Date): string => {
  return date.toISOString();
};
