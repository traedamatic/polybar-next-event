# polybar-next-event

A polybar module that fetches your calendar and displays the next upcoming event directly in the bar. Events are color-coded by urgency so you never miss a meeting.

## Features

- **Next event display** — shows the title and time of your next calendar event in the polybar
- **Color-coded urgency**:
  - `> 1 hour away` — green (#A3BE8C)
  - `30–60 min away` — yellow (#EBCB8B)
  - `< 15 min away` — red (#BF616A)
- **Click-to-open dialog** — clicking the event opens a dialog window with:
  - Left panel: event details (title, time, location, description, attendees)
  - Right panel: list of upcoming events

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Language**: TypeScript (strict mode)
- **Calendar**: CalDAV / ICS integration
- **UI dialog**: GTK-based dialog (via script or small app)
- **Bar integration**: Polybar custom/script module

## Prerequisites

- [Polybar](https://github.com/polybar/polybar) installed and configured
- [Bun](https://bun.sh/) runtime
- A CalDAV-compatible calendar (Google Calendar, Nextcloud, etc.)

## Installation

```bash
git clone https://github.com/traedamatic/polybar-next-event.git
cd polybar-next-event
bun install
```

## Configuration

Create a `.env` file with your calendar credentials:

```env
CALENDAR_URL=https://your-caldav-server.com/calendar
CALENDAR_USERNAME=your-username
CALENDAR_PASSWORD=your-password
```

Add the module to your polybar config:

```ini
[module/next-event]
type = custom/script
exec = /path/to/polybar-next-event/dist/polybar-output.sh
click-left = /path/to/polybar-next-event/dist/show-dialog.sh
interval = 60
```

## Development

```bash
bun run dev        # start with hot reload
bun test           # run tests
bun run build      # build for production
```

## Links

- [Polybar Documentation](https://polybar.readthedocs.io/en/stable/)
- [Polybar GitHub](https://github.com/polybar/polybar)
- [Polybar Wiki](https://github.com/polybar/polybar/wiki)
