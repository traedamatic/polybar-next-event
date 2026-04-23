import { createDAVClient, type DAVCalendar } from "tsdav";
import type { Config } from "@/config";
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
    const client = await this.createClient();
    const calendars = await client.fetchCalendars();

    if (calendars.length === 0) {
      return [];
    }

    const allEvents: CalendarEvent[] = [];

    for (const calendar of calendars) {
      const objects = await client.fetchCalendarObjects({
        calendar,
        timeRange: {
          start: formatDateUTC(options.timeRangeStart),
          end: formatDateUTC(options.timeRangeEnd),
        },
      });

      for (const obj of objects) {
        if (!obj.data) continue;
        const events = parseICS(obj.data);
        allEvents.push(...events);
      }
    }

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
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
};
