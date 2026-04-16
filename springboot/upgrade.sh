#!/usr/bin/env bash
set -euo pipefail

# One-click upgrade script for Spring Boot project.
# Usage:
#   ./upgrade.sh docker [slim|full]
#   ./upgrade.sh jar [slim|full]
# Env:
#   PORT=8123 ./upgrade.sh jar
#   PACKAGE_MODE=full ./upgrade.sh jar

MODE="${1:-docker}"
PACKAGE_MODE="${2:-${PACKAGE_MODE:-slim}}"
PORT="${PORT:-8000}"
MAVEN_LOCAL_REPO="${MAVEN_LOCAL_REPO:-.m2}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

PID_FILE="app.pid"

case "${PACKAGE_MODE}" in
  slim)
    BUILD_DESC="slim jar (templates bundled, static excluded)"
    BUILD_CMD=(mvn -Dmaven.repo.local="${MAVEN_LOCAL_REPO}" clean package -DskipTests)
    ;;
  full)
    BUILD_DESC="full jar (templates + static bundled)"
    BUILD_CMD=(mvn -Dmaven.repo.local="${MAVEN_LOCAL_REPO}" -Pbundle-frontend clean package -DskipTests)
    ;;
  *)
    echo "Unsupported package mode: ${PACKAGE_MODE}"
    echo "Usage: ./upgrade.sh [docker|jar] [slim|full]"
    echo "Or set env: PACKAGE_MODE=slim|full"
    exit 1
    ;;
esac

echo "[1/4] Building project (${BUILD_DESC})..."
"${BUILD_CMD[@]}"

JAR_PATH="$(ls target/autoweb-springboot-*.jar 2>/dev/null | grep -v '\.original$' | head -1 || true)"
if [[ -z "${JAR_PATH}" || ! -f "${JAR_PATH}" ]]; then
  echo "Build finished, but jar not found under target/autoweb-springboot-*.jar"
  exit 1
fi

case "${MODE}" in
  docker)
    echo "[2/4] Rebuilding and restarting Docker service..."
    docker compose up -d --build --remove-orphans
    echo "[3/4] Upgrade complete."
    echo "Service URL: http://localhost:8000"
    ;;

  jar)
    echo "[2/4] Stopping previous jar process (if exists)..."
    if [[ -f "${PID_FILE}" ]]; then
      OLD_PID="$(cat "${PID_FILE}" || true)"
      if [[ -n "${OLD_PID}" ]] && kill -0 "${OLD_PID}" 2>/dev/null; then
        kill "${OLD_PID}" || true
        sleep 1
      fi
      rm -f "${PID_FILE}"
    fi

    echo "[3/4] Starting new jar process..."
    nohup java -jar "${JAR_PATH}" --server.port="${PORT}" > app.log 2>&1 &
    NEW_PID=$!
    echo "${NEW_PID}" > "${PID_FILE}"

    echo "[4/4] Upgrade complete."
    echo "PID: ${NEW_PID}"
    echo "Service URL: http://localhost:${PORT}"
    echo "Logs: tail -f ${SCRIPT_DIR}/app.log"
    ;;

  *)
    echo "Unsupported mode: ${MODE}"
    echo "Usage: ./upgrade.sh [docker|jar] [slim|full]"
    exit 1
    ;;
esac
