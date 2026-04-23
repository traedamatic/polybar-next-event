import { describe, expect, test } from "bun:test";
import { formatForPolybar, formatError } from "@/polybar/formatter";
import type { NextEvent } from "@/event/types";
import type { CalendarEvent } from "@/calendar/types";

const makeNextEvent = (overrides: Partial<{
  title: string;
  startTime: Date;
  urgency: NextEvent["urgency"];
  color: string;
  minutesUntilStart: number;
}>): NextEvent => {
  const event: CalendarEvent = {
    uid: "test-uid",
    title: overrides.title ?? "Test Event",
    startTime: overrides.startTime ?? new Date("2026-04-23T14:30:00"),
    endTime: new Date("2026-04-23T15:30:00"),
    isAllDay: false,
  };

  return {
    event,
    minutesUntilStart: overrides.minutesUntilStart ?? 60,
    urgency: overrides.urgency ?? "far",
    color: overrides.color ?? "#A3BE8C",
  };
};

describe("formatForPolybar", () => {
  test("formats event with time and title in polybar color tags", () => {
    const result = formatForPolybar(makeNextEvent({
      title: "Team Standup",
      startTime: new Date("2026-04-23T14:30:00"),
      color: "#A3BE8C",
    }));

    expect(result).toBe("%{F#A3BE8C}14:30 Team Standup%{F-}");
  });

  test("returns 'No events' when nextEvent is null", () => {
    const result = formatForPolybar(null);
    expect(result).toBe("No events");
  });

  test("truncates long titles with ellipsis", () => {
    const longTitle = "This is a very long meeting title that should be truncated";
    const result = formatForPolybar(makeNextEvent({ title: longTitle }));

    // 40 char max: 39 chars + "…"
    expect(result).toContain("…");
    // time (5) + space (1) + title (40) = 46 chars inside color tags
    const innerText = result.replace(/%\{F[^}]*\}/g, "");
    expect(innerText.length).toBeLessThanOrEqual(46);
  });

  test("does not truncate titles at exactly 40 chars", () => {
    const exactTitle = "A".repeat(40);
    const result = formatForPolybar(makeNextEvent({ title: exactTitle }));

    expect(result).not.toContain("…");
    expect(result).toContain(exactTitle);
  });

  test("uses correct color for urgent events", () => {
    const result = formatForPolybar(makeNextEvent({ color: "#BF616A" }));
    expect(result).toStartWith("%{F#BF616A}");
  });

  test("uses correct color for medium events", () => {
    const result = formatForPolybar(makeNextEvent({ color: "#EBCB8B" }));
    expect(result).toStartWith("%{F#EBCB8B}");
  });

  test("pads single-digit hours with zero", () => {
    const result = formatForPolybar(makeNextEvent({
      startTime: new Date("2026-04-23T09:05:00"),
    }));

    expect(result).toContain("09:05");
  });

  test("formats midnight correctly", () => {
    const result = formatForPolybar(makeNextEvent({
      startTime: new Date("2026-04-24T00:00:00"),
    }));

    expect(result).toContain("00:00");
  });
});

describe("formatError", () => {
  test("returns error indicator", () => {
    const result = formatError();
    expect(result).toBe("⚠ Calendar error");
  });
});
