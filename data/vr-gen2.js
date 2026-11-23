/* Verbal reasoning word-puzzle generators, using the word lists in words.js.
   Every puzzle is checked against the dictionary before it is used, so there is exactly one answer
   (for example, no second letter also fits in "insert a letter"). Puzzles that cannot be checked are thrown away. */
(function () {
'use strict';
const G = window.GENS && window.GENS.vr, WD = window.WORDS; if (!G || !WD) return;
const T = G.table, { choices, Q } = window.GENCORE;
const { DICT, SYN, ANT, CATS, COMPOUNDS, HOMS, REL } = WD;
const has = w => DICT.has(String(w).toLowerCase());
const puz = s => `<div class="puz">${s}</div>`, gap = ' &nbsp;&nbsp;&nbsp;&nbsp; ';
const BYLEN = {}; DICT.forEach(w => { (BYLEN[w.length] = BYLEN[w.length] || []).push(w); });
const ABC = 'abcdefghijklmnopqrstuvwxyz';
const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'];

// ---- meaning helpers
// Fast look-ups: which synonym groups each word is in, and every opposite pair (including synonyms of each side).
const GROUPS = new Map(); SYN.forEach((g, i) => g.forEach(w => { if (!GROUPS.has(w)) GROUPS.set(w, new Set()); GROUPS.get(w).add(i); }));
const synOf = (a, b) => { if (a === b) return true; const A = GROUPS.get(a), B = GROUPS.get(b); if (!A || !B) return false; for (const i of A) if (B.has(i)) return true; return false; };
const family = w => { const out = new Set([w]); (GROUPS.get(w) || new Set()).forEach(i => SYN[i].forEach(x => out.add(x))); return out; };
const OPP = new Set(); ANT.forEach(([p, q]) => family(p).forEach(x => family(q).forEach(y => { OPP.add(x + '|' + y); OPP.add(y + '|' + x); })));
const oppOf = (a, b) => OPP.has(a + '|' + b);
const related = (a, b) => synOf(a, b) || oppOf(a, b);
const ALLMEAN = Array.from(new Set(SYN.flat().concat(ANT.flat())));

function groupsPuzzle(r, a, b, same) {
  for (let t = 0; t < 40; t++) {
    const fill = r.sample(ALLMEAN, 4); const all = [a, b].concat(fill);
    if (new Set(all).size < 6 || fill.some(f => all.some(x => x !== f && related(x, f)))) continue;
    const g1 = r.shuffle([a, fill[0], fill[1]]), g2 = r.shuffle([b, fill[2], fill[3]]);
    const pairs = g1.flatMap(x => g2.map(y => [x, y]));
    if (pairs.some(([x, y]) => !(x === a && y === b) && (same ? synOf(x, y) : oppOf(x, y)))) continue;
    const ans = `${a} and ${b}`, others = r.shuffle(pairs.filter(([x, y]) => !(x === a && y === b)).map(p => p.join(' and ')));
    return Q(`Find two words, one from each group, that are ${same ? 'closest in meaning' : 'most opposite in meaning'}.`, choices(r, ans, others), 'Take each word from the first group in turn and test it against every word in the second group.',
      ['Work through the first group one word at a time, comparing it with each word in the second group.', same ? `'${a}' and '${b}' mean nearly the same thing.` : `'${a}' is the opposite of '${b}'.`], { svg: puz(`(${g1.join(', ')})${gap}(${g2.join(', ')})`) });
  }
  return null;
}
T.closest_meaning = since2((r, d) => { const pool = d === 1 ? SYN.slice(0, 45) : d === 2 ? SYN.slice(0, 90) : SYN.slice(40); const g = r.pick(pool); const [a, b] = d === 1 ? [g[0], g[1]] : r.sample(g, 2); return groupsPuzzle(r, a, b, true); }, T.closest_meaning);
T.opposite_meaning = since2((r, d) => { const pool = d === 1 ? ANT.slice(0, 40) : d === 2 ? ANT.slice(0, 80) : ANT.slice(40); const p = r.shuffle(r.pick(pool)); return groupsPuzzle(r, p[0], p[1], false); }, T.opposite_meaning);

// ---- odd two out
T.odd_two_out = since2((r, d) => {
  const pool = d === 3 ? CATS : CATS.filter(c => c.kind !== 'word'), X = r.pick(d === 3 && r() < .6 ? CATS.filter(c => c.kind === 'word') : pool);
  const others = CATS.filter(c => c.kind !== X.kind); if (others.length < 2) return null;
  const [Y, Z] = r.sample(others, 2); if (Y.kind === Z.kind && r() < .5) return null;
  const three = r.sample(X.words, 3), odd = [r.pick(Y.words), r.pick(Z.words)], all = r.shuffle(three.concat(odd));
  if (new Set(all).size < 5) return null;
  const pairs = []; for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) pairs.push(`${all[i]} and ${all[j]}`);
  const ansPair = all.filter(w => odd.includes(w)), ans = `${ansPair[0]} and ${ansPair[1]}`;
  return Q('Three of these words belong together. Which two words do not belong with them?', choices(r, ans, r.shuffle(pairs.filter(p => p !== ans))), 'Find the three that share something first. The two left over are the answer.',
    ['Look for a link that three of the words share.', `${three.map((w, i) => i ? w : w[0].toUpperCase() + w.slice(1)).join(', ').replace(/, ([^,]*)$/, ' and $1')} are all ${X.name}.`, `The two that do not belong are ${odd[0]} and ${odd[1]}.`], { svg: puz(all.join(gap)) });
}, T.odd_two_out);

// ---- word connections (analogies)
const RELS = REL.map(x => x.ant ? Object.assign({}, x, { pairs: ANT }) : x);
const ASSOC = {}; RELS.forEach(rel => rel.pairs.forEach(([a, b]) => { (ASSOC[a] = ASSOC[a] || new Set()).add(b); }));
T.word_connections = since2((r, d) => {
  const rel = r.pick(d === 1 ? RELS.filter((_, i) => [0, 2, 7, 8, 11, 12].includes(i)) : RELS), [p1, p2] = r.sample(rel.pairs, 2);
  const [A, B] = p1, [C, D] = p2; if (A === C || B === D) return null;
  const sameRel = rel.pairs.filter(([x]) => x === C).map(([, y]) => y); if (sameRel.length > 1) return null;
  const lure = Array.from(ASSOC[C] || []).filter(x => x !== D && !rel.pairs.some(([x1, y1]) => x1 === C && y1 === x));
  const near = rel.pairs.filter(([x, y]) => x !== C && y !== D).map(([, y]) => y);
  const pool = r.shuffle(lure).concat(r.shuffle(near)).filter(w => !rel.pairs.some(([x, y]) => x === C && y === w) && !(rel.ant && synOf(w, D)));
  const cap = s => s[0].toUpperCase() + s.slice(1);
  return Q(`${cap(A)} is to ${B} as ${C} is to ...`, choices(r, D, Array.from(new Set(pool))), 'Work out exactly how the first two words are linked. The second pair must be linked in the same way.',
    [`Find the link between the first pair: ${A} and ${B}. Here, ${rel.say}.`, `Apply the same link to '${C}'.`]);
}, T.word_connections);

// ---- multiple meanings
const HOMW = HOMS.map(h => h.w);
T.multiple_meanings = since2((r, d) => {
  const h = r.pick(d === 1 ? HOMS.slice(0, 30) : d === 2 ? HOMS : HOMS.slice(25));
  const others = r.sample(HOMW.filter(w => w !== h.w), 6);
  return Q('Which one word goes equally well with both pairs of words?', choices(r, h.w, [h.na, h.nb].concat(others)), 'The answer has two different meanings. One matches the first pair and the other matches the second pair.',
    ['Think of a word for the first pair, then check whether it also fits the second pair.', `'${h.w[0].toUpperCase() + h.w.slice(1)}' goes with ${h.a.join(' and ')}, and it also goes with ${h.b.join(' and ')}.`, `'${h.na}' only fits the first pair and '${h.nb}' only fits the second.`], { svg: puz(`(${h.a.join(', ')})${gap}(${h.b.join(', ')})`) });
}, T.multiple_meanings);

// ---- compound words
const CSET = new Set(COMPOUNDS.map(p => p.join(''))), FIRSTS = Array.from(new Set(COMPOUNDS.map(p => p[0]))), SECONDS = Array.from(new Set(COMPOUNDS.map(p => p[1])));
const isWord = s => CSET.has(s) || DICT.has(s);
T.compound_words = since2((r, d) => {
  const n = COMPOUNDS.length, [a, b] = r.pick(d === 1 ? COMPOUNDS.slice(0, 120) : d === 2 ? COMPOUNDS.slice(60, n - 30) : COMPOUNDS.slice(n - 60));
  for (let t = 0; t < 40; t++) {
    const g1 = r.shuffle([a].concat(r.sample(FIRSTS.filter(x => x !== a), 2))), g2 = r.shuffle([b].concat(r.sample(SECONDS.filter(x => x !== b), 2)));
    const combos = g1.flatMap(x => g2.map(y => [x, y]));
    if (combos.some(([x, y]) => !(x === a && y === b) && isWord(x + y))) continue;
    const ans = `${a} + ${b}`;
    return Q('Choose one word from each group to make a new word. The word from the first group comes first.', choices(r, ans, r.shuffle(combos.filter(([x, y]) => !(x === a && y === b)).map(p => p.join(' + ')))), 'Say each pair aloud as one word. Only one pair makes a real word.',
      ['Join each word in the first group to each word in the second group and listen for a real word.', `${a} + ${b} makes '${a + b}'.`], { svg: puz(`(${g1.join(', ')})${gap}(${g2.join(', ')})`) });
  }
  return null;
}, T.compound_words);

// ---- insert a letter
const ENDS = {}, STARTS = {};
DICT.forEach(w => { if (w.length < 3 || w.length > 6) return; const L = w[w.length - 1], F = w[0]; (ENDS[L] = ENDS[L] || []).push(w.slice(0, -1)); (STARTS[F] = STARTS[F] || []).push(w.slice(1)); });
T.insert_letter = since2((r, d) => {
  const len = d === 1 ? [2, 3] : d === 2 ? [3, 4] : [4, 5], okLen = s => s.length >= len[0] && s.length <= len[1];
  for (let t = 0; t < 30; t++) {
    const L = r.pick('abcdefghiklmnoprstwy'.split('')), lefts = (ENDS[L] || []).filter(okLen), rights = (STARTS[L] || []).filter(okLen);
    if (lefts.length < 2 || rights.length < 2) continue;
    const [x1, x2] = r.sample(lefts, 2), [y1, y2] = r.sample(rights, 2);
    const fits = M => has(x1 + M) && has(M + y1) && has(x2 + M) && has(M + y2);
    if (ABC.split('').some(M => M !== L && fits(M))) continue;
    const partial = ABC.split('').filter(M => M !== L && [has(x1 + M), has(M + y1), has(x2 + M), has(M + y2)].filter(Boolean).length >= 2);
    return Q('The same letter fits in both sets of brackets. It finishes the word on the left and starts the word on the right. Which letter is it?', choices(r, L, r.shuffle(partial).concat(r.shuffle(ABC.split('').filter(M => M !== L)))), 'Try each option in all four places. It has to make four real words.',
      ['Try each letter in all four gaps.', `'${L}' makes ${x1 + L}, ${L + y1}, ${x2 + L} and ${L + y2}.`, 'No other letter makes four real words.'], { svg: puz(`${x1} [ ? ] ${y1}${gap}${x2} [ ? ] ${y2}`) });
  }
  return null;
}, T.insert_letter);

// ---- hidden four-letter words in a sentence
const SUBJ = ['The old farmer', 'My little sister', 'Our new teacher', 'A tiny mouse', 'The brave knight', 'Every child', 'The hungry bear', 'Grandma', 'The clever fox', 'His best friend', 'The busy baker', 'A small boy', 'The tall giraffe', 'Her pet rabbit', 'The noisy crowd', 'Each player', 'The lost puppy', 'The kind nurse', 'Two pirates', 'A young otter', 'The angry chef', 'Our postman'];
const VERB = ['painted', 'carried', 'opened', 'found', 'chased', 'dropped', 'washed', 'mended', 'sold', 'kicked', 'packed', 'cleaned', 'watched', 'followed', 'baked', 'built', 'fed', 'hid', 'lifted', 'pushed', 'grabbed', 'counted'];
const OBJ = ['a red kite', 'the heavy box', 'every apple', 'the old gate', 'an empty jar', 'her blue umbrella', 'the wooden chair', 'two eggs', 'the garden shed', 'a funny hat', 'the school bell', 'his muddy boots', 'some orange paint', 'a large drum', 'the shiny coin', 'ten oranges', 'the broken toy', 'a green bucket', 'eight onions', 'the yellow ball', 'an old map', 'six pebbles'];
const WHERE = ['near the river', 'after lunch', 'before dinner', 'under a tree', 'at the park', 'by the lake', 'in the attic', 'every evening', 'behind the barn', 'inside the tent', 'along the beach', 'over the wall', 'at dawn', 'until dark', 'around noon', 'beside the pond', 'on the hill', 'in the rain', 'during the storm', 'outside the shop'];
const STOP = new Set(['then', 'than', 'this', 'that', 'them', 'they', 'were', 'what', 'when', 'have', 'here', 'there', 'were', 'with', 'from', 'into', 'onto', 'upon', 'thus', 'such']);
function hiddenIn(a, b) { const out = []; for (let k = 1; k <= 3; k++) { if (a.length < k || b.length < 4 - k) continue; const w = a.slice(-k) + b.slice(0, 4 - k); if (DICT.has(w) && !STOP.has(w)) out.push(w); } return out; }
T.hidden_word = since2((r, d) => {
  for (let t = 0; t < 60; t++) {
    const s = `${r.pick(SUBJ)} ${r.pick(VERB)} ${r.pick(OBJ)} ${r.pick(WHERE)}.`, words = s.replace('.', '').split(' '), lw = words.map(w => w.toLowerCase());
    const found = []; for (let i = 0; i < lw.length - 1; i++) hiddenIn(lw[i], lw[i + 1]).forEach(w => found.push({ i, w }));
    if (found.length !== 1) continue;
    const { i, w } = found[0], pairs = []; for (let j = 0; j < words.length - 1; j++) if (j !== i) pairs.push(`${lw[j]} ${lw[j + 1]}`);
    const ans = `${lw[i]} ${lw[i + 1]}`;
    if (d === 1 && w.length && lw[i].length > 5) continue;
    return Q('A four-letter word is hidden at the end of one word and the start of the next. Which two words hide it?', choices(r, ans, r.shuffle(pairs)), 'Run your finger along the sentence, reading across the gap between each pair of words.',
      ['Read across each gap between two words, looking for a four-letter word that uses letters from both.', `'${lw[i]} ${lw[i + 1]}' hides the word '${w}'.`], { svg: puz(s) });
  }
  return null;
}, T.hidden_word);

// ---- missing three letters
const D3 = BYLEN[3] || [];
T.missing_three = since2((r, d) => {
  const pool = WD.MISS3.filter(([w]) => d === 1 ? w.length <= 6 : d === 2 ? w.length >= 6 : w.length >= 6);
  for (let t = 0; t < 20; t++) {
    const [W, sent] = r.pick(pool), w = W.toLowerCase(), spots = [];
    for (let i = 1; i + 3 <= w.length; i++) { const x = w.slice(i, i + 3); if (D3.includes(x) && w.length - 3 >= 3) spots.push(i); }
    if (!spots.length) continue;
    const i = r.pick(spots), x = w.slice(i, i + 3), rest = w.slice(0, i) + w.slice(i + 3);
    const fitsAnywhere = y => { for (let k = 0; k <= rest.length; k++) if (has(rest.slice(0, k) + y + rest.slice(k))) return true; return false; };
    const wrong = r.shuffle(D3.filter(y => y !== x && !fitsAnywhere(y))).map(y => y.toUpperCase());
    return Q('The word in capitals has had three letters next to each other taken out. Those three letters spell a word. Which word completes the sentence?', choices(r, x.toUpperCase(), wrong), 'Think which word makes sense in the sentence, then see which three letters are missing.',
      [`The sentence needs the word ${W}.`, `${rest.toUpperCase()} with ${x.toUpperCase()} put back makes ${W}.`], { svg: puz(sent.replace('{}', rest.toUpperCase())) });
  }
  return null;
}, T.missing_three);

// ---- move a letter
T.move_letter = since2((r, d) => {
  const L1 = d === 1 ? 4 : d === 2 ? r.pick([4, 5]) : r.pick([5, 6]), L2 = d === 1 ? 3 : r.pick([3, 4]);
  for (let t = 0; t < 120; t++) {
    const w1 = r.pick(BYLEN[L1]), w2 = r.pick(BYLEN[L2]); if (w1 === w2) continue;
    const works = []; // letters that can move
    for (let i = 0; i < w1.length; i++) { const c = w1[i], rem = w1.slice(0, i) + w1.slice(i + 1); if (!has(rem)) continue; for (let k = 0; k <= w2.length; k++) { const nw = w2.slice(0, k) + c + w2.slice(k); if (has(nw) && nw !== w1) { works.push({ c, rem, nw }); break; } } }
    const letters = new Set(works.map(x => x.c)); if (letters.size !== 1) continue;
    const m = works[0], opts = Array.from(new Set(w1.split(''))).filter(c => c !== m.c);
    return Q('Move one letter from the first word to the second word to make two new words. The other letters must stay in the same order. Which letter moves?', choices(r, m.c, r.shuffle(opts).concat(r.shuffle(ABC.split('')))), 'Cover each letter of the first word in turn. Is what remains still a word?',
      ['Take out each letter of the first word in turn and see whether a real word is left.', `Removing ${m.c} from '${w1}' leaves '${m.rem}'.`, `Adding ${m.c} to '${w2}' makes '${m.nw}'.`], { svg: puz(`${w1.toUpperCase()}${gap}${w2.toUpperCase()}`) });
  }
  return null;
}, T.move_letter);

// ---- make a word from two outer words (wear [row] only)
function pickFrom(L, R, pat) { return pat.map(([s, i]) => (s ? R : L)[i]).join(''); }
T.make_word = since2((r, d) => {
  const n = d === 1 ? 3 : d === 2 ? r.pick([3, 4]) : 4, outer = d === 3 ? r.pick([4, 5]) : 4;
  for (let t = 0; t < 120; t++) {
    const pat = Array.from({ length: n }, () => [r.int(0, 1), r.int(0, outer - 1)]);
    if (new Set(pat.map(p => p.join())).size < n || pat.every(p => p[0] === pat[0][0])) continue;
    // choose the two middle words first, then find outer words with those letters in the right places
    const fit = (M, side) => BYLEN[outer].filter(w => pat.every(([s, i], k) => s !== side || w[i] === M[k]));
    const grp = () => { const M = r.pick(BYLEN[n]), Ls = fit(M, 0), Rs = fit(M, 1); return Ls.length && Rs.length ? [r.pick(Ls), r.pick(Rs)] : null; };
    const g1 = grp(), g2 = grp(); if (!g1 || !g2) continue;
    const [L1, R1] = g1, [L2, R2] = g2;
    const M1 = pickFrom(L1, R1, pat), M2 = pickFrom(L2, R2, pat);
    if (!has(M1) || !has(M2) || M1 === M2 || [L1, R1, L2, R2].includes(M2)) continue;
    // every way of making M1 from L1 and R1 must give the same answer
    const all = []; const rec = (k, acc) => { if (k === n) { all.push(acc); return; } for (let s = 0; s < 2; s++) for (let i = 0; i < outer; i++) if ((s ? R1 : L1)[i] === M1[k]) rec(k + 1, acc.concat([[s, i]])); };
    rec(0, []); if (all.some(p => pickFrom(L2, R2, p) !== M2)) continue;
    const near = []; for (let k = 0; k < 400 && near.length < 6; k++) { const p = Array.from({ length: n }, () => [r.int(0, 1), r.int(0, outer - 1)]), w = pickFrom(L2, R2, p); if (has(w) && w !== M2 && !near.includes(w)) near.push(w); }
    const say = pat.map(([s, i], k) => `letter ${k + 1} is the ${ORD[i]} letter of the ${s ? 'right' : 'left'} word`).join('; ');
    return Q('In the first group, the word in the middle is made from letters of the two outer words. Make the missing word in the second group in the same way.', choices(r, M2, near.concat(r.shuffle(BYLEN[n]).slice(0, 6))), 'Find where each letter of the middle word comes from, and number its position.',
      [`In the first group, '${M1}' is built like this: ${say}.`, `Take letters from the same positions in '${L2}' and '${R2}'.`], { svg: puz(`(${L1} [ ${M1} ] ${R1})${gap}(${L2} [ ? ] ${R2})`) });
  }
  return null;
}, T.make_word);

// ---- complete the word (comes → come)
function perms(n, k) { const out = []; const rec = acc => { if (acc.length === k) { out.push(acc); return; } for (let i = 0; i < n; i++) if (!acc.includes(i)) rec(acc.concat([i])); }; rec([]); return out; }
const PERMS = {}; [[4, 3], [4, 4], [5, 3], [5, 4], [5, 5], [6, 4], [6, 5]].forEach(([n, k]) => { PERMS[n + ':' + k] = perms(n, k); });
T.complete_word = since2((r, d) => {
  const [n, k] = r.pick(d === 1 ? [[5, 4], [4, 3]] : d === 2 ? [[4, 4], [5, 4], [5, 3]] : [[5, 5], [6, 4], [6, 5], [4, 4]]), all = PERMS[n + ':' + k];
  for (let t = 0; t < 200; t++) {
    const map = r.pick(all), app = (w, m) => m.map(i => w[i]).join('');
    if (d === 1 && map.some((v, i) => v !== i)) { if (r() < .7) continue; }
    const srcs = r.sample(BYLEN[n], 60).filter(w => has(app(w, map)) && app(w, map) !== w); if (srcs.length < 3) continue;
    const [a, b, c] = srcs, A = app(a, map), Bw = app(b, map), C = app(c, map);
    const okMaps = all.filter(m => app(a, m) === A && app(b, m) === Bw); if (okMaps.some(m => app(c, m) !== C)) continue;
    const near = Array.from(new Set(all.map(m => app(c, m)).filter(w => has(w) && w !== C)));
    return Q('The second word in each pair is made from the first word in the same way. Find the missing word.', choices(r, C, r.shuffle(near).concat(r.shuffle(BYLEN[k]).slice(0, 6))), 'Number the letters of the first word, then see which numbers are used to make the second word.',
      [`In '${a}' → '${A}', the new word uses these letters of the first word, in this order: ${map.map(i => ORD[i]).join(', ')}.`, `Check with the second pair: '${b}' → '${Bw}'.`, `Do the same to '${c}'.`], { svg: puz(`(${a}, ${A})${gap}(${b}, ${Bw})${gap}(${c}, ?)`) });
  }
  return null;
}, T.complete_word);

// ---- word and number codes
const W4 = (BYLEN[4] || []).filter(w => new Set(w).size === 4);
T.word_number_codes = since2((r, d) => {
  for (let t = 0; t < 80; t++) {
    const seed = r.pick(W4), pool = new Set(seed); r.sample(ABC.split('').filter(c => !pool.has(c)), d === 1 ? 1 : 2).forEach(c => pool.add(c));
    const cand = W4.filter(w => w.split('').every(c => pool.has(c))); if (cand.length < 5) continue;
    const words = r.sample(cand, 5), shown = words.slice(0, 4), coded = shown.slice(0, 3);
    const digits = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], pool.size), code = {}; Array.from(pool).forEach((c, i) => { code[c] = digits[i]; });
    const enc = w => w.split('').map(c => code[c]).join(''), codes = r.shuffle(coded.map(enc));
    // the codes must match the words in only one way
    const ways = perms(3, 3).filter(p => { const m = {}, back = {}; return p.every((ci, wi) => coded[wi].split('').every((ch, k) => { const dg = codes[ci][k]; if ((m[ch] && m[ch] !== dg) || (back[dg] && back[dg] !== ch)) return false; m[ch] = dg; back[dg] = ch; return true; })); });
    if (ways.length !== 1) continue;
    const known = new Set(coded.join('')), target = d === 3 && r() < .5 ? null : (shown[3].split('').every(c => known.has(c)) ? shown[3] : words[4].split('').every(c => known.has(c)) ? words[4] : null);
    const show = `${shown.map(w => w.toUpperCase()).join(' &nbsp; ')}<br>${codes.join(' &nbsp; ')}`;
    const say = Array.from(known).sort().map(c => `${c.toUpperCase()} = ${code[c]}`).join(', ');
    if (target) { const ans = enc(target), wrong = new Set(); for (let k = 0; k < 40 && wrong.size < 6; k++) { const p = r.shuffle(ans.split('')).join(''); if (p !== ans) wrong.add(p); } if (wrong.size < 4) continue;
      return Q(`The codes for three of these four words are shown, but not in the same order as the words. Each letter always has the same number. What is the code for ${target.toUpperCase()}?`, choices(r, ans, Array.from(wrong)), 'Look for a letter that appears in the same position in two words, or a code with a matching digit.',
        ['Match the codes to the words by looking for letters that repeat in the same position.', `The letters stand for: ${say}.`, `So ${target.toUpperCase()} is ${ans}.`], { svg: puz(show) }); }
    const w = r.pick(coded), c = enc(w);
    return Q(`The codes for three of these four words are shown, but not in the same order as the words. Each letter always has the same number. Which word has the code ${c}?`, choices(r, w.toUpperCase(), shown.filter(x => x !== w).map(x => x.toUpperCase()).concat([words[4].toUpperCase()])), 'Work out which number stands for each letter first.',
      ['Match the codes to the words by looking for letters that repeat in the same position.', `The letters stand for: ${say}.`, `So ${c} spells ${w.toUpperCase()}.`], { svg: puz(show) });
  }
  return null;
}, T.word_number_codes);

// Topics that only had hand-written questions get generators from version 2; for them the version check is not needed,
// but older topics keep their old questions for old ids.
function since2(fresh, old) { return old ? window.GENCORE.since(2, 0.6, old, fresh) : (r, d) => (r.v >= 2 ? fresh(r, d) : null); }
})();
