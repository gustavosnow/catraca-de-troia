#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
local_jdk="$project_root/.tools/jdk"
local_android_sdk="$project_root/.tools/android-sdk"
build_mode="${1:---emulator}"

case "$build_mode" in
  --emulator)
    mobile_api_url="${MOBILE_API_URL:-http://10.0.2.2:3001}"
    artifact_name="catraca-de-troia-responsaveis-debug.apk"
    ;;
  --device)
    local_ip="$(ip -4 route get 1.1.1.1 | awk '{ for (field = 1; field <= NF; field += 1) if ($field == "src") { print $(field + 1); exit } }')"
    if [[ -z "$local_ip" ]]; then
      echo "Não foi possível detectar o IP local. Defina MOBILE_API_URL explicitamente." >&2
      exit 1
    fi
    mobile_api_url="${MOBILE_API_URL:-http://$local_ip:3001}"
    artifact_name="catraca-de-troia-responsaveis-device-debug.apk"
    ;;
  *)
    echo "Uso: $0 [--emulator|--device]" >&2
    exit 1
    ;;
esac

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
echo "Gerando APK de depuração com API em $mobile_api_url"
CAPACITOR_ANDROID_SCHEME=http VITE_API_BASE_URL="$mobile_api_url" npm run build:parent
CAPACITOR_ANDROID_SCHEME=http npx cap sync android

cd "$project_root/android"
./gradlew assembleDebug

mkdir -p "$project_root/.artifacts"
cp "$project_root/android/app/build/outputs/apk/debug/app-debug.apk" \
  "$project_root/.artifacts/$artifact_name"
sha256sum "$project_root/.artifacts/$artifact_name"
