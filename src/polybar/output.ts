import { loadConfig } from "@/config";
import { loadEnv } from "@/env";
import { fetchAllEvents } from "@/calendar/client";
import { getNextEvent } from "@/event/next-event";
import { formatForPolybar, formatError } from "./formatter";
import { log } from "@/logger";

await loadEnv();

const run = async (): Promise<void> => {
  try {
    log("--- polybar-next-event started ---");
    const config = loadConfig();
    log(`Config loaded: ${config.calendars.length} calendar account(s)`);
    config.calendars.forEach((account, index) => {
      log(
        `  Account ${index + 1}: url=${account.url}, user=${account.username}, filter=[${account.calendarFilter.join(", ")}]`,
      );
    });

    const now = new Date();
    const endOfWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    log(
      `Fetching events from ${now.toISOString()} to ${endOfWindow.toISOString()}`,
    );

    const events = await fetchAllEvents(config.calendars, {
      timeRangeStart: now,
      timeRangeEnd: endOfWindow,
    });
    log(`Fetched ${events.length} event(s)`);

    const nextEvent = getNextEvent(events, now, config);
    if (nextEvent) {
      log(
        `Next event: "${nextEvent.event.title}" at ${nextEvent.event.startTime.toISOString()} (${nextEvent.urgency}, ${Math.round(nextEvent.minutesUntilStart)}min away)`,
      );
    } else {
      log("No upcoming events");
    }

    console.log(formatForPolybar(nextEvent));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    log(`ERROR: ${message}`);
    if (stack) {
      log(stack);
    }
    console.log(formatError());
  }
};

await run();
