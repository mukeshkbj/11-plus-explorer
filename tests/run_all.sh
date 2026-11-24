#!/usr/bin/env bash
# Runs every automated check. Exits non-zero if any of them fails.
#   tests/run_all.sh            everything
#   GEN_N=200 tests/run_all.sh  fewer seeds per generator topic (faster)
set -u
cd "$(dirname "$0")/.."
fail=0; failed=()
# Serve the app over http for the browser tests (Chrome sometimes loses file:// storage when a page reloads).
PORT=${PORT:-8899}
python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 & HTTP_PID=$!
trap 'kill $HTTP_PID 2>/dev/null' EXIT
sleep 1
export APP_URL="http://127.0.0.1:$PORT/index.html"

run() { echo; echo "== $*"; if "$@"; then :; else fail=1; failed+=("$*"); fi; }
run node tests/gen/check.js --n "${GEN_N:-600}"
run node tests/gen/compat.js
run node tests/storage/heavy-year.js
for t in smoke storage sync ai; do run python3 tests/test_$t.py; done
for t in mock_print placement_plan drills; do run python3 tests/$t.py; done
echo
if [ $fail -eq 0 ]; then echo "All tests passed."; else echo "FAILED:"; printf '  %s\n' "${failed[@]}"; fi
exit $fail
