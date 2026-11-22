#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT="$ROOT/dist/Супостат.app"

[[ -f "$ROOT/game/index.html" ]] || { echo "Missing game/index.html" >&2; exit 1; }
mkdir -p "$ROOT/dist"
STAGING="$(mktemp -d "$ROOT/dist/.build.XXXXXX")"
trap 'rm -rf "$STAGING"' EXIT
APP="$STAGING/Супостат.app"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources/game"
cp -R "$ROOT/game/." "$APP/Contents/Resources/game/"
cp "$ROOT/LICENSE" "$APP/Contents/Resources/LICENSE.txt"
cp "$ROOT/macos/Info.plist" "$APP/Contents/Info.plist"
if [[ -f "$ROOT/macos/app.icns" ]]; then
  cp "$ROOT/macos/app.icns" "$APP/Contents/Resources/app.icns"
  /usr/libexec/PlistBuddy -c 'Add :CFBundleIconFile string app.icns' "$APP/Contents/Info.plist"
fi
xcrun swiftc -target arm64-apple-macosx13.0 -framework AppKit -framework WebKit \
  "$ROOT/macos/Main.swift" -o "$APP/Contents/MacOS/Soupostat"
chmod +x "$APP/Contents/MacOS/Soupostat"
codesign --force --sign - "$APP"
codesign --verify --strict "$APP"
if [[ -e "$OUTPUT" ]]; then mv "$OUTPUT" "$STAGING/previous.app"; fi
if ! mv "$APP" "$OUTPUT"; then
  if [[ -d "$STAGING/previous.app" ]]; then mv "$STAGING/previous.app" "$OUTPUT"; fi
  exit 1
fi
