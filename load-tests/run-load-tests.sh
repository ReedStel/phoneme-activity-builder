#!/usr/bin/env bash
#
# Staged JMeter load test (Assessment 3).
#
# One plan, run at each level, writing one JTL file per level:
#   bash load-tests/run-load-tests.sh              # 1, 10, 100, 1000, 10000 users
#   bash load-tests/run-load-tests.sh 100 1000     # only those levels
#
# The app should be running as a production build (npm run build && npm start),
# because a development server measures the compiler, not the application.
#
# Settings can be overridden with environment variables:
#   JMETER_HOME, HOST, PORT, ACTIVITY_ID
set -u

JMETER_HOME=${JMETER_HOME:-/c/Users/Reed/Tools/apache-jmeter-5.6.3}
JAR="$JMETER_HOME/bin/ApacheJMeter.jar"
HOST=${HOST:-localhost}
PORT=${PORT:-3000}
ACTIVITY_ID=${ACTIVITY_ID:-1}
LEVELS=${*:-"1 10 100 1000 10000"}
OUT=load-tests/results

if [ ! -f "$JAR" ]; then
  echo "JMeter not found at $JAR. Set JMETER_HOME to your JMeter folder." >&2
  exit 1
fi

mkdir -p "$OUT"
win() { cygpath -w "$1" 2>/dev/null || echo "$1"; }

# Every level has the same shape so the numbers can be compared: new users
# arrive at 50 per second, and each one makes the same single pass of five
# requests. Only the number of users changes.
for USERS in $LEVELS; do
  RAMP=$(((USERS + 49) / 50))
  [ "$RAMP" -lt 1 ] && RAMP=1
  [ "$RAMP" -gt 200 ] && RAMP=200
  LOOPS=1

  CSV="$OUT/run-$USERS.csv"
  LOG="$OUT/jmeter-$USERS.log"
  rm -f "$CSV" "$LOG"

  echo "=== $USERS users, ramp ${RAMP}s, ${LOOPS} loops, 5 requests each"
  java -Xms512m -Xmx6g -jar "$(win "$JAR")" -n \
    -t "$(win load-tests/phoneme-builder.jmx)" \
    -Jusers="$USERS" -Jrampup="$RAMP" -Jloops="$LOOPS" \
    -Jhost="$HOST" -Jport="$PORT" -JactivityId="$ACTIVITY_ID" \
    -l "$(win "$CSV")" -j "$(win "$LOG")" 2>&1 | tail -4
done

node load-tests/summarise.mjs
