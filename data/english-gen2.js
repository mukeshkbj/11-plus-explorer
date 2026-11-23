/* English generators, version 2: vocabulary and sentence completion, from the word lists in words.js. */
(function () {
'use strict';
const G = window.GENS && window.GENS.english, WD = window.WORDS; if (!G || !WD) return;
const T = G.table, { choices, Q } = window.GENCORE, { VOCAB, SYN } = WD;
const synOf = (a, b) => a === b || SYN.some(g => g.includes(a) && g.includes(b));
// Hard words come later in the list; level 1 uses the first part.
const band = d => d === 1 ? VOCAB.slice(0, 45) : d === 2 ? VOCAB : VOCAB.slice(30);
const fresh = f => (r, d) => (r.v >= 2 ? f(r, d) : null);

T.vocabulary = fresh((r, d) => {
  const [w, pos, mean, sent] = r.pick(band(d)), others = VOCAB.filter(v => v[0] !== w && !synOf(v[0], w) && v[2] !== mean);
  const example = sent.replace('___', w);
  if (r() < .5) {
    const wrong = r.shuffle(others.filter(v => v[1] === pos)).map(v => v[2]);
    return Q(`What does the word '${w}' mean?`, choices(r, mean, wrong), 'Think of a sentence where you have heard this word used.', ['Think about where you have met the word before, and rule out options that are clearly wrong.', `For example: "${example}"`, `So '${w}' means ${mean}.`]);
  }
  const wrong = r.shuffle(others.filter(v => v[1] === pos)).map(v => v[0]);
  return Q(`Which word means '${mean}'?`, choices(r, w, wrong), 'Say each word in a sentence. Which one fits the meaning?', [`'${w}' means ${mean}.`, `For example: "${example}"`]);
});

T.sentence_completion = fresh((r, d) => {
  const [w, pos, mean, sent] = r.pick(band(d)), wrong = r.shuffle(VOCAB.filter(v => v[1] === pos && v[0] !== w && !synOf(v[0], w))).map(v => v[0]);
  return Q(`Choose the word that best completes the sentence: ${sent}`, choices(r, w, wrong), 'Read the whole sentence with each word in the gap. Which one makes the best sense?', [`The sentence needs a word meaning "${mean}".`, `"${sent.replace('___', w)}"`]);
});
})();
