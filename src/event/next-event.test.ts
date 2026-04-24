import { describe, expect, test } from "bun:test";
import { getNextEvent } from "@/event/next-event";
import type { CalendarEvent } from "@/calendar/types";
import type { Config } from "@/config";

const DEFAULT_CONFIG: Config = {
  calendar: { url: "", username: "", password: "", calendarFilter: [] },
  polling: { intervalSeconds: 60 },
  colors: { far: "#A3BE8C", medium: "#EBCB8B", urgent: "#BF616A" },
};

const makeEvent = (overrides: Partial<CalendarEvent> & { uid: string; title: string; startTime: Date; endTime: Date }): CalendarEvent => ({
  isAllDay: false,
  ...overrides,
});

const NOW = new Date("2026-04-23T12:00:00Z");

describe("getNextEvent", () => {
  test("returns null for empty event list", () => {
    const result = getNextEvent([], NOW, DEFAULT_CONFIG);
    expect(result).toBeNull();
  });

  test("returns null when all events are in the past", () => {
    const events = [
      makeEvent({
        uid: "past-1",
        title: "Past Event",
        startTime: new Date("2026-04-23T10:00:00Z"),
        endTime: new Date("2026-04-23T11:00:00Z"),
      }),
    ];

    const result = getNextEvent(events, NOW, DEFAULT_CONFIG);
    expect(result).toBeNull();
  });

  test("returns null when only all-day events exist", () => {
    const events = [
      makeEvent({
        uid: "allday-1",
        title: "All Day",
        startTime: new Date("2026-04-24T00:00:00Z"),
        endTime: new Date("2026-04-25T00:00:00Z"),
        isAllDay: true,
      }),
    ];

    const result = getNextEvent(events, NOW, DEFAULT_CONFIG);
    expect(result).toBeNull();
  });

  test("returns green urgency for event > 60 min away", () => {
    const events = [
      makeEvent({
        uid: "far-1",
        title: "Far Event",
        startTime: new Date("2026-04-23T14:00:00Z"), // 2 hours away
        endTime: new Date("2026-04-23T15:00:00Z"),
      }),
    ];

    const result = getNextEvent(events, NOW, DEFAULT_CONFIG);

    expect(result).not.toBeNull();
    expect(result!.urgency).toBe("far");
    expect(result!.color).toBe("#A3BE8C");
    expect(result!.minutesUntilStart).toBe(120);
  });

  test("returns yellow urgency for event 15-60 min away", () => {
    const events = [
      makeEvent({
        uid: "medium-1",
        title: "Medium Event",
        startTime: new Date("2026-04-23T12:30:00Z"), // 30 min away
        endTime: new Date("2026-04-23T13:00:00Z"),
      }),
    ];

    const result = getNextEvent(events, NOW, DEFAULT_CONFIG);

    expect(result).not.toBeNull();
    expect(result!.urgency).toBe("medium");
    expect(result!.color).toBe("#EBCB8B");
    expect(result!.minutesUntilStart).toBe(30);
  });

  test("returns red urgency for event < 15 min away", () => {
    const events = [
      makeEvent({
        uid: "urgent-1",
        title: "Urgent Event",
        startTime: new Date("2026-04-23T12:10:00Z"), // 10 min away
        endTime: new Date("2026-04-23T13:00:00Z"),
      }),
    ];

    const result = getNextEvent(events, NOW, DEFAULT_CONFIG);

    expect(result).not.toBeNull();
    expect(result!.urgency).toBe("urgent");
    expect(result!.color).toBe("#BF616A");
    expect(result!.minutesUntilStart).toBe(10);
  });

  test("returns the nearest future event when multiple exist", () => {
    const events = [
      makeEvent({
        uid: "later",
        title: "Later Event",
        startTime: new Date("2026-04-23T16:00:00Z"),
        endTime: new Date("2026-04-23T17:00:00Z"),
      }),
      makeEvent({
        uid: "sooner",
        title: "Sooner Event",
        startTime: new Date("2026-04-23T13:00:00Z"),
        endTime: new Date("2026-04-23T14:00:00Z"),
      }),
    ];

    const result = getNextEvent(events, NOW, DEFAULT_CONFIG);

    expect(result).not.toBeNull();
    expect(result!.event.title).toBe("Sooner Event");
  });

  test("skips all-day events and returns next timed event", () => {
    const events = [
      makeEvent({
        uid: "allday",
        title: "All Day Event",
        startTime: new Date("2026-04-23T12:01:00Z"),
        endTime: new Date("2026-04-24T00:00:00Z"),
        isAllDay: true,
      }),
      makeEvent({
        uid: "timed",
        title: "Timed Event",
        startTime: new Date("2026-04-23T14:00:00Z"),
        endTime: new Date("2026-04-23T15:00:00Z"),
      }),
    ];

    const result = getNextEvent(events, NOW, DEFAULT_CONFIG);

    expect(result).not.toBeNull();
    expect(result!.event.title).toBe("Timed Event");
  });

  test("uses custom colors from config", () => {
    const customConfig: Config = {
      ...DEFAULT_CONFIG,
      colors: { far: "#00FF00", medium: "#FFFF00", urgent: "#FF0000" },
    };

    const events = [
      makeEvent({
        uid: "custom-1",
        title: "Custom Color Event",
        startTime: new Date("2026-04-23T12:05:00Z"), // 5 min = urgent
        endTime: new Date("2026-04-23T13:00:00Z"),
      }),
    ];

    const result = getNextEvent(events, NOW, customConfig);

    expect(result!.color).toBe("#FF0000");
  });

  test("event at exactly 15 min boundary is medium", () => {
    const events = [
      makeEvent({
        uid: "boundary-15",
        title: "Boundary Event",
        startTime: new Date("2026-04-23T12:15:00Z"), // exactly 15 min
        endTime: new Date("2026-04-23T13:00:00Z"),
      }),
    ];

    const result = getNextEvent(events, NOW, DEFAULT_CONFIG);

    expect(result!.urgency).toBe("medium");
  });

  test("event at exactly 60 min boundary is far", () => {
    const events = [
      makeEvent({
        uid: "boundary-60",
        title: "Boundary Event",
        startTime: new Date("2026-04-23T13:00:00Z"), // exactly 60 min
        endTime: new Date("2026-04-23T14:00:00Z"),
      }),
    ];

    const result = getNextEvent(events, NOW, DEFAULT_CONFIG);

    expect(result!.urgency).toBe("far");
  });
});

describe("getNextEvent with recurring event scenarios", () => {
  // Simulates the real bug: recurring work event at 10:00 Berlin (08:00 UTC)
  // vs one-time family event at 19:00 Berlin (17:00 UTC)
  // now = 07:30 UTC (09:30 Berlin)
  const MORNING_NOW = new Date("2026-04-24T07:30:00Z");

  test("selects earlier work event over later family event", () => {
    const events = [
      makeEvent({
        uid: "family-1",
        title: "Aleks aus",
        startTime: new Date("2026-04-24T17:00:00Z"), // 19:00 Berlin
        endTime: new Date("2026-04-24T18:00:00Z"),
      }),
      makeEvent({
        uid: "work-1",
        title: "Daily Standup",
        startTime: new Date("2026-04-24T08:00:00Z"), // 10:00 Berlin
        endTime: new Date("2026-04-24T08:30:00Z"),
      }),
    ];

    const result = getNextEvent(events, MORNING_NOW, DEFAULT_CONFIG);

    expect(result).not.toBeNull();
    expect(result!.event.title).toBe("Daily Standup");
    expect(result!.event.startTime).toEqual(new Date("2026-04-24T08:00:00Z"));
  });

  test("selects earliest among multiple recurring event occurrences", () => {
    const events = [
      makeEvent({
        uid: "late-meeting",
        title: "Afternoon Sync",
        startTime: new Date("2026-04-24T14:00:00Z"), // 16:00 Berlin
        endTime: new Date("2026-04-24T15:00:00Z"),
      }),
      makeEvent({
        uid: "early-meeting",
        title: "Morning Standup",
        startTime: new Date("2026-04-24T08:00:00Z"), // 10:00 Berlin
        endTime: new Date("2026-04-24T08:30:00Z"),
      }),
      makeEvent({
        uid: "mid-meeting",
        title: "Lunch Review",
        startTime: new Date("2026-04-24T10:00:00Z"), // 12:00 Berlin
        endTime: new Date("2026-04-24T11:00:00Z"),
      }),
    ];

    const result = getNextEvent(events, MORNING_NOW, DEFAULT_CONFIG);

    expect(result).not.toBeNull();
    expect(result!.event.title).toBe("Morning Standup");
  });

  test("skips recurring event occurrence that is in the past", () => {
    // now = 09:00 UTC, work event was at 08:00 UTC (already started)
    const laterNow = new Date("2026-04-24T09:00:00Z");

    const events = [
      makeEvent({
        uid: "past-work",
        title: "Daily Standup",
        startTime: new Date("2026-04-24T08:00:00Z"),
        endTime: new Date("2026-04-24T08:30:00Z"),
      }),
      makeEvent({
        uid: "family-1",
        title: "Aleks aus",
        startTime: new Date("2026-04-24T17:00:00Z"),
        endTime: new Date("2026-04-24T18:00:00Z"),
      }),
    ];

    const result = getNextEvent(events, laterNow, DEFAULT_CONFIG);

    expect(result).not.toBeNull();
    expect(result!.event.title).toBe("Aleks aus");
  });
});
