import { resolve, dirname } from "node:path";
import { Webview, SizeHint } from "webview-bun";
import { loadConfig } from "@/config";
import { CalendarClient } from "@/calendar/client";
import { getNextEvent } from "@/event/next-event";
import {
  renderEventDetails,
  renderUpcomingList,
  renderDialogHtml,
  renderErrorHtml,
} from "./renderer";

// Resolve .env relative to the script location (project root)
// so it works regardless of polybar's cwd
const scriptDir = dirname(Bun.main);
// src/dialog/show-dialog.ts -> up two levels to project root
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

const PID_FILE = "/tmp/polybar-next-event-dialog.pid";

const killExistingDialog = async (): Promise<void> => {
  try {
    const pidFile = Bun.file(PID_FILE);
    if (await pidFile.exists()) {
      const pid = parseInt(await pidFile.text(), 10);
      if (!isNaN(pid)) {
        try {
          process.kill(pid);
        } catch {
          // Process already gone
        }
      }
      await Bun.write(PID_FILE, "");
    }
  } catch {
    // PID file doesn't exist or can't be read
  }
};

const showDialog = (html: string): void => {
  const webview = new Webview();
  webview.title = "Next Event";
  webview.size = { width: 500, height: 400, hint: SizeHint.FIXED };
  webview.setHTML(html);
  webview.run();
  webview.destroy();
};

const run = async (): Promise<void> => {
  await killExistingDialog();
  await Bun.write(PID_FILE, String(process.pid));

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

    const detailsHtml = nextEvent
      ? renderEventDetails(nextEvent.event)
      : `<h2>No upcoming events</h2>`;

    const upcomingLines = renderUpcomingList(events, now, config);
    const html = renderDialogHtml(detailsHtml, upcomingLines);

    showDialog(html);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    showDialog(renderErrorHtml(message));
  } finally {
    try {
      await Bun.write(PID_FILE, "");
    } catch {
      // Cleanup best effort
    }
  }
};

await run();
