export interface CalendarEvent {
  uid: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  description?: string;
  attendees?: string[];
  isAllDay: boolean;
}

export interface CalendarInfo {
  url: string;
  displayName: string;
}

export interface FetchOptions {
  timeRangeStart: Date;
  timeRangeEnd: Date;
}
