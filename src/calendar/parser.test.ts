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
