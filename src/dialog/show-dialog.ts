import { loadConfig } from "@/config";
import { CalendarClient } from "@/calendar/client";
import { getNextEvent } from "@/event/next-event";
import { renderEventDetails, renderUpcomingList } from "./renderer";

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

const showYadDialog = async (
  detailsHtml: string,
  upcomingLines: string[]
): Promise<void> => {
  const upcomingText = upcomingLines.length > 0
    ? upcomingLines.join("\n")
    : "No upcoming events";

  const hasYad = await commandExists("yad");

  if (hasYad) {
    await showWithYad(detailsHtml, upcomingText);
  } else {
    await showWithZenity(detailsHtml, upcomingText);
  }
};

const commandExists = async (cmd: string): Promise<boolean> => {
  try {
    const proc = Bun.spawn(["which", cmd], { stdout: "pipe", stderr: "pipe" });
    await proc.exited;
    return proc.exitCode === 0;
  } catch {
    return false;
  }
};

const showWithYad = async (details: string, upcoming: string): Promise<void> => {
  const combinedText = `${details}\n\n<b>━━━ Upcoming Events ━━━</b>\n\n${upcoming}`;

  const proc = Bun.spawn([
    "yad",
    "--title=Next Event",
    "--width=500",
    "--height=400",
    "--posx=100",
    "--posy=30",
    "--text", combinedText,
    "--text-info",
    "--html",
    "--no-buttons",
    "--escape-ok",
    "--undecorated",
  ], {
    stdout: "pipe",
    stderr: "pipe",
  });

  await Bun.write(PID_FILE, String(proc.pid));
  await proc.exited;

  try {
    await Bun.write(PID_FILE, "");
  } catch {
    // Cleanup best effort
  }
};

const showWithZenity = async (details: string, upcoming: string): Promise<void> => {
  const plainText = `${details}\n\n── Upcoming Events ──\n\n${upcoming}`
    .replace(/<b>/g, "")
    .replace(/<\/b>/g, "")
    .replace(/<span[^>]*>/g, "")
    .replace(/<\/span>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  const proc = Bun.spawn([
    "zenity",
    "--info",
    "--title=Next Event",
    "--width=500",
    "--height=400",
    "--text", plainText,
    "--no-wrap",
  ], {
    stdout: "pipe",
    stderr: "pipe",
  });

  await Bun.write(PID_FILE, String(proc.pid));
  await proc.exited;

  try {
    await Bun.write(PID_FILE, "");
  } catch {
    // Cleanup best effort
  }
};

const run = async (): Promise<void> => {
  await killExistingDialog();

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
      : "<b>No upcoming events</b>";

    const upcomingLines = renderUpcomingList(events, now, config);

    await showYadDialog(detailsHtml, upcomingLines);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    const hasZenity = await commandExists("zenity");
    if (hasZenity) {
      const proc = Bun.spawn([
        "zenity",
        "--error",
        "--title=Calendar Error",
        "--text", `Failed to load calendar:\n${message}`,
      ], { stdout: "pipe", stderr: "pipe" });
      await proc.exited;
    } else {
      console.error(`Calendar error: ${message}`);
    }
  }
};

await run();
