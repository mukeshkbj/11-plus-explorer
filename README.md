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

**Parent view** (PIN protected)
- Minutes, sessions and accuracy this week, plus a 14-day practice chart
- Readiness by subject, topics that need attention, and timed test history
- A study plan for the current stage, based on the exam date
- Print or save as PDF

## Project layout

```
index.html                 page shell and navigation
app.js                     the whole app (views, sessions, tests, progress)
styles.css                 styles
data/<subject>.js          topics, lessons, passages and flashcards
data/<subject>-questions.js  question bank
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

Progress is stored in the browser's local storage on the device and never leaves it. The Settings page can save a backup file and restore it on another device.

## Disclaimer

11+ Explorer is an independent practice tool. It is not affiliated with or endorsed by GL Assessment, CEM, ISEB or any council or school. Check your local council's website for official exam dates and arrangements.
