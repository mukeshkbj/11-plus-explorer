/* Verbal reasoning question generators: letter series, letter codes, letter connections, number series,
   related numbers, complete the sum, letters for numbers and reasoning (logic) puzzles.
   Word-based topics (synonyms, hidden words and so on) keep their hand-written questions. */
(function () {
'use strict';
const { choices, Q } = window.GENCORE;
const AL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHA = '<div class="alpha">A B C D E F G H I J K L M N O P Q R S T U V W X Y Z</div>';
const L = i => AL[((i % 26) + 26) % 26];
const idx = c => AL.indexOf(c);
const mv = k => k === 0 ? 'stays the same' : `moves ${k > 0 ? 'forward' : 'back'} ${Math.abs(k)}`;
const puz = s => `<div class="puz">${s}</div>`;
const sp = ' &nbsp; ';
const WORDS = ['BIRD', 'BOAT', 'CAKE', 'COIN', 'DUCK', 'FISH', 'FROG', 'GOLD', 'HAND', 'KITE', 'LAMP', 'MILK', 'NEST', 'PARK', 'RAIN', 'ROAD', 'SHIP', 'SNOW', 'STAR', 'TREE', 'WIND', 'WOLF', 'BREAD', 'CHAIR', 'CLOUD', 'DANCE', 'EAGLE', 'FRUIT', 'GRASS', 'HORSE', 'JUICE', 'LIGHT', 'MOUSE', 'PLANT', 'RIVER', 'SHEEP', 'STONE', 'TABLE', 'TIGER', 'TRAIN', 'WATER', 'ZEBRA'];
const NAMES = ['Amir', 'Bella', 'Chen', 'Daisy', 'Ethan', 'Freya', 'Grace', 'Harry', 'Isla', 'Jack', 'Kiran', 'Leo', 'Maya', 'Noah', 'Priya', 'Ravi', 'Sophie', 'Tom', 'Zara', 'Omar'];
const T = {};

// ------------------------------------------------------------ letter series
T.letter_series = (r, d) => {
  const wrap = d === 3;
  for (let t = 0; t < 30; t++) {
    const pairs = d > 1 || r() < .5;
    const k1 = d === 1 ? r.pick([1, 2, 3]) : r.pick([-3, -2, -1, 1, 2, 3, 4, 5]), k2 = r.pick([-3, -2, -1, 1, 2, 3]);
    const grow = d === 3 && r() < .5;   // the step itself grows: +1, +2, +3...
    const s1 = r.int(0, 25), s2 = r.int(0, 25);
    const pos = (s, k, i) => grow ? s + k * i * (i + 1) / 2 : s + k * i;
    const term = i => L(pos(s1, k1, i)) + (pairs ? L(pos(s2, k2, i)) : '');
    if (!wrap) { const ok = [0, 1, 2, 3, 4, 5].every(i => { const a = pos(s1, k1, i), b = pos(s2, k2, i); return a >= 0 && a < 26 && (!pairs || (b >= 0 && b < 26)); }); if (!ok) continue; }
    const shown = [0, 1, 2, 3, 4].map(term), ans = term(5);
    const near = [];
    const a5 = pos(s1, k1, 5), b5 = pos(s2, k2, 5);
    if (pairs) { near.push(L(a5 + 1) + L(b5), L(a5) + L(b5 + 1), L(a5 - 1) + L(b5), L(b5) + L(a5), L(a5) + L(b5 - 1), L(a5 + k1) + L(b5)); }
    else near.push(L(a5 + 1), L(a5 - 1), L(a5 + k1), L(a5 - k1), L(a5 + 2));
    const c = choices(r, ans, near);
    if (!c) continue;
    const jump = (k, who) => grow ? `${who} move ${k > 0 ? 'forward' : 'back'} ${Math.abs(k)}, then ${Math.abs(2 * k)}, then ${Math.abs(3 * k)}: the jump grows each time.` : `${who} ${Math.abs(k) ? `move ${k > 0 ? 'forward' : 'back'} ${Math.abs(k)}` : 'stay the same'} each time.`;
    const steps = ['Count along the alphabet carefully.', jump(k1, pairs ? 'The first letters' : 'The letters')];
    if (pairs) steps.push(jump(k2, 'The second letters'));
    if (wrap) steps.push('If you go past Z, carry on from A (and past A, carry on from Z).');
    return Q(`Find the ${pairs ? 'pair of letters' : 'letter'} that comes next in the series. Use the alphabet to help you.`, c, 'Look at the first letters on their own, then the second letters on their own. Count the jumps.', steps, { svg: ALPHA + puz(shown.join(sp) + sp + '?') });
  }
  return null;
};

// ------------------------------------------------------------ letter codes (words)
T.letter_codes = (r, d) => {
  for (let t = 0; t < 30; t++) {
    const kind = d === 1 ? 'shift' : d === 2 ? r.pick(['shift', 'shiftBack', 'mirror']) : r.pick(['grow', 'alt', 'mirror']);
    const k = d === 1 ? r.pick([1, 2, 3]) : r.pick([1, 2, 3, 4]), a1 = r.pick([1, 2]), a2 = -r.pick([1, 2]);
    const enc = w => w.split('').map((ch, i) => { const n = idx(ch); return kind === 'shift' ? L(n + k) : kind === 'shiftBack' ? L(n - k) : kind === 'mirror' ? L(25 - n) : kind === 'grow' ? L(n + i + 1) : L(n + (i % 2 ? a2 : a1)); }).join('');
    const len = d === 3 ? 5 : r.pick([4, 5]);
    const pool = WORDS.filter(w => w.length === len), [w1, w2] = r.sample(pool, 2);
    const rule = kind === 'shift' ? `Each letter moves forward ${k} in the alphabet.` : kind === 'shiftBack' ? `Each letter moves back ${k} in the alphabet.` : kind === 'mirror' ? 'Each letter is swapped with its mirror letter: A↔Z, B↔Y, C↔X and so on (the two letters are the same distance from each end of the alphabet).' : kind === 'grow' ? 'The first letter moves forward 1, the second forward 2, the third forward 3, and so on.' : `The letters take turns: the 1st, 3rd and 5th move ${a1 > 0 ? 'forward' : 'back'} ${Math.abs(a1)}, the 2nd and 4th move back ${Math.abs(a2)}.`;
    const decode = r() < .5;
    if (decode) {
      const others = r.sample(pool.filter(w => w !== w1 && w !== w2), 4);
      const c = choices(r, w2, others);
      if (!c) continue;
      return Q(`If the code for ${w1} is ${enc(w1)}, what does the code ${enc(w2)} mean? Use the alphabet to help you.`, c, 'Compare the word with its code letter by letter. Then work backwards for the new code.', [`Compare ${w1} with ${enc(w1)}, letter by letter.`, rule, `To decode, go the opposite way: ${enc(w2)} becomes ${w2}.`], { svg: ALPHA });
    }
    const right = enc(w2), wrong = [];
    const alt = f => w2.split('').map(f).join('');
    wrong.push(alt((ch, i) => i === 0 ? L(idx(right[0]) + 1) : right[i]), alt((ch, i) => i === len - 1 ? L(idx(right[i]) - 1) : right[i]), alt((ch, i) => L(idx(ch) - (idx(right[i]) - idx(ch)))), right.split('').reverse().join(''), alt((ch, i) => L(idx(ch) + 1)), alt((ch, i) => i === 1 ? L(idx(right[i]) + 2) : right[i]));
    const c = choices(r, right, wrong);
    if (!c) continue;
    return Q(`If the code for ${w1} is ${enc(w1)}, what is the code for ${w2}? Use the alphabet to help you.`, c, 'Work out how each letter of the first word changes, then do the same to the new word.', [`Compare ${w1} with ${enc(w1)}, letter by letter.`, rule, `Do the same to ${w2}: it becomes ${right}.`], { svg: ALPHA });
  }
  return null;
};

// ------------------------------------------------------------ letter connections (pairs)
T.letter_connections = (r, d) => {
  for (let t = 0; t < 30; t++) {
    const k1 = d === 1 ? r.pick([1, 2, 3]) : r.pick([-4, -3, -2, -1, 1, 2, 3, 4, 5]), k2 = d === 1 ? k1 : r.pick([-4, -3, -2, -1, 1, 2, 3, 4]);
    const mirror = d === 3 && r() < .35;
    const p = [r.int(0, 25), r.int(0, 25)], q = [r.int(0, 25), r.int(0, 25)];
    const f = (x, k) => mirror ? 25 - x : x + k;
    if (d === 1 && [f(p[0], k1), f(p[1], k2), f(q[0], k1), f(q[1], k2)].some(v => v < 0 || v > 25)) continue;
    const A = L(p[0]) + L(p[1]), B = L(f(p[0], k1)) + L(f(p[1], k2)), C = L(q[0]) + L(q[1]), D = L(f(q[0], k1)) + L(f(q[1], k2));
    if (A === C) continue;
    const c = choices(r, D, [L(f(q[0], k1) + 1) + L(f(q[1], k2)), L(f(q[0], k1)) + L(f(q[1], k2) - 1), L(f(q[1], k2)) + L(f(q[0], k1)), L(q[0] - k1) + L(q[1] - k2), L(f(q[0], k2)) + L(f(q[1], k1)), L(f(q[0], k1) + 2) + L(f(q[1], k2))]);
    if (!c) continue;
    const steps = mirror ? ['Each letter is swapped with its mirror letter: A↔Z, B↔Y, C↔X and so on.', `${C} becomes ${D}.`]
      : [`From ${A[0]} to ${B[0]}: ${mv(k1).replace('moves', 'move')}. From ${A[1]} to ${B[1]}: ${mv(k2).replace('moves', 'move')}.`, `Do the same to ${C}: ${C[0]} becomes ${D[0]} and ${C[1]} becomes ${D[1]}.`, 'If you go past Z, carry on from A (and past A, carry on from Z).'];
    return Q(`${A} is to ${B} as ${C} is to ...? Use the alphabet to help you.`, c, 'Work out how each letter of the first pair changes. Do exactly the same to the second pair.', steps, { svg: ALPHA });
  }
  return null;
};

// ------------------------------------------------------------ number series
T.number_series = (r, d) => {
  const rules = d === 1 ? ['add', 'sub', 'times2'] : d === 2 ? ['growAdd', 'alt', 'times', 'squares'] : ['twoSeries', 'growAdd2', 'mulAdd', 'fib', 'cubes', 'halve'];
  for (let t = 0; t < 30; t++) {
    const rule = r.pick(rules); let s = [], say;
    if (rule === 'add') { const a = r.int(1, 30), k = r.int(2, 12); s = [0, 1, 2, 3, 4, 5].map(i => a + i * k); say = [`Each number goes up by ${k}.`, `${s[4]} + ${k} = ${s[5]}.`]; }
    else if (rule === 'sub') { const a = r.int(60, 150), k = r.int(3, 13); s = [0, 1, 2, 3, 4, 5].map(i => a - i * k); say = [`Each number goes down by ${k}.`, `${s[4]} − ${k} = ${s[5]}.`]; }
    else if (rule === 'times2') { const a = r.int(1, 6); s = [0, 1, 2, 3, 4, 5].map(i => a * 2 ** i); say = ['Each number is double the one before.', `${s[4]} × 2 = ${s[5]}.`]; }
    else if (rule === 'growAdd') { const a = r.int(1, 20), k = r.int(1, 3); s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] + k * i); say = [`The jumps are ${[1, 2, 3, 4].map(i => s[i] - s[i - 1]).join(', ')}: they grow by ${k} each time.`, `Next jump is ${s[5] - s[4]}: ${s[4]} + ${s[5] - s[4]} = ${s[5]}.`]; }
    else if (rule === 'alt') { const a = r.int(5, 30), p = r.int(4, 12), m = r.int(1, p - 1); s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] + (i % 2 ? p : -m)); say = [`The numbers go up ${p}, then down ${m}, then up ${p}, then down ${m}...`, `${s[4]} + ${p} = ${s[5]}.`]; }
    else if (rule === 'times') { const a = r.int(1, 3), m = 3; s = [0, 1, 2, 3, 4, 5].map(i => a * m ** i); say = [`Each number is ${m} times the one before.`, `${s[4]} × ${m} = ${s[5]}.`]; }
    else if (rule === 'squares') { const a = r.int(1, 6); s = [0, 1, 2, 3, 4, 5].map(i => (a + i) ** 2); say = [`These are square numbers: ${a}×${a}, ${a + 1}×${a + 1}, ${a + 2}×${a + 2} and so on.`, `Next is ${a + 5} × ${a + 5} = ${s[5]}.`]; }
    else if (rule === 'twoSeries') { const a = r.int(1, 10), b = r.int(20, 40), ka = r.int(2, 6), kb = -r.int(1, 4); s = [a, b, a + ka, b + kb, a + 2 * ka, b + 2 * kb]; say = ['There are two series taking turns.', `1st, 3rd and 5th numbers: ${a}, ${a + ka}, ${a + 2 * ka} (up ${ka}). 2nd, 4th and 6th: ${b}, ${b + kb}, ${b + 2 * kb} (down ${-kb}).`, `The next number belongs to the second series: ${b + kb} − ${-kb} = ${s[5]}.`]; }
    else if (rule === 'growAdd2') { const a = r.int(1, 10); s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] + 2 ** i); say = [`The jumps are ${[1, 2, 3, 4].map(i => s[i] - s[i - 1]).join(', ')}: each jump doubles.`, `Next jump is ${s[5] - s[4]}: ${s[4]} + ${s[5] - s[4]} = ${s[5]}.`]; }
    else if (rule === 'mulAdd') { const a = r.int(1, 4), m = 2, c = r.int(1, 3); s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] * m + c); say = [`Each number is doubled, then ${c} is added.`, `${s[4]} × 2 + ${c} = ${s[5]}.`]; }
    else if (rule === 'fib') { const a = r.int(1, 4), b = r.int(1, 5); s = [a, b]; for (let i = 2; i < 7; i++) s.push(s[i - 1] + s[i - 2]); s = s.slice(1); say = ['Each number is the total of the two before it.', `${s[3]} + ${s[4]} = ${s[5]}.`]; }
    else if (rule === 'cubes') { const a = r.int(1, 2); s = [0, 1, 2, 3, 4, 5].map(i => (a + i) ** 3); say = [`These are cube numbers: ${a}×${a}×${a}, ${a + 1}×${a + 1}×${a + 1} and so on.`, `Next is ${a + 5}×${a + 5}×${a + 5} = ${s[5]}.`]; }
    else { const a = r.int(1, 5) * 64; s = [0, 1, 2, 3, 4, 5].map(i => a / 2 ** i); say = ['Each number is half of the one before.', `${s[4]} ÷ 2 = ${s[5]}.`]; }
    const shown = s.slice(0, 5), ans = s[5], diff = s[4] - s[3];
    const c = choices(r, ans, [s[4] + diff, ans + 1, ans - 1, ans + 2, s[4] * 2, ans - 2]);
    if (!c || shown.some(v => !Number.isInteger(v))) continue;
    return Q('Find the number that comes next in the series.', c, 'Write the jump between each pair of numbers underneath. Is it adding, taking away, multiplying, or two series taking turns?', ['Find how each number is made from the one before.'].concat(say.slice(0, -1), [say[say.length - 1]]), { svg: puz(shown.join(sp) + sp + '?') });
  }
  return null;
};

// ------------------------------------------------------------ related numbers
T.related_numbers = (r, d) => {
  const rules = d === 1 ? [['add the two outer numbers', (a, b) => a + b], ['subtract the right from the left', (a, b) => a - b]]
    : d === 2 ? [['multiply the two outer numbers', (a, b) => a * b], ['add the two outer numbers, then double', (a, b) => (a + b) * 2], ['multiply the outer numbers, then add 1', (a, b) => a * b + 1], ['halve the left number, then add the right', (a, b) => a % 2 ? NaN : a / 2 + b]]
    : [['subtract the right from the left, then multiply by 3', (a, b) => (a - b) * 3], ['multiply the outer numbers, then take away their total', (a, b) => a * b - (a + b)], ['square the left number, then take away the right', (a, b) => a * a - b], ['add the outer numbers, then square the result', (a, b) => (a + b) ** 2]];
  for (let t = 0; t < 40; t++) {
    const [say, f] = r.pick(rules);
    const lim = d === 3 ? 9 : 12, g = () => { const a = r.int(2, lim), b = r.int(1, a); return [a, b]; };
    const G = [g(), g(), g()]; const vals = G.map(([a, b]) => f(a, b));
    if (vals.some(v => !Number.isInteger(v) || v <= 0) || new Set(G.map(String)).size < 3) continue;
    // the rule must be the only simple rule that fits the two example groups
    const others = rules.filter(x => x[1] !== f).concat(d > 1 ? [] : [['', (a, b) => a * b]]);
    if (others.some(([, h]) => h(...G[0]) === vals[0] && h(...G[1]) === vals[1])) continue;
    const [a, b] = G[2], ans = vals[2];
    const c = choices(r, ans, [a + b, a * b, a - b, ans + 1, ans - 1, (a + b) * 2].filter(v => v !== ans));
    if (!c) continue;
    return Q('The numbers in each group are related in the same way. Find the missing number.', c, 'Try adding, subtracting and multiplying the outside numbers of the first group. Check your rule on the second group.',
      [`Rule: ${say}.`, `Check: (${G[0][0]}, ${G[0][1]}) gives ${vals[0]} and (${G[1][0]}, ${G[1][1]}) gives ${vals[1]}.`, `For (${a}, ${b}) the answer is ${ans}.`], { svg: puz(G.map(([x, y], i) => `(${x} [ ${i === 2 ? '?' : vals[i]} ] ${y})`).join(' &nbsp;&nbsp;&nbsp;&nbsp; ')) });
  }
  return null;
};

// ------------------------------------------------------------ complete the sum
T.complete_sum = (r, d) => {
  for (let t = 0; t < 40; t++) {
    let left, lv, right, ans, how;
    if (d === 1) { const a = r.int(5, 30), b = r.int(5, 30), c = r.int(2, a + b - 1); lv = a + b; left = `${a} + ${b}`; ans = lv - c; right = `${c} + ?`; how = `${lv} − ${c} = ${ans}`; }
    else if (d === 2) { const a = r.int(3, 9), b = r.int(3, 9), k = r.pick([2, 3, 4, 6]); lv = a * b; if (lv % k) continue; left = `${a} × ${b}`; const pick2 = r() < .5; if (pick2) { ans = lv / k; right = `${k} × ?`; how = `${lv} ÷ ${k} = ${ans}`; } else { const c = r.int(1, lv - 1); ans = lv + c; right = `? − ${c}`; how = `${lv} + ${c} = ${ans}`; } }
    else { const a = r.int(2, 9), b = r.int(2, 9), c = r.int(1, 20), k = r.pick([2, 3, 4, 5]), e = r.int(1, 30); lv = a * b + c; const part = lv - e; if (part <= 0) continue; ans = part * k; left = `${a} × ${b} + ${c}`; right = `? ÷ ${k} + ${e}`; how = `? ÷ ${k} must be ${lv} − ${e} = ${part}, so ? = ${part} × ${k} = ${ans}`; }
    const c = choices(r, ans, [lv, ans + 1, ans - 1, Math.round(ans / 2), ans + 10]);
    if (!c) continue;
    return Q('Find the number that makes both sides of the equals sign the same.', c, 'Work out the side without the gap first. The other side must come to the same total.', [`Work out the left side: ${left} = ${lv}.`, `The right side must also equal ${lv}: ${how}.`], { svg: puz(`${left} = ${right}`) });
  }
  return null;
};

// ------------------------------------------------------------ letters for numbers
T.letters_numbers = (r, d) => {
  for (let t = 0; t < 60; t++) {
    const vals = r.sample([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 24], 5), V = 'ABCDE'.split(''), v = k => vals[V.indexOf(k)];
    const [x, y, z] = r.sample(V, 3);
    let expr, val;
    if (d === 1) { const op = r.pick(['+', '−']); expr = `${x} ${op} ${y}`; val = op === '+' ? v(x) + v(y) : v(x) - v(y); }
    else if (d === 2) { const op = r.pick(['×', '÷', '+']); expr = `${x} ${op} ${y}`; val = op === '×' ? v(x) * v(y) : op === '÷' ? v(x) / v(y) : v(x) + v(y); }
    else { const form = r.pick([0, 1, 2]); expr = form === 0 ? `${x} × ${y} − ${z}` : form === 1 ? `(${x} + ${y}) ÷ ${z}` : `${x} + ${y} − ${z}`; val = form === 0 ? v(x) * v(y) - v(z) : form === 1 ? (v(x) + v(y)) / v(z) : v(x) + v(y) - v(z); }
    const hit = V.filter(k => v(k) === val);
    if (hit.length !== 1) continue;
    const swap = expr.replace(/[A-E]/g, k => v(k));
    return { q: 'Each letter stands for a number. Work out the sum and give the answer as a letter.', svg: puz(V.map(k => `${k} = ${v(k)}`).join(', ') + '<br>' + expr + ' = ?'), opts: V.slice(), a: V.indexOf(hit[0]), hint: 'Swap each letter for its number, work out the sum, then find the letter with that value.', steps: [`Swap the letters for numbers: ${swap} = ${val}.`, `Find the letter worth ${val}: it is ${hit[0]}.`, `The answer is ${hit[0]}.`] };
  }
  return null;
};

// ------------------------------------------------------------ reasoning: order puzzles and true statements
T.logic = (r, d) => {
  for (let t = 0; t < 60; t++) {
    const n = d === 1 ? 4 : 5, ppl = r.sample(NAMES, n), order = r.shuffle(ppl.slice());   // order[0] is the tallest / oldest / fastest
    const [adjMore, adjLess, most, least] = r.pick([['taller than', 'shorter than', 'tallest', 'shortest'], ['older than', 'younger than', 'oldest', 'youngest'], ['faster than', 'slower than', 'fastest', 'slowest']]);
    const rank = p => order.indexOf(p);
    // clues: each neighbouring pair once (enough to fix the order); harder levels mix in clues that skip a place
    let clues = [];
    for (let i = 0; i < n - 1; i++) clues.push([order[i], order[i + 1]]);
    if (d === 3) { const i = r.int(0, n - 3); clues.push([order[i], order[i + 2]]); }   // one extra clue that skips a place, to read past
    clues = r.shuffle(clues).map(([a, b]) => r() < .5 ? `${a} is ${adjMore} ${b}.` : `${b} is ${adjLess} ${a}.`);
    // check the clues fix the order exactly
    const rel = clues.map(s => { const m = s.match(new RegExp(`^(\\w+) is (${adjMore}|${adjLess}) (\\w+)\\.$`)); return m[2] === adjMore ? [m[1], m[3]] : [m[3], m[1]]; });
    const perms = []; const permute = (arr, k) => { if (k === arr.length) { perms.push(arr.slice()); return; } for (let i = k; i < arr.length; i++) { [arr[k], arr[i]] = [arr[i], arr[k]]; permute(arr, k + 1); [arr[k], arr[i]] = [arr[i], arr[k]]; } };
    permute(ppl.slice(), 0);
    const fits = perms.filter(p => rel.every(([a, b]) => p.indexOf(a) < p.indexOf(b)));
    if (fits.length !== 1) continue;
    const ask = d === 1 ? r.pick([0, n - 1]) : r.int(0, n - 1);
    const word = ask === 0 ? `the ${most}` : ask === n - 1 ? `the ${least}` : `the ${['', 'second', 'third', 'fourth'][ask]} ${most}`;
    const ans = order[ask];
    const c = choices(r, ans, ppl.filter(p => p !== ans).concat(['Cannot tell']));
    if (!c) continue;
    return Q(`${clues.join(' ')} Who is ${word}?`, c, 'Write the names in a line, from most to least, adding each clue one at a time.', ['Put the names in order, one clue at a time.', `From ${most} to ${least}: ${order.join(', ')}.`]);
  }
  return null;
};

window.GENCORE.register('vr', T);
})();
