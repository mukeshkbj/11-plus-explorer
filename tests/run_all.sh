#!/usr/bin/env bash
# Runs every automated check. Exits non-zero if any of them fails.
#   tests/run_all.sh            everything
#   GEN_N=200 tests/run_all.sh  fewer seeds per generator topic (faster)
set -u
cd "$(dirname "$0")/.."
fail=0; failed=()
run() { echo; echo "== $*"; if "$@"; then :; else fail=1; failed+=("$*"); fi; }
run node tests/gen/check.js --n "${GEN_N:-600}"
run node tests/gen/compat.js
run node tests/storage/heavy-year.js
for t in smoke storage sync ai; do run python3 tests/test_$t.py; done
for t in mock_print placement_plan drills; do run python3 tests/$t.py; done
echo
if [ $fail -eq 0 ]; then echo "All tests passed."; else echo "FAILED:"; printf '  %s\n' "${failed[@]}"; fi
exit $fail
