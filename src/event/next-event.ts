import type { CalendarEvent } from "@/calendar/types";
import type { Config } from "@/config";
import { log } from "@/logger";
import type { NextEvent, UrgencyLevel } from "./types";

const URGENT_THRESHOLD_MINUTES = 15;
const MEDIUM_THRESHOLD_MINUTES = 60;

export const getNextEvent = (
  events: CalendarEvent[],
  now: Date,
  config: Config
): NextEvent | null => {
  const nowMs = now.getTime();

  log(`getNextEvent: ${events.length} total events, now=${now.toISOString()}`);
  for (const e of events) {
    const delta = Math.round((e.startTime.getTime() - nowMs) / 60000);
    log(`  "${e.title}" start=${e.startTime.toISOString()} allDay=${e.isAllDay} delta=${delta}min`);
  }

  const upcoming = events
    .filter((e) => !e.isAllDay && e.startTime.getTime() > nowMs)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  log(`getNextEvent: ${upcoming.length} upcoming after filter`);

  if (upcoming.length === 0) return null;

  const event = upcoming[0];
  const minutesUntilStart = (event.startTime.getTime() - nowMs) / (1000 * 60);
  const urgency = getUrgency(minutesUntilStart);
  const color = getColor(urgency, config);

  return { event, minutesUntilStart, urgency, color };
};

const getUrgency = (minutesUntilStart: number): UrgencyLevel => {
  if (minutesUntilStart < URGENT_THRESHOLD_MINUTES) return "urgent";
  if (minutesUntilStart < MEDIUM_THRESHOLD_MINUTES) return "medium";
  return "far";
};

const getColor = (urgency: UrgencyLevel, config: Config): string => {
  return config.colors[urgency];
};
