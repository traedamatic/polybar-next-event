import ICAL from "ical.js";
import type { CalendarEvent } from "./types";

export const parseICS = (icsData: string): CalendarEvent[] => {
  const jcalData = ICAL.parse(icsData);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents("vevent");

  return vevents.map((vevent) => {
    const event = new ICAL.Event(vevent);
    const attendees = vevent.getAllProperties("attendee");

    const attendeeNames = attendees.length > 0
      ? attendees.map((a: ICAL.Property) => {
          const cn = a.getParameter("cn");
          if (cn) return String(cn);
          const val = a.getFirstValue();
          return String(val).replace(/^mailto:/i, "");
        })
      : undefined;

    return {
      uid: event.uid,
      title: event.summary || "(No title)",
      startTime: event.startDate.toJSDate(),
      endTime: event.endDate.toJSDate(),
      location: event.location || undefined,
      description: event.description || undefined,
      attendees: attendeeNames,
      isAllDay: event.startDate.isDate,
    };
  });
};
