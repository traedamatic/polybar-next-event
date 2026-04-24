import { appendFileSync } from "node:fs";

const LOG_FILE = "/tmp/polybar-next-event.log";
const MAX_LOG_LINES = 500;

const timestamp = (): string => {
  const now = new Date();
  return now.toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
};

export const log = (message: string): void => {
  const line = `[${timestamp()}] ${message}\n`;
  try {
    appendFileSync(LOG_FILE, line);
  } catch {
    // Logging should never crash the app
  }
};

export const truncateLog = (): void => {
  try {
    const result = Bun.spawnSync(["tail", "-n", String(MAX_LOG_LINES), LOG_FILE]);
    const content = new TextDecoder().decode(result.stdout);
    Bun.write(LOG_FILE, content);
  } catch {
    // Best effort
  }
};
