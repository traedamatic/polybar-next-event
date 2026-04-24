import { describe, expect, test } from "bun:test";
import { parseICS } from "@/calendar/parser";

const wrapVEvent = (vevent: string): string => `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
${vevent}
END:VCALENDAR`;

describe("parseICS", () => {
  test("parses a basic event with all fields", () => {
    const ics = wrapVEvent(`BEGIN:VEVENT
UID:event-001@example.com
DTSTART:20260423T140000Z
DTEND:20260423T150000Z
SUMMARY:Team Standup
LOCATION:Conference Room A
DESCRIPTION:Daily standup meeting
ATTENDEE;CN=Alice:mailto:alice@example.com
ATTENDEE;CN=Bob:mailto:bob@example.com
END:VEVENT`);

    const events = parseICS(ics);

    expect(events).toHaveLength(1);
    expect(events[0].uid).toBe("event-001@example.com");
    expect(events[0].title).toBe("Team Standup");
    expect(events[0].startTime).toEqual(new Date("2026-04-23T14:00:00Z"));
    expect(events[0].endTime).toEqual(new Date("2026-04-23T15:00:00Z"));
    expect(events[0].location).toBe("Conference Room A");
    expect(events[0].description).toBe("Daily standup meeting");
    expect(events[0].attendees).toEqual(["Alice", "Bob"]);
    expect(events[0].isAllDay).toBe(false);
  });

  test("parses an all-day event", () => {
    const ics = wrapVEvent(`BEGIN:VEVENT
UID:allday-001@example.com
DTSTART;VALUE=DATE:20260424
DTEND;VALUE=DATE:20260425
SUMMARY:Company Holiday
END:VEVENT`);

    const events = parseICS(ics);

    expect(events).toHaveLength(1);
    expect(events[0].isAllDay).toBe(true);
    expect(events[0].title).toBe("Company Holiday");
  });

  test("parses event without optional fields", () => {
    const ics = wrapVEvent(`BEGIN:VEVENT
UID:minimal-001@example.com
DTSTART:20260423T100000Z
DTEND:20260423T110000Z
SUMMARY:Quick Call
END:VEVENT`);

    const events = parseICS(ics);

    expect(events).toHaveLength(1);
    expect(events[0].location).toBeUndefined();
    expect(events[0].description).toBeUndefined();
    expect(events[0].attendees).toBeUndefined();
  });

  test("parses multiple events", () => {
    const ics = wrapVEvent(`BEGIN:VEVENT
UID:multi-001@example.com
DTSTART:20260423T090000Z
DTEND:20260423T100000Z
SUMMARY:Morning Meeting
END:VEVENT
BEGIN:VEVENT
UID:multi-002@example.com
DTSTART:20260423T140000Z
DTEND:20260423T150000Z
SUMMARY:Afternoon Review
END:VEVENT`);

    const events = parseICS(ics);

    expect(events).toHaveLength(2);
    expect(events[0].title).toBe("Morning Meeting");
    expect(events[1].title).toBe("Afternoon Review");
  });

  test("uses fallback title for event without summary", () => {
    const ics = wrapVEvent(`BEGIN:VEVENT
UID:nosummary-001@example.com
DTSTART:20260423T100000Z
DTEND:20260423T110000Z
END:VEVENT`);

    const events = parseICS(ics);

    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("(No title)");
  });

  test("extracts attendee email when CN is missing", () => {
    const ics = wrapVEvent(`BEGIN:VEVENT
UID:attendee-001@example.com
DTSTART:20260423T100000Z
DTEND:20260423T110000Z
SUMMARY:Test
ATTENDEE:mailto:no-name@example.com
END:VEVENT`);

    const events = parseICS(ics);

    expect(events[0].attendees).toEqual(["no-name@example.com"]);
  });

  test("returns empty array for ICS with no events", () => {
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
END:VCALENDAR`;

    const events = parseICS(ics);

    expect(events).toHaveLength(0);
  });
});

// Realistic ICS with VTIMEZONE matching Fastmail CalDAV output
const BERLIN_VTIMEZONE = `BEGIN:VTIMEZONE
TZID:Europe/Berlin
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10
END:STANDARD
END:VTIMEZONE`;

const wrapWithTimezone = (vevent: string): string => `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
${BERLIN_VTIMEZONE}
${vevent}
END:VCALENDAR`;

describe("parseICS recurring events", () => {
  test("expands daily recurring event to occurrences in time range", () => {
    // Daily standup created on April 21, recurring daily
    const ics = wrapWithTimezone(`BEGIN:VEVENT
UID:recurring-daily@example.com
DTSTART;TZID=Europe/Berlin:20260421T100000
DTEND;TZID=Europe/Berlin:20260421T103000
RRULE:FREQ=DAILY
SUMMARY:Daily Standup
END:VEVENT`);

    // Query window: April 24 08:00 to April 25 08:00 (UTC)
    const events = parseICS(ics, {
      start: new Date("2026-04-24T06:00:00Z"),
      end: new Date("2026-04-25T06:00:00Z"),
    });

    // Should get 1 occurrence: April 24 at 10:00 Berlin = 08:00 UTC
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("Daily Standup");
    expect(events[0].startTime).toEqual(new Date("2026-04-24T08:00:00Z"));
    expect(events[0].endTime).toEqual(new Date("2026-04-24T08:30:00Z"));
    expect(events[0].isAllDay).toBe(false);
  });

  test("expands weekly recurring event with TZID correctly", () => {
    // Weekly meeting every Thursday, created April 16
    const ics = wrapWithTimezone(`BEGIN:VEVENT
UID:recurring-weekly@example.com
DTSTART;TZID=Europe/Berlin:20260416T140000
DTEND;TZID=Europe/Berlin:20260416T150000
RRULE:FREQ=WEEKLY;BYDAY=TH
SUMMARY:Weekly Review
END:VEVENT`);

    // Query window: April 23 (Thursday) 06:00 UTC to April 24 06:00 UTC
    const events = parseICS(ics, {
      start: new Date("2026-04-23T06:00:00Z"),
      end: new Date("2026-04-24T06:00:00Z"),
    });

    // Should get 1 occurrence: April 23 at 14:00 Berlin = 12:00 UTC
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("Weekly Review");
    expect(events[0].startTime).toEqual(new Date("2026-04-23T12:00:00Z"));
    expect(events[0].endTime).toEqual(new Date("2026-04-23T13:00:00Z"));
  });

  test("recurring event with EXDATE skips excluded dates", () => {
    // Daily event, but April 24 is excluded
    const ics = wrapWithTimezone(`BEGIN:VEVENT
UID:recurring-exdate@example.com
DTSTART;TZID=Europe/Berlin:20260421T100000
DTEND;TZID=Europe/Berlin:20260421T110000
RRULE:FREQ=DAILY
EXDATE;TZID=Europe/Berlin:20260424T100000
SUMMARY:Daily with Exception
END:VEVENT`);

    // Query window: April 24 only
    const events = parseICS(ics, {
      start: new Date("2026-04-24T06:00:00Z"),
      end: new Date("2026-04-25T06:00:00Z"),
    });

    // April 24 is excluded, so no occurrences
    expect(events).toHaveLength(0);
  });

  test("non-recurring event still works as before with time range", () => {
    const ics = wrapVEvent(`BEGIN:VEVENT
UID:single@example.com
DTSTART:20260424T170000Z
DTEND:20260424T180000Z
SUMMARY:One-time Event
END:VEVENT`);

    const events = parseICS(ics, {
      start: new Date("2026-04-24T06:00:00Z"),
      end: new Date("2026-04-25T06:00:00Z"),
    });

    expect(events).toHaveLength(1);
    expect(events[0].title).toBe("One-time Event");
    expect(events[0].startTime).toEqual(new Date("2026-04-24T17:00:00Z"));
  });

  test("recurring event outside time range returns no occurrences", () => {
    // Daily event starting April 21, but we query for April 19
    const ics = wrapWithTimezone(`BEGIN:VEVENT
UID:recurring-outside@example.com
DTSTART;TZID=Europe/Berlin:20260421T100000
DTEND;TZID=Europe/Berlin:20260421T110000
RRULE:FREQ=DAILY
SUMMARY:Future Daily
END:VEVENT`);

    const events = parseICS(ics, {
      start: new Date("2026-04-19T06:00:00Z"),
      end: new Date("2026-04-20T06:00:00Z"),
    });

    expect(events).toHaveLength(0);
  });

  test("recurring event with COUNT limits occurrences", () => {
    // Daily event starting April 21 with COUNT=3 (April 21, 22, 23)
    const ics = wrapWithTimezone(`BEGIN:VEVENT
UID:recurring-count@example.com
DTSTART;TZID=Europe/Berlin:20260421T100000
DTEND;TZID=Europe/Berlin:20260421T110000
RRULE:FREQ=DAILY;COUNT=3
SUMMARY:Three Day Event
END:VEVENT`);

    // Query window: April 24 — after the series ended
    const events = parseICS(ics, {
      start: new Date("2026-04-24T06:00:00Z"),
      end: new Date("2026-04-25T06:00:00Z"),
    });

    expect(events).toHaveLength(0);
  });

  test("multiple occurrences in a wider time range", () => {
    // Daily event
    const ics = wrapWithTimezone(`BEGIN:VEVENT
UID:recurring-multi@example.com
DTSTART;TZID=Europe/Berlin:20260421T090000
DTEND;TZID=Europe/Berlin:20260421T100000
RRULE:FREQ=DAILY
SUMMARY:Daily Morning Sync
END:VEVENT`);

    // Query window: 3 days
    const events = parseICS(ics, {
      start: new Date("2026-04-22T06:00:00Z"),
      end: new Date("2026-04-25T06:00:00Z"),
    });

    expect(events).toHaveLength(3);
    expect(events[0].startTime).toEqual(new Date("2026-04-22T07:00:00Z"));
    expect(events[1].startTime).toEqual(new Date("2026-04-23T07:00:00Z"));
    expect(events[2].startTime).toEqual(new Date("2026-04-24T07:00:00Z"));
  });

  test("preserves attendees and location on recurring event occurrences", () => {
    const ics = wrapWithTimezone(`BEGIN:VEVENT
UID:recurring-meta@example.com
DTSTART;TZID=Europe/Berlin:20260421T100000
DTEND;TZID=Europe/Berlin:20260421T110000
RRULE:FREQ=DAILY
SUMMARY:Team Meeting
LOCATION:Room 42
ATTENDEE;CN=Alice:mailto:alice@example.com
END:VEVENT`);

    const events = parseICS(ics, {
      start: new Date("2026-04-24T06:00:00Z"),
      end: new Date("2026-04-25T06:00:00Z"),
    });

    expect(events).toHaveLength(1);
    expect(events[0].location).toBe("Room 42");
    expect(events[0].attendees).toEqual(["Alice"]);
  });
});

describe("parseICS timezone handling", () => {
  test("event with Europe/Berlin TZID converts to correct UTC time", () => {
    // 10:00 Berlin in April (CEST, UTC+2) = 08:00 UTC
    const ics = wrapWithTimezone(`BEGIN:VEVENT
UID:tz-berlin@example.com
DTSTART;TZID=Europe/Berlin:20260424T100000
DTEND;TZID=Europe/Berlin:20260424T110000
SUMMARY:Berlin Morning
END:VEVENT`);

    const events = parseICS(ics);

    expect(events).toHaveLength(1);
    expect(events[0].startTime).toEqual(new Date("2026-04-24T08:00:00Z"));
    expect(events[0].endTime).toEqual(new Date("2026-04-24T09:00:00Z"));
  });

  test("UTC event and Berlin event sort correctly", () => {
    // Family event at 17:00 UTC (19:00 Berlin)
    // Work event at 10:00 Berlin (08:00 UTC)
    const familyIcs = wrapVEvent(`BEGIN:VEVENT
UID:family@example.com
DTSTART:20260424T170000Z
DTEND:20260424T180000Z
SUMMARY:Aleks aus
END:VEVENT`);

    const workIcs = wrapWithTimezone(`BEGIN:VEVENT
UID:work@example.com
DTSTART;TZID=Europe/Berlin:20260424T100000
DTEND;TZID=Europe/Berlin:20260424T110000
SUMMARY:Work Meeting
END:VEVENT`);

    const familyEvents = parseICS(familyIcs);
    const workEvents = parseICS(workIcs);
    const allEvents = [...familyEvents, ...workEvents].sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime()
    );

    // Work event (08:00 UTC) should come before family event (17:00 UTC)
    expect(allEvents[0].title).toBe("Work Meeting");
    expect(allEvents[1].title).toBe("Aleks aus");
  });
});
