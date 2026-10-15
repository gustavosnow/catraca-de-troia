#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
local_jdk="$project_root/.tools/jdk"
local_android_sdk="$project_root/.tools/android-sdk"

if [[ ! -x "$local_jdk/bin/java" ]]; then
  echo "JDK local ausente em $local_jdk. Consulte a seção móvel do README." >&2
  exit 1
fi
if [[ ! -d "$local_android_sdk/platforms/android-36" ]]; then
  echo "Android SDK 36 ausente em $local_android_sdk. Consulte a seção móvel do README." >&2
  exit 1
fi

export JAVA_HOME="$local_jdk"
export ANDROID_HOME="$local_android_sdk"
export ANDROID_SDK_ROOT="$local_android_sdk"

cd "$project_root"
npm run cap:sync:android:demo

cd "$project_root/android"
./gradlew assembleDebug

mkdir -p "$project_root/.artifacts"
cp "$project_root/android/app/build/outputs/apk/debug/app-debug.apk" \
  "$project_root/.artifacts/catraca-de-troia-responsaveis-debug.apk"
sha256sum "$project_root/.artifacts/catraca-de-troia-responsaveis-debug.apk"
