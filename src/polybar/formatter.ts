import type { NextEvent } from "@/event/types";

const MAX_TITLE_LENGTH = 40;
const NO_EVENTS_TEXT = "No events";
const ERROR_TEXT = "CAL ERR";

const formatTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}..`;
};

export const formatForPolybar = (nextEvent: NextEvent | null): string => {
  if (!nextEvent) return NO_EVENTS_TEXT;

  const time = formatTime(nextEvent.event.startTime);
  const title = truncate(nextEvent.event.title, MAX_TITLE_LENGTH);
  const color = nextEvent.color;

  return `%{F${color}}${time} ${title}%{F-}`;
};

export const formatError = (): string => ERROR_TEXT;
