import { resolve, dirname } from "node:path";
import { loadConfig } from "@/config";
import { CalendarClient } from "@/calendar/client";
import { getNextEvent } from "@/event/next-event";
import { formatForPolybar, formatError } from "./formatter";

// Resolve .env relative to the script location (project root)
// so it works regardless of polybar's cwd
const scriptDir = dirname(Bun.main);
// dist/polybar/output.js -> up two levels to project root
const projectRoot = resolve(scriptDir, "../..");
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
