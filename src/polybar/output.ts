import { loadConfig } from "@/config";
import { CalendarClient } from "@/calendar/client";
import { getNextEvent } from "@/event/next-event";
import { formatForPolybar, formatError } from "./formatter";

const run = async (): Promise<void> => {
  try {
    const config = loadConfig();
    const client = new CalendarClient(config);

    const now = new Date();
    const endOfWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const events = await client.fetchEvents({
      timeRangeStart: now,
      timeRangeEnd: endOfWindow,
    });

    const nextEvent = getNextEvent(events, now, config);
    console.log(formatForPolybar(nextEvent));
  } catch {
    console.log(formatError());
  }
};

await run();
