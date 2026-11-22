#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
SDK=${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}
BUILD_TOOLS="$SDK/build-tools/36.0.0"
PLATFORM="$SDK/platforms/android-35/android.jar"
JAVA_HOME=${JAVA_HOME:-$(/usr/libexec/java_home 2>/dev/null || true)}
[ -n "$JAVA_HOME" ] || JAVA_HOME=$(/usr/bin/env java -XshowSettings:properties -version 2>&1 | sed -n 's/^[[:space:]]*java.home = //p' | head -1)
OUT="$ROOT/dist/Soupostat-android.apk"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$ROOT/dist" "$TMP/assets" "$TMP/classes" "$HOME/.android"
mkdir -p "$TMP/dex" "$TMP/res/drawable-nodpi"
cp "$ROOT/game/assets/icon-192.png" "$TMP/res/drawable-nodpi/app_icon.png"
"$BUILD_TOOLS/aapt2" compile --dir "$TMP/res" -o "$TMP/res.zip"
cp -R "$ROOT/game" "$TMP/assets/game"
cp "$ROOT/LICENSE" "$TMP/assets/LICENSE.txt"
"$JAVA_HOME/bin/javac" -encoding UTF-8 -source 8 -target 8 -bootclasspath "$PLATFORM" \
  -d "$TMP/classes" "$ROOT/android/src/com/soupstate/soupostat/MainActivity.java"
"$BUILD_TOOLS/d8" --min-api 23 --lib "$PLATFORM" --output "$TMP/dex" "$TMP/classes/com/soupstate/soupostat/"*.class
"$BUILD_TOOLS/aapt2" link -o "$TMP/base.apk" -I "$PLATFORM" --manifest "$ROOT/android/AndroidManifest.xml" \
  --min-sdk-version 23 --target-sdk-version 35 -A "$TMP/assets" "$TMP/res.zip"
python3 - "$TMP/base.apk" "$TMP/dex/classes.dex" <<'PY'
import sys, zipfile
with zipfile.ZipFile(sys.argv[1], 'a', compression=zipfile.ZIP_DEFLATED) as apk:
    apk.write(sys.argv[2], 'classes.dex')
PY
KEY="$HOME/.android/debug.keystore"
if [ ! -f "$KEY" ]; then
  "$JAVA_HOME/bin/keytool" -genkeypair -keystore "$KEY" -storepass android -keypass android \
    -alias androiddebugkey -dname "CN=Android Debug,O=Android,C=US" -keyalg RSA -keysize 2048 -validity 10000
fi
"$SDK/build-tools/36.0.0/zipalign" -f 4 "$TMP/base.apk" "$TMP/aligned-final.apk"
"$SDK/build-tools/36.0.0/apksigner" sign --ks "$KEY" --ks-pass pass:android --key-pass pass:android \
  --ks-key-alias androiddebugkey --out "$OUT" "$TMP/aligned-final.apk"
"$SDK/build-tools/36.0.0/apksigner" verify --verbose "$OUT"
