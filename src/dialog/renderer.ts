import type { CalendarEvent } from "@/calendar/types";
import type { Config } from "@/config";
import { getNextEvent } from "@/event/next-event";

const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const formatDateShort = (date: Date): string => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
};

const escapeHtml = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const renderEventDetails = (event: CalendarEvent): string => {
  const lines: string[] = [];

  lines.push(`<b>${escapeHtml(event.title)}</b>`);
  lines.push("");

  if (event.isAllDay) {
    lines.push(`📅 ${formatDateShort(event.startTime)} (all day)`);
  } else {
    const sameDay = event.startTime.toDateString() === event.endTime.toDateString();
    if (sameDay) {
      lines.push(`🕐 ${formatTime(event.startTime)} – ${formatTime(event.endTime)}`);
      lines.push(`📅 ${formatDateShort(event.startTime)}`);
    } else {
      lines.push(`🕐 ${formatDateShort(event.startTime)} ${formatTime(event.startTime)} – ${formatDateShort(event.endTime)} ${formatTime(event.endTime)}`);
    }
  }

  if (event.location) {
    lines.push(`📍 ${escapeHtml(event.location)}`);
  }

  if (event.description) {
    lines.push("");
    lines.push(escapeHtml(event.description));
  }

  if (event.attendees && event.attendees.length > 0) {
    lines.push("");
    lines.push(`👥 ${event.attendees.map(escapeHtml).join(", ")}`);
  }

  return lines.join("\n");
};

export const renderUpcomingList = (
  events: CalendarEvent[],
  now: Date,
  config: Config,
  maxItems: number = 5
): string[] => {
  const upcoming = events
    .filter((e) => !e.isAllDay && e.startTime.getTime() > now.getTime())
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, maxItems);

  return upcoming.map((event) => {
    const nextEvent = getNextEvent([event], now, config);
    const color = nextEvent?.color ?? config.colors.far;
    const time = formatTime(event.startTime);
    const title = event.title.length > 30
      ? `${event.title.slice(0, 29)}…`
      : event.title;

    return `<span foreground="${color}">${time}</span> ${escapeHtml(title)}`;
  });
};
