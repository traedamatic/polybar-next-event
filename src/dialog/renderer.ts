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

export const escapeHtml = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const renderEventDetails = (event: CalendarEvent): string => {
  const lines: string[] = [];

  lines.push(`<h2>${escapeHtml(event.title)}</h2>`);

  if (event.isAllDay) {
    lines.push(`<div class="meta">📅 ${formatDateShort(event.startTime)} (all day)</div>`);
  } else {
    const sameDay = event.startTime.toDateString() === event.endTime.toDateString();
    if (sameDay) {
      lines.push(`<div class="meta">🕐 ${formatTime(event.startTime)} – ${formatTime(event.endTime)}</div>`);
      lines.push(`<div class="meta">📅 ${formatDateShort(event.startTime)}</div>`);
    } else {
      lines.push(`<div class="meta">🕐 ${formatDateShort(event.startTime)} ${formatTime(event.startTime)} – ${formatDateShort(event.endTime)} ${formatTime(event.endTime)}</div>`);
    }
  }

  if (event.location) {
    lines.push(`<div class="meta">📍 ${escapeHtml(event.location)}</div>`);
  }

  if (event.description) {
    lines.push(`<div class="description">${escapeHtml(event.description)}</div>`);
  }

  if (event.attendees && event.attendees.length > 0) {
    lines.push(`<div class="attendees">👥 ${event.attendees.map(escapeHtml).join(", ")}</div>`);
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

    return `<div class="upcoming-item"><span style="color: ${color}">${time}</span> ${escapeHtml(title)}</div>`;
  });
};

const CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, 'Segoe UI', Roboto, sans-serif;
    background: #2E3440;
    color: #D8DEE9;
    padding: 20px;
    font-size: 14px;
    line-height: 1.5;
  }
  h2 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 12px;
    color: #ECEFF4;
  }
  .meta {
    margin-bottom: 4px;
    color: #D8DEE9;
  }
  .description {
    margin-top: 12px;
    color: #B0B8C8;
    white-space: pre-wrap;
  }
  .attendees {
    margin-top: 12px;
    color: #B0B8C8;
  }
  .divider {
    border: none;
    border-top: 1px solid #3B4252;
    margin: 16px 0;
  }
  .section-title {
    font-size: 13px;
    font-weight: 600;
    color: #81A1C1;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .upcoming-item {
    padding: 4px 0;
    font-size: 13px;
  }
  .empty {
    color: #616E88;
    font-style: italic;
  }
  .error {
    color: #BF616A;
  }
  .error h2 {
    color: #BF616A;
  }
  .error pre {
    margin-top: 12px;
    white-space: pre-wrap;
    font-size: 12px;
    color: #D08770;
  }
`;

export const renderDialogHtml = (
  detailsHtml: string,
  upcomingLines: string[]
): string => {
  const upcomingSection = upcomingLines.length > 0
    ? upcomingLines.join("\n")
    : `<div class="empty">No upcoming events</div>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${CSS}</style></head>
<body>
  ${detailsHtml}
  <hr class="divider">
  <div class="section-title">Upcoming Events</div>
  ${upcomingSection}
</body>
</html>`;
};

export const renderErrorHtml = (message: string): string => {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>${CSS}</style></head>
<body class="error">
  <h2>Calendar Error</h2>
  <pre>${escapeHtml(message)}</pre>
</body>
</html>`;
};
