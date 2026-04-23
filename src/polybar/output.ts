import { resolve, dirname } from "node:path";
import { loadConfig } from "@/config";
import { CalendarClient } from "@/calendar/client";
import { getNextEvent } from "@/event/next-event";
import { formatForPolybar, formatError } from "./formatter";
import { log } from "@/logger";

// Resolve .env relative to the script location (project root)
// so it works regardless of polybar's cwd
const scriptDir = dirname(Bun.main);
const projectRoot = resolve(scriptDir, "..");
const envPath = resolve(projectRoot, ".env");

const envFile = Bun.file(envPath);
if (await envFile.exists()) {
  const envContent = await envFile.text();
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const run = async (): Promise<void> => {
  try {
    log("--- polybar-next-event started ---");
    log(`Script: ${Bun.main}`);
    log(`Project root: ${projectRoot}`);
    log(`.env path: ${envPath} (exists: ${await envFile.exists()})`);
    const config = loadConfig();
    log(`Config loaded: url=${config.calendar.url}, user=${config.calendar.username}`);

    const client = new CalendarClient(config);

    const now = new Date();
    const endOfWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    log(`Fetching events from ${now.toISOString()} to ${endOfWindow.toISOString()}`);

    const events = await client.fetchEvents({
      timeRangeStart: now,
      timeRangeEnd: endOfWindow,
    });
    log(`Fetched ${events.length} event(s)`);

    const nextEvent = getNextEvent(events, now, config);
    if (nextEvent) {
      log(`Next event: "${nextEvent.event.title}" at ${nextEvent.event.startTime.toISOString()} (${nextEvent.urgency}, ${Math.round(nextEvent.minutesUntilStart)}min away)`);
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
