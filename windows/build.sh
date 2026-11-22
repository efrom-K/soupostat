#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

dotnet publish "$ROOT/windows/Launcher.csproj" -c Release -r win-x64 --self-contained true \
  -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true --artifacts-path "$TMP/artifacts" \
  -o "$TMP/publish"
mkdir -p "$TMP/package/game" "$ROOT/dist"
cp "$ROOT/LICENSE" "$TMP/package/LICENSE.txt"
cp "$TMP/publish/Soupostat.exe" "$TMP/package/Soupostat.exe"
cp -R "$ROOT/game/." "$TMP/package/game/"
(cd "$TMP/package" && zip -qr "$TMP/Soupostat-Windows-x64.zip" .)
mv "$TMP/Soupostat-Windows-x64.zip" "$ROOT/dist/"
