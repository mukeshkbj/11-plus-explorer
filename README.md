# 11+ Explorer

A free, friendly web app for practising for the 11+ exam, built around the Kent Test (GL Assessment style), with settings for other GL areas, CEM-style and ISEB-style papers.

It covers all four subjects: **Maths, English, Verbal Reasoning and Non-Verbal Reasoning**. Every topic has a short lesson, practice with hints and step-by-step explanations, and a quiz. On top of that there are timed tests and full mock exams.

No sign-up, no server, no tracking. Everything runs in the browser and progress is saved on the device only.

## Getting started

**Try it online:** https://mukeshkbj.github.io/11-plus-explorer/

Or download or clone this repository and open `index.html` in any modern browser. That's it: there is nothing to install or build.

```
git clone https://github.com/mukeshkbj/11-plus-explorer.git
open 11-plus-explorer/index.html
```

## What's inside

**Learn**
- 59 topics across the four subjects, each with a lesson, a worked example and a "watch out" tip
- Exercises with hints, full step-by-step methods and adaptive difficulty (it gets harder after three right in a row and easier after two wrong in a row)
- Topic quizzes, with a star badge for 8 out of 10 or more
- "Read to me" for questions, explanations and lessons, using the browser's built-in speech
- A pop-up lesson can be opened in the middle of a question
- 2,000+ original questions, plus reading passages, poems and cloze texts written for the app
- Question generators that make endless fresh questions with worked methods: every Maths topic, the letter, number, code and logic topics in Verbal Reasoning, and all ten Non-Verbal Reasoning topics (drawn as pictures)
- 🔥 Challenge practice (hard questions only) for every topic, and Challenge tests for every subject
- ✨ Optional AI-made exercises and mock papers using your own Anthropic (Claude) or OpenAI API key, set up in the parent view. The key stays on the device and is never included in backups
- Lessons with a step-by-step method, things to check, common traps, and a "Try one together" practice question

**Tests and mocks**
- 10-minute tests for one subject or a mix of subjects
- A weak-spot test on the four topics the student finds hardest right now
- Mock papers laid out like the Kent Test: English, Maths and a three-part Reasoning paper, or the complete exam with a break in the middle
- Every test is new: questions are picked at random with a balanced mix of difficulty, answer options are shuffled, and questions from recent tests are kept out
- **Generate a new test** straight from the results page
- Exam tools: flag a question to check later, a review of blank and flagged questions before submitting, a pace indicator, and 5-minute and 1-minute warnings
- Results by topic, with a comparison to the last attempt and the average time per question
- **Fix my mistakes**: each wrong answer comes back with hints, followed by a similar question to check the method has stuck

**Revise and track**
- Wrong answers return after 1, 3 and 7 days (spaced repetition)
- Flashcards for every subject
- Daily plan, streaks, stars and badges
- Exam readiness score for each subject and a countdown to the exam date
- Exam tips page covering technique, each subject and the day itself

**Report a problem and sync**
- 🚩 Report a problem on any question: it is hidden for that child and listed in the parent view, with a one-click GitHub report
- ☁️ Optional sync between devices using your own free Firebase project (set-up steps are in the parent view)

**Children on one device**
- "Who's learning today?" screen with an animal for each child
- Separate stars, history, revision, awards and parent report for every child

**Parent view** (PIN protected)
- Minutes, sessions and accuracy this week, plus a 14-day practice chart
- Readiness by subject, topics that need attention, and timed test history
- A study plan for the current stage, based on the exam date
- Print or save as PDF

## Sign-in (optional)

Add your Firebase project's web config to `config.js` and the app opens with a sign-in page:
Google, Facebook, Microsoft, Apple, GitHub or email. Signing in keeps every child's progress the same on
every device. A **Use without an account** link keeps the app usable without signing in. Set-up steps
for each provider are in [docs/LOGIN.md](docs/LOGIN.md).

## AI practice and AI mock exams (optional)

With a family's own Claude or OpenAI key, the app writes brand-new practice questions and complete
mock exams at a chosen level: **Easy, Medium, Exam mix, Hard, Hard mix or Very hard** (beyond the Kent
Test, for super-selective schools). If the chosen model isn't available for the key, the app finds one
that is and switches to it automatically.

## Mobile apps (iOS and Android)

The same app is packaged as native iOS and Android apps with [Capacitor](https://capacitorjs.com/).

**Android:** every push to `main` builds an installable `.apk` with GitHub Actions. Open the **Actions** tab, pick the latest "Build Android app" run, and download `11-plus-explorer-android` under Artifacts. Copy the `.apk` to an Android phone and open it (allow "install unknown apps" when asked).

**iPhone and iPad** (needs a Mac with Xcode):

```
npm install
npm run build
npx cap add ios
npx capacitor-assets generate --ios
npm run ios          # opens the project in Xcode
```

In Xcode, choose your Apple ID under Signing & Capabilities, plug in the iPhone and press Run.

**Publishing to Google Play and the App Store:** signed release workflows, store listing text, privacy answers and a step-by-step checklist are in [docs/STORE.md](docs/STORE.md). The privacy policy is at [privacy.html](https://mukeshkbj.github.io/11-plus-explorer/privacy.html).

## Project layout

```
index.html                 page shell and navigation
app.js                     the whole app (views, sessions, tests, progress)
styles.css                 styles
data/<subject>.js          topics, lessons, passages and flashcards
data/<subject>-questions.js  question bank
data/gen-core.js           shared tools for the question generators
data/maths-gen.js          maths question generators
data/vr-gen.js             verbal reasoning question generators
data/english-gen.js        spelling, grammar, synonym and apostrophe generators
data/nvr-gen.js            non-verbal reasoning puzzle engine (seeded, so every puzzle can be rebuilt from its id)
```

### Adding questions

Each question in `data/<subject>-questions.js` looks like this:

```js
{
  "id": "m-fractions-1-01",   // unique
  "topic": "fractions",       // a topic id from data/<subject>.js
  "d": 1,                     // 1 easy, 2 medium, 3 hard
  "q": "What is 3/4 of 20?",
  "opts": ["12", "15", "16", "5", "60"],  // five options
  "a": 1,                     // index of the correct option
  "hint": "Divide by the bottom, multiply by the top.",
  "steps": ["20 ÷ 4 = 5.", "5 × 3 = 15.", "The answer is 15."]
}
```

Optional fields: `svg` (a figure shown with the question), `of` (picture options for non-verbal reasoning), `p` and `gap` (reading passage and cloze gap).

## Privacy

Progress is stored in the browser's local storage on the device and never leaves it, separately for each child. An optional AI key is stored on the device too, never in backup files, and is sent only to the AI company you choose. The Settings page can save a backup file and restore it on another device.

## Copyright

© Learn Earn & Fun. The code is released under the MIT licence (see LICENSE).

## Disclaimer

11+ Explorer is an independent practice tool. It is not affiliated with or endorsed by GL Assessment, CEM, ISEB or any council or school. Check your local council's website for official exam dates and arrangements.
