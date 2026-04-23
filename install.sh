#!/bin/sh
# polybar-next-event install script
# Builds the project and prints setup instructions.

set -e

# Check for bun
if ! command -v bun >/dev/null 2>&1; then
  echo "Error: bun is not installed."
  echo "Install it from https://bun.sh/"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Building polybar-next-event..."
cd "$SCRIPT_DIR"
bun install
bun run build

echo ""
echo "Build complete!"
echo ""

# Create .env if it doesn't exist
if [ ! -f "$SCRIPT_DIR/.env" ]; then
  echo "Creating .env from .env.example..."
  cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
  echo "Edit $SCRIPT_DIR/.env with your calendar credentials."
  echo ""
fi

echo "Add this to your polybar config:"
echo ""
echo "  [module/next-event]"
echo "  type = custom/script"
echo "  exec = bun $SCRIPT_DIR/dist/polybar/output.js"
echo "  click-left = bun $SCRIPT_DIR/dist/dialog/show-dialog.js"
echo "  interval = 60"
echo "  format-prefix = \"📅 \""
echo "  label = %output%"
echo ""
echo "Then add 'next-event' to your bar's modules list."
