import { describe, expect, test } from "bun:test";
import { renderEventDetails, renderUpcomingList } from "@/dialog/renderer";
import type { CalendarEvent } from "@/calendar/types";
import type { Config } from "@/config";

const DEFAULT_CONFIG: Config = {
  calendar: { url: "", username: "", password: "" },
  polling: { intervalSeconds: 60 },
  colors: { far: "#A3BE8C", medium: "#EBCB8B", urgent: "#BF616A" },
};

const NOW = new Date("2026-04-23T12:00:00");

const makeEvent = (overrides: Partial<CalendarEvent>): CalendarEvent => ({
  uid: "test-uid",
  title: "Test Event",
  startTime: new Date("2026-04-23T14:00:00"),
  endTime: new Date("2026-04-23T15:00:00"),
  isAllDay: false,
  ...overrides,
});

describe("renderEventDetails", () => {
  test("renders event title in bold", () => {
    const result = renderEventDetails(makeEvent({ title: "Team Standup" }));
    expect(result).toContain("<b>Team Standup</b>");
  });

  test("renders time range for same-day event", () => {
    const result = renderEventDetails(makeEvent({
      startTime: new Date("2026-04-23T14:00:00"),
      endTime: new Date("2026-04-23T15:00:00"),
    }));
    expect(result).toContain("14:00 – 15:00");
  });

  test("renders all-day event", () => {
    const result = renderEventDetails(makeEvent({ isAllDay: true }));
    expect(result).toContain("(all day)");
  });

  test("renders location when present", () => {
    const result = renderEventDetails(makeEvent({ location: "Room A" }));
    expect(result).toContain("📍 Room A");
  });

  test("omits location when absent", () => {
    const result = renderEventDetails(makeEvent({ location: undefined }));
    expect(result).not.toContain("📍");
  });

  test("renders description when present", () => {
    const result = renderEventDetails(makeEvent({ description: "Weekly sync" }));
    expect(result).toContain("Weekly sync");
  });

  test("omits description when absent", () => {
    const result = renderEventDetails(makeEvent({ description: undefined }));
    const lines = result.split("\n").filter((l) => l.trim().length > 0);
    // Should only have title + time
    expect(lines.length).toBeLessThanOrEqual(3);
  });

  test("renders attendees when present", () => {
    const result = renderEventDetails(makeEvent({ attendees: ["Alice", "Bob"] }));
    expect(result).toContain("👥 Alice, Bob");
  });

  test("omits attendees when absent", () => {
    const result = renderEventDetails(makeEvent({ attendees: undefined }));
    expect(result).not.toContain("👥");
  });

  test("escapes HTML in title", () => {
    const result = renderEventDetails(makeEvent({ title: "Q&A <Session>" }));
    expect(result).toContain("Q&amp;A &lt;Session&gt;");
  });
});

describe("renderUpcomingList", () => {
  test("renders upcoming events with time and color", () => {
    const events = [
      makeEvent({ uid: "1", title: "Event 1", startTime: new Date("2026-04-23T14:00:00") }),
      makeEvent({ uid: "2", title: "Event 2", startTime: new Date("2026-04-23T16:00:00") }),
    ];

    const result = renderUpcomingList(events, NOW, DEFAULT_CONFIG);

    expect(result).toHaveLength(2);
    expect(result[0]).toContain("14:00");
    expect(result[0]).toContain("Event 1");
    expect(result[1]).toContain("16:00");
  });

  test("limits to maxItems", () => {
    const events = Array.from({ length: 10 }, (_, i) =>
      makeEvent({
        uid: `e${i}`,
        title: `Event ${i}`,
        startTime: new Date(`2026-04-23T${(13 + i).toString().padStart(2, "0")}:00:00`),
      })
    );

    const result = renderUpcomingList(events, NOW, DEFAULT_CONFIG, 3);
    expect(result).toHaveLength(3);
  });

  test("excludes all-day events", () => {
    const events = [
      makeEvent({ uid: "allday", title: "Holiday", isAllDay: true, startTime: new Date("2026-04-23T13:00:00") }),
      makeEvent({ uid: "timed", title: "Meeting", startTime: new Date("2026-04-23T14:00:00") }),
    ];

    const result = renderUpcomingList(events, NOW, DEFAULT_CONFIG);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain("Meeting");
  });

  test("returns empty array when no upcoming events", () => {
    const result = renderUpcomingList([], NOW, DEFAULT_CONFIG);
    expect(result).toHaveLength(0);
  });

  test("truncates long titles", () => {
    const events = [
      makeEvent({
        uid: "long",
        title: "This is a very long event title that should be truncated",
        startTime: new Date("2026-04-23T14:00:00"),
      }),
    ];

    const result = renderUpcomingList(events, NOW, DEFAULT_CONFIG);
    expect(result[0]).toContain("…");
  });
});
