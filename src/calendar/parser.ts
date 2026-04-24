import ICAL from "ical.js";
import { log } from "@/logger";
import type { CalendarEvent } from "./types";

interface TimeRange {
  start: Date;
  end: Date;
}

const extractAttendees = (vevent: ICAL.Component): string[] | undefined => {
  const attendees = vevent.getAllProperties("attendee");
  if (attendees.length === 0) return undefined;

  return attendees.map((a: ICAL.Property) => {
    const cn = a.getParameter("cn");
    if (cn) return String(cn);
    const val = a.getFirstValue();
    return String(val).replace(/^mailto:/i, "");
  });
};

const expandRecurringEvent = (
  event: ICAL.Event,
  vevent: ICAL.Component,
  timeRange: TimeRange
): CalendarEvent[] => {
  const results: CalendarEvent[] = [];
  const dominated = event.startDate.toJSDate();
  const durationMs = event.endDate.toJSDate().getTime() - dominated.getTime();
  const attendeeNames = extractAttendees(vevent);

  const iterator = event.iterator();
  let next = iterator.next();

  while (next) {
    const occurrenceStart = next.toJSDate();

    // Past the end of our window — stop
    if (occurrenceStart.getTime() >= timeRange.end.getTime()) break;

    // Only include occurrences that haven't ended before our window starts
    const occurrenceEnd = new Date(occurrenceStart.getTime() + durationMs);
    if (occurrenceEnd.getTime() > timeRange.start.getTime()) {
      results.push({
        uid: event.uid,
        title: event.summary || "(No title)",
        startTime: occurrenceStart,
        endTime: occurrenceEnd,
        location: event.location || undefined,
        description: event.description || undefined,
        attendees: attendeeNames,
        isAllDay: event.startDate.isDate,
      });
    }

    next = iterator.next();
  }

  log(`  Recurring "${event.summary}" → ${results.length} occurrence(s) in range`);
  return results;
};

export const parseICS = (icsData: string, timeRange?: TimeRange): CalendarEvent[] => {
  const jcalData = ICAL.parse(icsData);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents("vevent");

  const events: CalendarEvent[] = [];

  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent);
    const isRecurring = event.isRecurring();

    if (isRecurring && timeRange) {
      const occurrences = expandRecurringEvent(event, vevent, timeRange);
      events.push(...occurrences);
    } else {
      const attendeeNames = extractAttendees(vevent);
      const startTime = event.startDate.toJSDate();
      const endTime = event.endDate.toJSDate();

      log(`  Event "${event.summary}" start=${startTime.toISOString()} recurring=${isRecurring}`);

      events.push({
        uid: event.uid,
        title: event.summary || "(No title)",
        startTime,
        endTime,
        location: event.location || undefined,
        description: event.description || undefined,
        attendees: attendeeNames,
        isAllDay: event.startDate.isDate,
      });
    }
  }

  return events;
};
