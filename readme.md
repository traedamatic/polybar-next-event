# polybar-next-event

A polybar module that fetches your calendar and displays the next upcoming event directly in the bar. Events are color-coded by urgency so you never miss a meeting.

## Features

- **Next event display** — shows the title and time of your next calendar event in the polybar
- **Color-coded urgency**:
  - `> 1 hour away` — green (#A3BE8C)
  - `15–60 min away` — yellow (#EBCB8B)
  - `< 15 min away` — red (#BF616A)
- **Click-to-open dialog** — clicking the event opens a styled dialog window with event details (title, time, location, description, attendees) and a list of upcoming events

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/)
- **Language**: TypeScript (strict mode)
- **Calendar**: CalDAV via [tsdav](https://github.com/natelindev/tsdav)
- **UI dialog**: [webview-bun](https://github.com/tr1ckydev/webview-bun) (native HTML/CSS rendering via GTK4 + WebKitGTK)
- **Bar integration**: Polybar custom/script module

## Prerequisites

- [Polybar](https://github.com/polybar/polybar) installed and configured
- [Bun](https://bun.sh/) runtime
- A CalDAV-compatible calendar (Fastmail, Nextcloud, etc.)

## Installation

### Quick setup

```bash
git clone https://github.com/traedamatic/polybar-next-event.git
cd polybar-next-event
./install.sh
```

The install script will build the project, create a `.env` file from the example, and print the polybar config to add.

### Manual setup

```bash
git clone https://github.com/traedamatic/polybar-next-event.git
cd polybar-next-event
bun install
bun run build
cp .env.example .env
```

Edit `.env` with your calendar credentials, then add the module to your polybar config:

```ini
[module/next-event]
type = custom/script
exec = bun /path/to/polybar-next-event/dist/polybar/output.js
click-left = bun /path/to/polybar-next-event/src/dialog/show-dialog.ts
interval = 60
label = %output%
```

Then add `next-event` to your bar's `modules-right` (or `modules-left`/`modules-center`).

## Configuration

Create a `.env` file with your calendar credentials (see `.env.example`):

```env
CALENDAR_URL=https://caldav.fastmail.com/dav/principals/user/you@fastmail.com/
CALENDAR_USERNAME=you@fastmail.com
CALENDAR_PASSWORD=your-app-password-here
```

Optional settings:

```env
POLL_INTERVAL=60         # polling interval in seconds (default: 60)
COLOR_FAR=#A3BE8C        # > 1 hour away (default: green)
COLOR_MEDIUM=#EBCB8B     # 15-60 min away (default: yellow)
COLOR_URGENT=#BF616A     # < 15 min away (default: red)
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
