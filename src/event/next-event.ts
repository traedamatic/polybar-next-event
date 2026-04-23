import type { CalendarEvent } from "@/calendar/types";
import type { Config } from "@/config";
import type { NextEvent, UrgencyLevel } from "./types";

const URGENT_THRESHOLD_MINUTES = 15;
const MEDIUM_THRESHOLD_MINUTES = 60;

export const getNextEvent = (
  events: CalendarEvent[],
  now: Date,
  config: Config
): NextEvent | null => {
  const nowMs = now.getTime();

  const upcoming = events
    .filter((e) => !e.isAllDay && e.startTime.getTime() > nowMs)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

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
