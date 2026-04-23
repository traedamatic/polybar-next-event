export type UrgencyLevel = "far" | "medium" | "urgent";

export interface NextEvent {
  event: import("@/calendar/types").CalendarEvent;
  minutesUntilStart: number;
  urgency: UrgencyLevel;
  color: string;
}
