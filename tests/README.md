# Tests

Everything runs on your own computer with no internet connection: Firebase and the AI company are faked.

## What there is

| File | What it checks |
| --- | --- |
| `gen/check.js` | Every question generator, every topic and level: five different options, the last step names the answer, no two options of equal value (such as 1/2 and 2/4), no broken text, and rebuilding a question from its id gives the same question. |
| `gen/compat.js` | Old (v1) generated ids saved in children's history still rebuild the same question. The old generators are read from git (`git show 38f76c4:data/...`), so it needs the full git history (it skips itself in a shallow clone). Old questions that offered two options of the same value were fixed on purpose and are allowed to differ. |
| `storage/heavy-year.js` | Simulates a very heavy year (3 children × 365 days × 4 sessions × 20 questions, a mock every week, AI questions) and prints how big the saved progress would be without the tidy-up. |
| `test_smoke.py` | Opens the app in Chrome: every topic (lesson, exercise, quiz), every mock paper, an exercise, a topic star, a timed test, keeping the place after a reload, and every page. |
| `test_storage.py` | Loads the heavy year into the browser: each child must be under 300 KB after the tidy-up, older history keeps its summary, every page that reads history still works, and sync does not fill tidied entries out again. |
| `test_sync.py` | Two devices and a sister's tablet signing in to one family account (with the fake Firebase in `fake-firebase/`). |
| `test_ai.py` | AI questions with a fake API: the key stays out of progress and backups, bad AI questions are dropped, AI exercises and an AI mock start. |

## Running them

You need Node.js (any recent version) and Python 3 with Playwright:

```
python3 -m pip install playwright
python3 -m playwright install chromium      # only if you have no Chrome
```

Then, from the repo root:

```
tests/run_all.sh                 # everything (about 3 minutes)
node tests/gen/check.js maths    # one subject's generators
python3 tests/test_smoke.py      # one browser test
```

The browser tests use Chrome at `/usr/bin/google-chrome`. Set `CHROME=/path/to/chrome` to use another one;
if that path does not exist, Playwright's own Chromium is used. The fake Firebase server listens on
127.0.0.1:8765 while `test_storage.py` and `test_sync.py` run, so run the tests one at a time.

GitHub runs the same checks on every push (`.github/workflows/tests.yml`).
