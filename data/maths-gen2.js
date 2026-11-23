/* Maths question generators, version 2: new topics and more question types.
   New topics: factors, multiples and primes (with square and cube numbers) and probability.
   Added to existing topics: Roman numerals, map scales, speed and timetables, calendars, Venn and Carroll
   diagrams, line graphs, bar charts, tally charts, compass and clock angles, and more coordinate questions.
   Older question ids still rebuild exactly as before (see "since" in gen-core.js). */
(function () {
'use strict';
const G = window.GENS && window.GENS.maths; if (!G) return;
const T = G.table, { choices, Q, N, gcd, since } = window.GENCORE;
const P = (n, d) => `${n}/${d}`;
const simp = (n, d) => { const g = gcd(n, d) || 1; return P(n / g, d / g); };
const pad2 = n => String(n).padStart(2, '0');
const hhmm = m => { m = ((m % 1440) + 1440) % 1440; return pad2(Math.floor(m / 60)) + ':' + pad2(m % 60); };
const dur = m => m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}` : `${m} min`;
const NAMES = ['Amir', 'Bella', 'Chen', 'Daisy', 'Ethan', 'Freya', 'Grace', 'Harry', 'Isla', 'Jack', 'Kiran', 'Leo', 'Maya', 'Noah', 'Olivia', 'Priya', 'Ravi', 'Sophie', 'Tom', 'Zara'];
const pickLevel = (r, d, byLevel) => r.pick(byLevel[d - 1])(r);
const isPrime = n => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const factors = n => { const f = []; for (let i = 1; i <= n; i++) if (n % i === 0) f.push(i); return f; };
const lcm = (a, b) => a * b / gcd(a, b);
const ink = '#1d2b3a', soft = '#5b6b7c', fillA = 'rgba(59,91,219,.16)', fillB = 'rgba(240,140,0,.18)';

// ------------------------------------------------------------ factors, multiples and primes (new topic)
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
const ODD_NOT_PRIME = [9, 15, 21, 25, 27, 33, 35, 39, 45, 49, 51, 55, 57, 63, 65, 69, 75, 77, 81, 85, 87, 91, 93, 95];
const primeFactors = n => { const out = []; for (let p = 2; n > 1; p++) while (n % p === 0) { out.push(p); n /= p; } return out; };
T.factors = (r, d) => pickLevel(r, d, [
  [r => { const n = r.pick([12, 16, 18, 20, 24, 28, 30, 32, 36, 40, 42, 45, 48, 54, 56, 60]), f = factors(n).filter(x => x > 1 && x < n), ans = r.pick(f), wrong = [];
      for (let k = 2; k < n && wrong.length < 8; k++) if (n % k) wrong.push(k);
      return Q(`Which of these numbers is a factor of ${n}?`, choices(r, ans, r.shuffle(wrong)), 'A factor divides into the number exactly, with nothing left over.', [`Try dividing ${n} by each option.`, `${n} ÷ ${ans} = ${n / ans} exactly, so ${ans} is a factor.`, 'The others leave a remainder.']); },
   r => { const k = r.int(3, 9), ans = k * r.int(4, 12), wrong = []; for (let t = 1; wrong.length < 6; t++) { const w = ans + t * r.pick([1, -1]) * r.int(1, k - 1); if (w > 0 && w % k) wrong.push(w); }
      return Q(`Which of these numbers is a multiple of ${k}?`, choices(r, ans, wrong), `Multiples of ${k} are in the ${k} times table.`, [`${ans} = ${k} × ${ans / k}, so it is in the ${k} times table.`]); },
   r => { const ans = r.pick(PRIMES.slice(3, 16)), wrong = r.sample(ODD_NOT_PRIME.filter(x => x < 70), 3).concat([r.pick([1, 4, 6, 8, 10, 12])]);
      return Q('Which of these is a prime number?', choices(r, ans, wrong), 'A prime number has exactly two factors: 1 and itself.', [`${ans} can only be divided exactly by 1 and ${ans}.`, `The others have more factors, for example ${wrong[0]} = ${factors(wrong[0])[1]} × ${wrong[0] / factors(wrong[0])[1]}.`]); },
   r => { const n = r.int(2, 12), ans = n * n;
      return Q(`What is ${n}² (${n} squared)?`, choices(r, ans, [n * 2, n + 2, ans + n, (n + 1) * (n + 1)]), 'Squared means multiplied by itself.', [`${n}² = ${n} × ${n} = ${ans}.`]); }],
  [r => { const n = r.pick([12, 18, 20, 24, 28, 30, 32, 36, 40, 42, 44, 45, 48, 50]), f = factors(n);
      return Q(`How many factors does ${n} have?`, choices(r, f.length, [f.length - 1, f.length - 2, f.length + 1, f.length / 2]), 'Find factors in pairs: 1 × n, 2 × ?, 3 × ?...', [`Factor pairs of ${n}: ${f.slice(0, Math.ceil(f.length / 2)).map(a => `${a} × ${n / a}`).join(', ')}.`, `That is ${f.length} factors: ${f.join(', ')}.`]); },
   r => { const g = r.int(2, 9), a = g * r.int(2, 7), b = g * r.int(2, 7); if (a === b) return null; const h = gcd(a, b);
      return Q(`What is the highest common factor of ${a} and ${b}?`, choices(r, h, [Math.min(a, b), h / 2, a * b / h, h * 2, g === h ? h + 1 : g].filter(x => x !== h)), 'List the factors of each number. Find the biggest one they share.', [`Factors of ${a}: ${factors(a).join(', ')}.`, `Factors of ${b}: ${factors(b).join(', ')}.`, `The biggest one in both lists is ${h}.`]); },
   r => { const a = r.int(2, 9), b = r.int(3, 12); if (a === b) return null; const l = lcm(a, b);
      return Q(`What is the lowest common multiple of ${a} and ${b}?`, choices(r, l, [a * b === l ? l * 2 : a * b, l + a, Math.max(a, b), gcd(a, b) + l / 2]), 'Write out the times tables of each number until you find one in both.', [`Multiples of ${a}: ${[1, 2, 3, 4, 5, 6].map(k => a * k).join(', ')}...`, `Multiples of ${b}: ${[1, 2, 3, 4].map(k => b * k).join(', ')}...`, `The first number in both lists is ${l}.`]); },
   r => { const n = r.int(2, 5), ans = n ** 3;
      return Q(`What is ${n}³ (${n} cubed)?`, choices(r, ans, [n * 3, n * n, n ** 3 + n, (n + 1) ** 3]), 'Cubed means the number multiplied by itself three times.', [`${n}³ = ${n} × ${n} × ${n}.`, `${n} × ${n} = ${n * n}, then × ${n} = ${ans}.`]); },
   r => { const sq = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144], ans = r.pick(sq.slice(3)), wrong = r.sample([12, 18, 20, 24, 27, 32, 40, 45, 48, 50, 60, 72, 80, 90].filter(x => !sq.includes(x)), 4);
      return Q('Which of these is a square number?', choices(r, ans, wrong), 'A square number is a whole number multiplied by itself.', [`${ans} = ${Math.sqrt(ans)} × ${Math.sqrt(ans)}.`, 'None of the others can be made by multiplying a whole number by itself.']); },
   r => { const n = r.int(20, 88), next = PRIMES.find(p => p > n);
      return Q(`What is the first prime number after ${n}?`, choices(r, next, [n + 1, PRIMES.find(p => p > next), next + 2, ODD_NOT_PRIME.find(x => x > n) || next + 4]), 'Test each number after it. Even numbers (except 2) are never prime.', [`Check the numbers after ${n} one by one.`, `${next} has only two factors, 1 and ${next}, so it is prime.`]); }],
  [r => { const n = r.pick([24, 30, 36, 40, 42, 48, 60, 72, 84, 90, 100, 120]), pf = primeFactors(n), right = pf.join(' × ');
      const wrongs = [pf.slice(1).join(' × '), [2].concat(pf).join(' × '), pf.length > 2 ? [pf[0] * pf[1]].concat(pf.slice(2)).join(' × ') : pf.concat([2]).join(' × '), pf.concat([3]).join(' × '), [pf[0], n / pf[0]].join(' × ')];
      return Q(`Which of these shows ${n} as a product of prime factors?`, choices(r, right, wrongs.filter(w => w !== right)), 'Keep dividing by the smallest prime you can (2, then 3, then 5...) until you reach 1.', [`${n} → ` + pf.map((p, i) => `÷ ${p}`).join(' → ') + ' → 1.', `So ${n} = ${right}. Every number in the answer must be prime.`]); },
   r => { const a = r.int(2, 9), b = r.int(2, 9), ans = PRIMES.filter(p => p > a * 5 && p < b * 5 + 30);
      const lo = r.int(10, 40), hi = lo + r.int(10, 20), ps = PRIMES.filter(p => p > lo && p < hi); if (ps.length < 2) return null; const s = ps.reduce((x, y) => x + y, 0);
      return Q(`What is the total of all the prime numbers between ${lo} and ${hi}?`, choices(r, s, [s - ps[0], s + ps[ps.length - 1], s + (ODD_NOT_PRIME.find(x => x > lo && x < hi) || 2), ps.length]), 'Find each prime number in that range first, then add them up.', [`The primes between ${lo} and ${hi} are ${ps.join(', ')}.`, `${ps.join(' + ')} = ${s}.`]); },
   r => { const a = r.pick([8, 10, 12, 15, 20]), b = r.pick([6, 9, 12, 15, 18, 25, 30]); if (a === b) return null; const l = lcm(a, b); if (l > 180) return null; const st = r.int(14, 32) * 30;
      return Q(`Bus A leaves the station every ${a} minutes and bus B every ${b} minutes. They both leave at ${hhmm(st)}. When will they next leave together?`, choices(r, hhmm(st + l), [hhmm(st + a * b), hhmm(st + a + b), hhmm(st + Math.max(a, b)), hhmm(st + l + gcd(a, b))].filter(x => x !== hhmm(st + l))), 'Find the lowest common multiple of the two gaps.', [`Multiples of ${a}: ${[1, 2, 3, 4, 5].map(k => a * k).join(', ')}...`, `Multiples of ${b}: ${[1, 2, 3, 4].map(k => b * k).join(', ')}...`, `The first one in both is ${l} minutes. ${hhmm(st)} + ${l} min = ${hhmm(st + l)}.`]); },
   r => { const a = r.int(2, 5), b = r.int(3, 9), ans = a ** 3 + b * b;
      return Q(`What is ${a}³ + ${b}²?`, choices(r, ans, [a * 3 + b * 2, a * a + b ** 3, a ** 3 * b * b, ans + 1]), 'Work out each power first, then add.', [`${a}³ = ${a} × ${a} × ${a} = ${a ** 3}.`, `${b}² = ${b} × ${b} = ${b * b}.`, `${a ** 3} + ${b * b} = ${ans}.`]); },
   r => { const k = r.pick([4, 6, 7, 8, 9]), big = r.pick([36, 48, 60, 72, 84, 90, 96]), lo = r.int(10, 30);
      const fit = factors(big).filter(x => x % k === 0 && x > lo && x < 100); if (fit.length !== 1) return null; const ans = fit[0];
      const wrong = factors(big).filter(x => x > lo && x % k).concat([k * r.int(4, 11)].filter(x => big % x)).filter(x => x !== ans);
      return Q(`I am a whole number greater than ${lo}. I am a multiple of ${k} and a factor of ${big}. What number am I?`, choices(r, ans, r.shuffle(wrong)), `List the factors of ${big}, then keep only those in the ${k} times table.`, [`Factors of ${big}: ${factors(big).join(', ')}.`, `Of these, the ones above ${lo} in the ${k} times table: ${ans}.`]); }]
]);

// ------------------------------------------------------------ probability (new topic)
const LIKE = ['impossible', 'unlikely', 'even chance', 'likely', 'certain'];
const COL = ['red', 'blue', 'green', 'yellow', 'white', 'purple'];
T.probability = (r, d) => pickLevel(r, d, [
  [r => { const tot = r.pick([6, 8, 10, 12, 20]), c = r.pick(COL), n = r.pick([0, r.int(1, tot / 2 - 1), tot / 2, r.int(tot / 2 + 1, tot - 1), tot]);
      const word = n === 0 ? 'impossible' : n === tot ? 'certain' : n * 2 === tot ? 'even chance' : n * 2 < tot ? 'unlikely' : 'likely';
      return Q(`A bag has ${tot} counters. ${n === 0 ? `None of them are ${c}` : n === tot ? `All of them are ${c}` : `${n} of them are ${c}`}. How likely is it to pick a ${c} counter without looking?`, choices(r, word, LIKE.filter(w => w !== word)), 'Compare how many are that colour with the total. Half is an even chance.', [`${n} out of ${tot} counters are ${c}.`, n === 0 ? 'There are none, so it is impossible.' : n === tot ? 'Every counter is that colour, so it is certain.' : n * 2 === tot ? 'That is exactly half, so it is an even chance.' : n * 2 < tot ? 'That is less than half, so it is unlikely.' : 'That is more than half, so it is likely.']); },
   r => { const k = r.int(1, 6);
      return Q(`An ordinary dice is rolled. What is the probability of rolling a ${k}?`, choices(r, P(1, 6), [P(k, 6) === P(1, 6) ? P(1, 2) : P(k, 6), P(1, 5), P(6, 1), P(1, 12)]), 'A dice has 6 faces, each equally likely.', ['There is one face with that number.', `So the probability is 1 out of 6 = ${P(1, 6)}.`]); },
   r => { const sides = r.pick([4, 5, 6, 8, 10]), c = r.pick(COL), n = r.int(1, sides - 1);
      return Q(`A spinner has ${sides} equal sections. ${n} of them are ${c}. What is the probability of landing on ${c}?`, choices(r, P(n, sides), [P(sides - n, sides), P(n, sides + n), P(1, sides), P(n, 10) === P(n, sides) ? P(n + 1, sides) : P(n, 10)]), 'Probability = number of ways it can happen ÷ total number of equal sections.', [`${n} out of ${sides} sections are ${c}.`, `Probability = ${P(n, sides)}.`]); }],
  [r => { const a = r.int(2, 9), b = r.int(2, 9), c = r.int(1, 6), tot = a + b + c, [x, y, z] = r.sample(COL, 3), pick = r.pick([x, y]), n = pick === x ? a : b;
      return Q(`A bag has ${a} ${x}, ${b} ${y} and ${c} ${z} marbles. One is taken out without looking. What is the probability it is ${pick}? Give the fraction in its simplest form.`, choices(r, simp(n, tot), [P(n, tot) === simp(n, tot) ? P(n, tot - n) : P(n, tot), simp(tot - n, tot), P(1, 3), simp(n, a + b)].filter(w => w !== simp(n, tot))), 'Probability = how many of that colour ÷ total number of marbles. Then simplify.', [`There are ${a} + ${b} + ${c} = ${tot} marbles.`, `${n} of them are ${pick}: ${P(n, tot)}.`, simp(n, tot) !== P(n, tot) ? `Simplify: ${P(n, tot)} = ${simp(n, tot)}.` : `${P(n, tot)} cannot be simplified.`]); },
   r => { const tot = r.pick([10, 20, 25, 50]), n = r.int(1, tot - 1), pc = Math.round(n / tot * 100), c = r.pick(COL);
      return Q(`In a box of ${tot} pens, ${n} are ${c}. What is the probability, as a percentage, of picking a ${c} pen?`, choices(r, pc + '%', [(100 - pc) + '%', n + '%', Math.round(n / tot * 10) + '%', (pc + 5) + '%'].filter(w => w !== pc + '%')), 'Write it as a fraction, then change the fraction to a percentage (out of 100).', [`The probability is ${P(n, tot)}.`, `${P(n, tot)} = ${P(pc, 100)} = ${pc}%.`]); },
   r => { const k = r.int(2, 9), tot = r.pick([10, 12, 15, 20]); if (k >= tot) return null;
      return Q(`The probability that a raffle ticket wins a prize is ${P(k, tot)}. What is the probability that it does NOT win?`, choices(r, P(tot - k, tot), [P(k, tot), P(1, tot), P(tot, k), P(tot - k, k)]), 'The probabilities of something happening and not happening add up to 1.', [`1 = ${P(tot, tot)}.`, `${P(tot, tot)} − ${P(k, tot)} = ${P(tot - k, tot)}.`]); }],
  [r => { const tot = r.pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), ways = Math.min(tot - 1, 13 - tot);
      return Q(`Two ordinary dice are rolled and the scores are added. What is the probability that the total is ${tot}? Give the answer in its simplest form.`, choices(r, simp(ways, 36), [P(1, 11), P(ways, 12), simp(ways + 1, 36), P(1, 6) === simp(ways, 36) ? P(1, 12) : P(1, 6)].filter(w => w !== simp(ways, 36))), 'There are 6 × 6 = 36 equally likely results. Count the ones that make the total.', [`Ways to make ${tot}: ${Array.from({ length: 6 }, (_, i) => i + 1).filter(a => tot - a >= 1 && tot - a <= 6).map(a => `${a}+${tot - a}`).join(', ')}.`, `That is ${ways} ways out of 36: ${P(ways, 36)}${simp(ways, 36) !== P(ways, 36) ? ` = ${simp(ways, 36)}` : ''}.`]); },
   r => { const sides = r.pick([4, 5, 8, 10]), n = r.int(1, sides - 1), spins = sides * r.int(5, 20), c = r.pick(COL), ans = spins * n / sides;
      return Q(`A spinner with ${sides} equal sections has ${n} ${c} section${n > 1 ? 's' : ''}. It is spun ${spins} times. About how many times would you expect it to land on ${c}?`, choices(r, ans, [spins / sides, spins - ans, ans + n, ans * 2]), 'Expected number = probability × number of spins.', [`Probability of ${c} = ${P(n, sides)}.`, `${P(n, sides)} of ${spins} = ${spins} ÷ ${sides} × ${n} = ${ans}.`]); },
   r => { const red = r.int(2, 7), blue = r.int(red + 2, red + 10), [a, b] = r.sample(COL, 2), add = blue - red;
      return Q(`A bag has ${red} ${a} and ${blue} ${b} counters. How many more ${a} counters must be added so that picking ${a} is an even chance?`, choices(r, add, [blue, add + 1, add - 1 > 0 ? add - 1 : add + 2, Math.round((red + blue) / 2)]), 'An even chance means there are the same number of each colour.', [`For an even chance there must be ${blue} ${a} counters, the same as ${b}.`, `${blue} − ${red} = ${add} more.`]); },
   r => { const flips = r.pick([2, 3]), outs = 2 ** flips, which = flips === 2 ? r.pick(['two heads', 'one head and one tail', 'at least one head']) : r.pick(['three heads', 'exactly two heads', 'at least one tail']);
      const ways = { 'two heads': 1, 'one head and one tail': 2, 'at least one head': 3, 'three heads': 1, 'exactly two heads': 3, 'at least one tail': 7 }[which];
      return Q(`A coin is flipped ${flips === 2 ? 'twice' : 'three times'}. What is the probability of getting ${which}?`, choices(r, simp(ways, outs), [P(1, flips + 1), simp(ways + 1, outs), P(1, flips), simp(outs - ways, outs) === simp(ways, outs) ? P(1, 3) : simp(outs - ways, outs)].filter(w => w !== simp(ways, outs))), 'List every possible result: HH, HT, TH, TT...', [`There are ${outs} equally likely results: ${flips === 2 ? 'HH, HT, TH, TT' : 'HHH, HHT, HTH, HTT, THH, THT, TTH, TTT'}.`, `${ways} of them give ${which}: ${P(ways, outs)}${simp(ways, outs) !== P(ways, outs) ? ` = ${simp(ways, outs)}` : ''}.`]); }]
]);

// ------------------------------------------------------------ Roman numerals (added to place value)
const ROM = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
const roman = n => { let s = ''; for (const [v, k] of ROM) while (n >= v) { s += k; n -= v; } return s; };
const romanWrong = n => { const s = roman(n); return [s.replace('IV', 'IIII').replace('IX', 'VIIII').replace('XL', 'XXXX').replace('XC', 'LXXXX').replace('CD', 'CCCC').replace('CM', 'DCCCC'), roman(n + 1), roman(n > 10 ? n - 10 : n + 10), roman(n + 5), s.split('').reverse().join('')]; };
const romanQ = (r, d) => {
  const n = d === 1 ? r.int(4, 49) : d === 2 ? r.int(40, 499) : r.pick([r.int(400, 2026), r.int(1066, 2026)]), toRoman = r() < .5;
  const parts = ROM.reduce((acc, [v, k]) => { let m = acc.n; while (m >= v) { acc.out.push(`${k} = ${v}`); m -= v; } acc.n = m; return acc; }, { n, out: [] }).out;
  if (toRoman) return Q(`How is ${N(n)} written in Roman numerals?`, choices(r, roman(n), romanWrong(n).filter(w => w !== roman(n))), 'Split the number into thousands, hundreds, tens and ones. Write each part, biggest first.', [`Split it up: ${parts.join(', ')}.`, `Put them together: ${roman(n)}.`]);
  return Q(`What number is ${roman(n)}?`, choices(r, n, [n + 10, n - 1 > 0 ? n - 1 : n + 2, n + 100 > 3000 ? n - 100 : n + 100, n + 5, n + 2]), 'A smaller letter before a bigger one is taken away (IV = 4, XC = 90). Otherwise add the letters up.', [`Read it in parts: ${parts.join(', ')}.`, `Add them: ${N(n)}.`]);
};
T.place_value = since(2, 0.25, T.place_value, romanQ);

// ------------------------------------------------------------ map scales (added to ratio)
const scaleQ = (r, d) => {
  if (d === 1) { const k = r.pick([2, 5, 10]), cm = r.int(2, 12);
    return Q(`On a map, 1 cm stands for ${k} km. Two villages are ${cm} cm apart on the map. How far apart are they really?`, choices(r, `${cm * k} km`, [`${cm + k} km`, `${cm} km`, `${cm * k * 10} km`, `${cm * k + k} km`]), 'Each centimetre on the map is the same real distance.', [`${cm} cm × ${k} km = ${cm * k} km.`]); }
  if (d === 2) { const k = r.pick([2, 4, 5, 20, 25]), km = k * r.int(3, 15) / 2; if (km % 1) return null;
    return Q(`A map has a scale of 1 cm to ${k} km. The real distance between two towns is ${km} km. How far apart are they on the map?`, choices(r, `${km / k} cm`, [`${km * k} cm`, `${km} cm`, `${km - k} cm`, `${km / k + 1} cm`]), 'Divide the real distance by the distance one centimetre stands for.', [`${km} ÷ ${k} = ${km / k} cm.`]); }
  const s = r.pick([10000, 20000, 25000, 50000, 100000]), cm = r.int(3, 18) / 2, km = cm * s / 100000;
  return Q(`A map has a scale of 1 : ${N(s)}. Two farms are ${cm} cm apart on the map. How far apart are they in real life?`, choices(r, `${km} km`, [`${km * 10} km`, `${km / 10} km`, `${cm * s / 100} km`, `${km + 1} km`]), '1 : n means 1 cm on the map is n cm in real life. There are 100,000 cm in a kilometre.', [`${cm} cm × ${N(s)} = ${N(cm * s)} cm in real life.`, `${N(cm * s)} cm ÷ 100 = ${N(cm * s / 100)} m.`, `${N(cm * s / 100)} m = ${km} km.`]);
};
T.ratio = since(2, 0.3, T.ratio, scaleQ);

// ------------------------------------------------------------ speed, timetables and calendars (added to time)
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = [['January', 31], ['February', 28], ['March', 31], ['April', 30], ['May', 31], ['June', 30], ['July', 31], ['August', 31], ['September', 30], ['October', 31], ['November', 30], ['December', 31]];
const STOPS = ['Bus station', 'Market Square', 'Library', 'Hospital', 'Park Road', 'Railway station', 'School Lane', 'Swimming pool'];
function timetable(r, nStops, nBuses) {
  const stops = r.sample(STOPS, nStops), gaps = stops.slice(1).map(() => r.int(4, 16)), first = r.int(7 * 12, 9 * 12) * 5, every = r.pick([15, 20, 25, 30, 40]);
  const buses = Array.from({ length: nBuses }, (_, b) => { const slow = b === 1 ? r.int(0, 4) : 0; let t = first + b * every; return stops.map((_, i) => (i ? (t += gaps[i - 1] + (i === 1 ? slow : 0)) : t)); });
  const html = `<table class="tt"><thead><tr><th>Stop</th>${buses.map((_, b) => `<th>Bus ${b + 1}</th>`).join('')}</tr></thead><tbody>${stops.map((s, i) => `<tr><th>${s}</th>${buses.map(bus => `<td>${hhmm(bus[i])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  return { stops, buses, html };
}
const speedQ = (r, d) => {
  if (d === 1) { const sp = r.pick([20, 30, 40, 50, 60]), h = r.int(2, 5);
    return Q(`A car travels at ${sp} miles per hour for ${h} hours. How far does it go?`, choices(r, `${sp * h} miles`, [`${sp + h} miles`, `${sp * (h + 1)} miles`, `${sp / h} miles`, `${sp * h * 10} miles`]), 'Distance = speed × time.', [`${sp} miles every hour for ${h} hours.`, `${sp} × ${h} = ${sp * h} miles.`]); }
  if (d === 2) { const sp = r.pick([4, 6, 8, 10, 12, 15, 20]), h = r.int(2, 6), dist = sp * h, ask = r.pick(['speed', 'time']);
    return ask === 'speed' ? Q(`A cyclist rides ${dist} km in ${h} hours at a steady speed. What is her speed?`, choices(r, `${sp} km/h`, [`${dist * h} km/h`, `${dist - h} km/h`, `${sp + 2} km/h`, `${dist} km/h`]), 'Speed = distance ÷ time.', [`${dist} km ÷ ${h} h = ${sp} km/h.`])
      : Q(`A boat travels ${dist} km at ${sp} km/h. How long does the journey take?`, choices(r, dur(h * 60), [dur(dist * sp > 600 ? 600 : dist * sp), dur((h + 1) * 60), dur(h * 60 - 30), dur(sp * 60 > 600 ? 120 : sp * 60)].filter(x => x !== dur(h * 60))), 'Time = distance ÷ speed.', [`${dist} ÷ ${sp} = ${h} hours.`]); }
  const sp = r.pick([40, 48, 60, 80, 90, 120]), mins = r.pick([15, 20, 30, 45, 75, 90, 105]), dist = sp * mins / 60; if (dist % 1) return null;
  return Q(`A train travels at ${sp} km/h. How far does it go in ${dur(mins)}?`, choices(r, `${dist} km`, [`${sp * mins} km`, `${sp * mins / 100} km`, `${sp + mins} km`, `${dist + sp / 4} km`]), 'Find how far it goes in one minute, or use a fraction of an hour.', [`${dur(mins)} is ${P(mins / gcd(mins, 60), 60 / gcd(mins, 60))} of an hour.`, `${P(mins / gcd(mins, 60), 60 / gcd(mins, 60))} of ${sp} km = ${dist} km.`]);
};
const ttQ = (r, d) => {
  const t = timetable(r, d === 1 ? 3 : 4, d === 3 ? 4 : 3), b = r.int(0, t.buses.length - 1), last = t.stops.length - 1;
  if (d === 1) { const i = r.int(1, last);
    return Q(`Look at the bus timetable. Bus ${b + 1} leaves the ${t.stops[0]}. What time does it reach the ${t.stops[i]}?`, choices(r, hhmm(t.buses[b][i]), t.buses.flat().filter(x => x !== t.buses[b][i]).map(hhmm)), 'Find the bus column first, then go down to the stop.', [`Go down the Bus ${b + 1} column to the ${t.stops[i]} row.`, `It says ${hhmm(t.buses[b][i])}.`], { svg: t.html }); }
  if (d === 2) { const len = t.buses[b][last] - t.buses[b][0];
    return Q(`Look at the timetable. How long does Bus ${b + 1} take to get from the ${t.stops[0]} to the ${t.stops[last]}?`, choices(r, dur(len), [dur(len + 10), dur(len - 5), dur(len + 40), dur(Math.abs(+hhmm(t.buses[b][last]).replace(':', '') - +hhmm(t.buses[b][0]).replace(':', '')))].filter(x => x !== dur(len))), 'Count on from the start time to the arrival time.', [`Bus ${b + 1} leaves at ${hhmm(t.buses[b][0])} and arrives at ${hhmm(t.buses[b][last])}.`, `That is ${len} minutes.`], { svg: t.html }); }
  const need = t.buses[1][last] + r.int(1, 12), ok = t.buses.filter(bus => bus[last] <= need), best = ok[ok.length - 1];
  return Q(`Look at the timetable. Ava must be at the ${t.stops[last]} by ${hhmm(need)}. What is the latest time she can catch a bus from the ${t.stops[0]}?`, choices(r, hhmm(best[0]), t.buses.filter(x => x !== best).map(x => hhmm(x[0])).concat([hhmm(need - 20), hhmm(best[last])])), 'Look along the last row for the latest bus that arrives in time, then go up to the first row.', [`Buses reaching the ${t.stops[last]} by ${hhmm(need)}: ${ok.map(x => hhmm(x[last])).join(', ')}.`, `The latest of these leaves the ${t.stops[0]} at ${hhmm(best[0])}.`], { svg: t.html });
};
const calQ = (r, d) => {
  const m = r.int(0, 11), [mon, len] = MONTHS[m], day = r.int(1, d === 3 ? len : 14), dw = r.int(0, 6);
  if (d < 3) { const add = d === 1 ? r.pick([7, 14, 3, 5]) : r.int(8, 20), ans = DAYS[(dw + add) % 7];
    return Q(`${day} ${mon} is a ${DAYS[dw]}. What day of the week is ${day + add} ${mon}?`, choices(r, ans, DAYS.filter(x => x !== ans)), 'Every 7 days is the same day of the week again.', [`${day + add} − ${day} = ${add} days later.`, `${add} = ${Math.floor(add / 7)} week${Math.floor(add / 7) === 1 ? '' : 's'} and ${add % 7} day${add % 7 === 1 ? '' : 's'}.`, `${DAYS[dw]} + ${add % 7} day${add % 7 === 1 ? '' : 's'} = ${ans}.`]); }
  const add = r.int(15, 60); let dd = day + add, mm = m; while (dd > MONTHS[mm][1]) { dd -= MONTHS[mm][1]; mm = (mm + 1) % 12; }
  const ans = `${dd} ${MONTHS[mm][0]}`, w1 = `${dd + 1} ${MONTHS[mm][0]}`, w2 = `${Math.max(1, dd - 1)} ${MONTHS[mm][0]}`, w3 = `${day + add <= 31 ? day + add : dd + 2} ${mon}`, w4 = `${dd} ${MONTHS[(mm + 1) % 12][0]}`;
  return Q(`A school trip is ${add} days after ${day} ${mon} (not a leap year). On what date is the trip?`, choices(r, ans, [w1, w2, w3, w4].filter(x => x !== ans)), `${mon} has ${len} days. Count to the end of the month first.`, [`From ${day} ${mon} to the end of ${mon} is ${len - day} days.`, `That leaves ${add - (len - day)} more days.`, `Counting on gives ${ans}.`]);
};
T.time = since(2, 0.45, T.time, (r, d) => r.pick([speedQ, ttQ, calQ])(r, d));

// ------------------------------------------------------------ Venn, Carroll, line graphs, bar charts and tally charts (added to data handling)
const svgWrap = (w, h, inner) => `<svg viewBox="0 0 ${w} ${h}" width="${w}" style="max-width:100%;height:auto" role="img" aria-label="diagram" font-family="system-ui, sans-serif">${inner}</svg>`;
const txt = (x, y, s, o) => `<text x="${x}" y="${y}" text-anchor="${(o && o.a) || 'middle'}" font-size="${(o && o.f) || 15}" fill="${(o && o.c) || ink}" ${o && o.b ? 'font-weight="700"' : ''}>${s}</text>`;
function vennSVG(la, lb, inA, both, inB, out) {
  return svgWrap(360, 220, `<rect x="2" y="2" width="356" height="216" rx="10" fill="none" stroke="${soft}"/>
    <circle cx="140" cy="118" r="80" fill="${fillA}" stroke="${ink}" stroke-width="2"/><circle cx="220" cy="118" r="80" fill="${fillB}" stroke="${ink}" stroke-width="2"/>
    ${txt(110, 26, la, { b: 1, f: 14 })}${txt(250, 26, lb, { b: 1, f: 14 })}
    ${txt(105, 124, inA, { f: 18 })}${txt(180, 124, both, { f: 18 })}${txt(255, 124, inB, { f: 18 })}${txt(330, 206, out, { f: 18 })}`);
}
const PROPS = [['even numbers', n => n % 2 === 0], ['multiples of 3', n => n % 3 === 0], ['multiples of 5', n => n % 5 === 0], ['more than 20', n => n > 20], ['square numbers', n => [1, 4, 9, 16, 25, 36, 49].includes(n)], ['multiples of 4', n => n % 4 === 0]];
const vennQ = (r, d) => {
  if (d === 1) { const [a, b] = r.sample([['like cats', 'like dogs'], ['play football', 'swim'], ['have a sister', 'have a brother'], ['like apples', 'like bananas']], 1)[0].map(x => x), A = r.int(3, 12), Bt = r.int(2, 9), B = r.int(3, 12), O = r.int(1, 8), ask = r.pick(['both', 'allA', 'total']);
    const ans = ask === 'both' ? Bt : ask === 'allA' ? A + Bt : A + Bt + B + O;
    const q = ask === 'both' ? `How many children ${a} and ${b.replace(/^like /, '')}?` : ask === 'allA' ? `How many children ${a} altogether?` : 'How many children are in the class altogether?';
    return Q(`The Venn diagram shows a class survey. ${q}`, choices(r, ans, [A, Bt, B, A + B, A + Bt + B, O, ans + 1].filter(x => x !== ans)), 'The overlap is for children in both groups. Numbers outside both circles belong to neither group.', ask === 'both' ? [`The overlap in the middle shows ${Bt}.`] : ask === 'allA' ? [`Everything inside the "${a}" circle counts: ${A} + ${Bt} = ${ans}.`] : [`Add every region, including the number outside: ${A} + ${Bt} + ${B} + ${O} = ${ans}.`], { svg: vennSVG(a, b, A, Bt, B, O) }); }
  const [[la, fa], [lb, fb]] = r.sample(PROPS, 2), nums = r.sample(Array.from({ length: 49 }, (_, i) => i + 1), 40);
  const reg = n => fa(n) && fb(n) ? 'both' : fa(n) ? 'A' : fb(n) ? 'B' : 'out';
  const by = { A: [], both: [], B: [], out: [] }; nums.forEach(n => { if (by[reg(n)].length < 2) by[reg(n)].push(n); });
  if (Object.values(by).some(v => !v.length)) return null;
  const NAME = { A: `in the "${la}" circle only`, B: `in the "${lb}" circle only`, both: 'in the overlap', out: 'outside both circles' };
  if (d === 2) { const target = nums.find(n => !Object.values(by).flat().includes(n)); if (!target) return null; const ans = NAME[reg(target)];
    return Q(`Where should the number ${target} go in this Venn diagram?`, choices(r, ans, Object.values(NAME).filter(x => x !== ans).concat(['it cannot go anywhere'])), 'Ask two questions: is it in the first group? Is it in the second group?', [`Is ${target} ${la}? ${fa(target) ? 'Yes' : 'No'}. Is it ${lb}? ${fb(target) ? 'Yes' : 'No'}.`, `So it goes ${ans}.`], { svg: vennSVG(la, lb, by.A.join(', '), by.both.join(', '), by.B.join(', '), by.out.join(', ')) }); }
  const keys = ['A', 'both', 'B', 'out'], from = r.pick(keys), to = r.pick(keys.filter(k => k !== from)), wrong = nums.find(n => reg(n) === to && !Object.values(by).flat().includes(n)); if (!wrong) return null;
  const shown = JSON.parse(JSON.stringify(by)); shown[from] = shown[from].concat([wrong]);
  const all = Object.values(shown).flat();
  return Q('One number has been put in the wrong place in this Venn diagram. Which one?', choices(r, wrong, all.filter(x => x !== wrong)), 'Check every number against both labels.', [`${wrong}: is it ${la}? ${fa(wrong) ? 'Yes' : 'No'}. Is it ${lb}? ${fb(wrong) ? 'Yes' : 'No'}.`, `So ${wrong} belongs ${NAME[to]}, not where it is.`], { svg: vennSVG(la, lb, shown.A.join(', '), shown.both.join(', '), shown.B.join(', '), shown.out.join(', ')) });
};
const carrollQ = (r, d) => {
  const [[la, fa], [lb, fb]] = r.sample(PROPS, 2), n = r.int(2, 49);
  const html = `<table class="tt carroll"><tr><th></th><th>${la}</th><th>not ${la}</th></tr><tr><th>${lb}</th><td>A</td><td>B</td></tr><tr><th>not ${lb}</th><td>C</td><td>D</td></tr></table>`;
  const box = fb(n) ? (fa(n) ? 'A' : 'B') : (fa(n) ? 'C' : 'D');
  if (d < 3) return Q(`In which box of this Carroll diagram does the number ${n} belong?`, choices(r, 'box ' + box, ['A', 'B', 'C', 'D'].filter(x => x !== box).map(x => 'box ' + x).concat(['none of the boxes'])), 'Use the column heading for one question and the row heading for the other.', [`Is ${n} ${la}? ${fa(n) ? 'Yes, so the left column' : 'No, so the right column'}.`, `Is ${n} ${lb}? ${fb(n) ? 'Yes, so the top row' : 'No, so the bottom row'}.`, `That is box ${box}.`], { svg: html });
  const set = r.sample(Array.from({ length: 40 }, (_, i) => i + 2), 8), want = r.pick(['A', 'B', 'C', 'D']), cnt = set.filter(x => (fb(x) ? (fa(x) ? 'A' : 'B') : (fa(x) ? 'C' : 'D')) === want).length;
  return Q(`These numbers are sorted into the Carroll diagram: ${set.join(', ')}. How many go in box ${want}?`, choices(r, cnt, [cnt + 1, cnt + 2, cnt - 1, 8 - cnt, 0, 4].filter(x => x !== cnt)), 'Sort each number in turn, using the column and the row.', [`Box ${want} is "${want === 'A' || want === 'C' ? la : 'not ' + la}" and "${want === 'A' || want === 'B' ? lb : 'not ' + lb}".`, `The numbers that fit: ${set.filter(x => (fb(x) ? (fa(x) ? 'A' : 'B') : (fa(x) ? 'C' : 'D')) === want).join(', ') || 'none'}.`, `That is ${cnt}.`], { svg: html });
};
function lineSVG(xs, ys, yMax, step, unit) {
  const W = 380, H = 230, L = 46, B = 40, w = W - L - 14, h = H - B - 14, X = i => L + w * i / (xs.length - 1), Y = v => H - B - h * v / yMax;
  let g = ''; for (let v = 0; v <= yMax; v += step) g += `<line x1="${L}" y1="${Y(v)}" x2="${W - 14}" y2="${Y(v)}" stroke="#dfe5ee"/>${txt(L - 6, Y(v) + 5, v, { a: 'end', f: 12, c: soft })}`;
  xs.forEach((x, i) => { g += txt(X(i), H - B + 18, x, { f: 12, c: soft }); });
  const pts = ys.map((v, i) => `${X(i)},${Y(v)}`).join(' ');
  return svgWrap(W, H, `${g}<line x1="${L}" y1="${H - B}" x2="${W - 14}" y2="${H - B}" stroke="${ink}"/><line x1="${L}" y1="14" x2="${L}" y2="${H - B}" stroke="${ink}"/>
    <polyline points="${pts}" fill="none" stroke="#3b5bdb" stroke-width="3"/>${ys.map((v, i) => `<circle cx="${X(i)}" cy="${Y(v)}" r="4.5" fill="#3b5bdb"/>`).join('')}${txt(14, 12, unit, { a: 'start', f: 12, c: soft })}`);
}
const lineQ = (r, d) => {
  const xs = ['8am', '9am', '10am', '11am', '12pm', '1pm', '2pm'], ys = []; let v = r.int(4, 12) * 2;
  xs.forEach(() => { ys.push(v); v = Math.max(0, Math.min(36, v + r.pick([-4, -2, 2, 2, 4, 6]))); });
  const svg = lineSVG(xs, ys, 40, 4, 'Temperature (°C)');
  if (d === 1) { const i = r.int(0, 6); return Q(`The line graph shows the temperature in a garden. What was the temperature at ${xs[i]}?`, choices(r, ys[i] + '°C', ys.filter(x => x !== ys[i]).map(x => x + '°C').concat([(ys[i] + 2) + '°C', (ys[i] - 2) + '°C'])), 'Go up from the time to the line, then across to the scale.', [`At ${xs[i]} the point is level with ${ys[i]} on the scale.`], { svg }); }
  if (d === 2) { const mx = Math.max(...ys), mn = Math.min(...ys); return Q('The line graph shows the temperature in a garden. What is the difference between the highest and lowest temperatures?', choices(r, (mx - mn) + '°C', [mx + '°C', mn + '°C', (mx + mn) + '°C', (mx - mn + 2) + '°C', (mx - mn - 2) + '°C'].filter(x => x !== (mx - mn) + '°C')), 'Find the highest point and the lowest point, then subtract.', [`Highest: ${mx}°C. Lowest: ${mn}°C.`, `${mx} − ${mn} = ${mx - mn}°C.`], { svg }); }
  const rises = ys.slice(1).map((v, i) => v - ys[i]), big = Math.max(...rises); if (big <= 0 || rises.filter(x => x === big).length > 1) return null; const i = rises.indexOf(big), lab = `${xs[i]} and ${xs[i + 1]}`;
  return Q('Between which two times did the temperature rise the most?', choices(r, lab, xs.slice(0, -1).map((x, k) => `${x} and ${xs[k + 1]}`).filter(x => x !== lab)), 'The steepest uphill part of the line is the biggest rise.', [`Rises: ${rises.map((x, k) => `${xs[k]}–${xs[k + 1]}: ${x > 0 ? '+' : ''}${x}`).join(', ')}.`, `The biggest rise is ${big}°C, between ${lab}.`], { svg });
};
function barSVG(labels, vals, yMax, step, unit) {
  const W = 380, H = 230, L = 46, B = 40, w = W - L - 14, h = H - B - 14, bw = w / labels.length, Y = v => H - B - h * v / yMax;
  let g = ''; for (let v = 0; v <= yMax; v += step) g += `<line x1="${L}" y1="${Y(v)}" x2="${W - 14}" y2="${Y(v)}" stroke="#dfe5ee"/>${txt(L - 6, Y(v) + 5, v, { a: 'end', f: 12, c: soft })}`;
  labels.forEach((x, i) => { g += `<rect x="${L + bw * i + bw * .18}" y="${Y(vals[i])}" width="${bw * .64}" height="${H - B - Y(vals[i])}" fill="#f08c00" rx="3"/>` + txt(L + bw * (i + .5), H - B + 18, x, { f: 12, c: soft }); });
  return svgWrap(W, H, `${g}<line x1="${L}" y1="${H - B}" x2="${W - 14}" y2="${H - B}" stroke="${ink}"/><line x1="${L}" y1="14" x2="${L}" y2="${H - B}" stroke="${ink}"/>${txt(14, 12, unit, { a: 'start', f: 12, c: soft })}`);
}
const barQ = (r, d) => {
  const labs = r.pick([['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], ['Red', 'Blue', 'Green', 'Yellow', 'Pink'], ['Year 3', 'Year 4', 'Year 5', 'Year 6']]), step = d === 1 ? 2 : 5, vals = labs.map(() => r.int(1, 8) * step), svg = barSVG(labs, vals, step * 10, step * 2, d === 1 ? 'Number of children' : 'Number of books read');
  if (d === 1) { const i = r.int(0, labs.length - 1); return Q(`The bar chart shows children's votes. How many children voted for ${labs[i]}?`, choices(r, vals[i], vals.filter(x => x !== vals[i]).concat([vals[i] + 1, vals[i] - 1])), 'Go to the top of the bar, then across to the scale. Check what each gridline is worth.', [`The ${labs[i]} bar reaches ${vals[i]}.`], { svg }); }
  const [i, j] = r.sample(labs.map((_, k) => k), 2); if (vals[i] === vals[j]) return null;
  if (d === 2) { const hi = vals[i] > vals[j] ? i : j, lo = hi === i ? j : i, diff = vals[hi] - vals[lo];
    return Q(`The bar chart shows books read. How many more books did ${labs[hi]} read than ${labs[lo]}?`, choices(r, diff, [vals[hi], vals[lo], vals[hi] + vals[lo], diff + step]), 'Read both bars, then subtract the smaller from the bigger.', [`${labs[hi]}: ${vals[hi]}. ${labs[lo]}: ${vals[lo]}.`, `${vals[hi]} − ${vals[lo]} = ${diff}.`], { svg }); }
  const tot = vals.reduce((a, b) => a + b, 0), mean = tot / vals.length; if (mean % 1) return null;
  return Q('The bar chart shows books read. What is the mean number of books per group?', choices(r, mean, [tot, Math.max(...vals), mean + step, vals.slice().sort((a, b) => a - b)[Math.floor(vals.length / 2)]].filter(x => x !== mean)), 'Mean = total ÷ number of bars.', [`Total: ${vals.join(' + ')} = ${tot}.`, `${tot} ÷ ${vals.length} = ${mean}.`], { svg });
};
const tally = n => '<span class="tally">' + Array.from({ length: Math.floor(n / 5) }, () => '<s>||||</s>').join(' ') + (n % 5 ? ' ' + '|'.repeat(n % 5) : '') + '</span>';
const tallyQ = (r, d) => {
  const items = r.sample(['Apple', 'Banana', 'Orange', 'Grapes', 'Pear', 'Mango'], 4), vals = items.map(() => r.int(3, 17));
  const html = `<table class="tt"><tr><th>Fruit</th><th>Tally</th></tr>${items.map((x, i) => `<tr><th>${x}</th><td>${tally(vals[i])}</td></tr>`).join('')}</table>`;
  if (d === 1) { const i = r.int(0, 3); return Q(`The tally chart shows children's favourite fruit. How many chose ${items[i]}?`, choices(r, vals[i], vals.filter(x => x !== vals[i]).concat([vals[i] + 1, vals[i] - 1, vals[i] + 5])), 'Each crossed group of lines is 5. Count the groups in fives, then add the single lines.', [`${Math.floor(vals[i] / 5)} group${Math.floor(vals[i] / 5) === 1 ? '' : 's'} of 5 = ${Math.floor(vals[i] / 5) * 5}, plus ${vals[i] % 5} more.`, `${items[i]}: ${vals[i]}.`], { svg: html }); }
  const tot = vals.reduce((a, b) => a + b, 0);
  return Q('The tally chart shows children\'s favourite fruit. How many children were asked altogether?', choices(r, tot, [tot - vals[0], tot + 5, tot - 5, vals.length * 5]), 'Turn each tally into a number, then add them all.', [`${items.map((x, i) => `${x}: ${vals[i]}`).join(', ')}.`, `${vals.join(' + ')} = ${tot}.`], { svg: html });
};
T.data = since(2, 0.5, T.data, (r, d) => r.pick([vennQ, carrollQ, lineQ, barQ, tallyQ])(r, d));

// ------------------------------------------------------------ more angle questions
const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
const angleQ = (r, d) => {
  const kind = r.pick(d === 1 ? ['type', 'compass'] : d === 2 ? ['compass', 'opposite', 'clock'] : ['clock', 'exterior', 'compass']);
  if (kind === 'type') { const a = r.pick([r.int(10, 85), r.int(95, 175), r.int(185, 350), 90]), t = a === 90 ? 'right angle' : a < 90 ? 'acute' : a < 180 ? 'obtuse' : 'reflex';
    return Q(`What type of angle is ${a}°?`, choices(r, t, ['acute', 'obtuse', 'reflex', 'right angle', 'straight line'].filter(x => x !== t)), 'Acute is less than 90°, obtuse is between 90° and 180°, reflex is more than 180°.', [`${a}° is ${t === 'right angle' ? 'exactly 90°' : t === 'acute' ? 'less than 90°' : t === 'obtuse' ? 'between 90° and 180°' : 'more than 180°'}.`, `So it is ${t === 'right angle' ? 'a right angle' : t === 'acute' || t === 'obtuse' ? (t === 'acute' ? 'an acute' : 'an obtuse') + ' angle' : 'a reflex angle'}.`]); }
  if (kind === 'compass') { const s = r.int(0, 7), steps = d === 1 ? r.pick([2, 4, 6]) : r.int(1, 7), cw = r() < .5, end = COMPASS[((s + (cw ? steps : -steps)) % 8 + 8) % 8];
    return Q(`Sam is facing ${COMPASS[s]}. He turns ${steps * 45}° ${cw ? 'clockwise' : 'anticlockwise'}. Which direction is he facing now?`, choices(r, end, COMPASS.filter(x => x !== end)), 'Each step round the compass (N, NE, E...) is 45°. A right angle is two steps.', [`${steps * 45}° ÷ 45° = ${steps} step${steps > 1 ? 's' : ''}.`, `Count ${steps} step${steps > 1 ? 's' : ''} ${cw ? 'clockwise' : 'anticlockwise'} from ${COMPASS[s]}: ${end}.`]); }
  if (kind === 'opposite') { const a = r.int(25, 155);
    return Q(`Two straight lines cross. One of the angles is ${a}°. What is the angle directly opposite it?`, choices(r, a + '°', [(180 - a) + '°', (360 - a) + '°', (90 - a > 0 ? 90 - a : a + 20) + '°', (a + 10) + '°']), 'Vertically opposite angles are equal.', ['When two straight lines cross, opposite angles are the same size.', `So the opposite angle is ${a}°.`]); }
  if (kind === 'clock') { const h = r.int(1, 11), half = d === 3 && r() < .6, mins = half ? 30 : 0; let ang = Math.abs(30 * h + (half ? 15 : 0) - 6 * mins); if (ang > 180) ang = 360 - ang;
    return Q(`What is the smaller angle between the hour hand and the minute hand at ${h}:${mins ? '30' : '00'}?`, choices(r, ang + '°', [(half ? Math.abs(30 * h - 180) : ang + 30) + '°', (360 - ang) + '°', (ang + 15) + '°', (h * 10) + '°'].filter(x => x !== ang + '°')), 'The 12 numbers split 360° into 12 equal parts of 30°. At half past, the hour hand is halfway between two numbers.', half ? [`At ${h}:30 the minute hand points at 6 and the hour hand is halfway between ${h} and ${h + 1}.`, `Each number is 30°, so the gap is ${ang}°.`] : [`At ${h}:00 the hands are ${Math.min(h, 12 - h)} number${Math.min(h, 12 - h) > 1 ? 's' : ''} apart.`, `${Math.min(h, 12 - h)} × 30° = ${ang}°.`]); }
  const n = r.pick([5, 6, 8, 9, 10, 12]), ext = 360 / n, name = { 5: 'pentagon', 6: 'hexagon', 8: 'octagon', 9: 'nonagon', 10: 'decagon', 12: 'dodecagon' }[n];
  return Q(`What is the size of each exterior (outside) angle of a regular ${name}?`, choices(r, ext + '°', [(180 - ext) + '°', (180 / n) + '°', (ext + 10) + '°', (360 / (n - 2)) + '°'].filter(x => x !== ext + '°')), 'Walking all the way round any shape turns you through 360° in total.', [`A ${name} has ${n} equal exterior angles that add up to 360°.`, `360° ÷ ${n} = ${ext}°.`]);
};
T.angles = since(2, 0.5, T.angles, angleQ);

// ------------------------------------------------------------ more coordinate questions
const pt = (x, y) => `(${x}, ${y})`;
const coordQ = (r, d) => {
  const kind = r.pick(d === 1 ? ['distance', 'axis'] : d === 2 ? ['quadrant', 'perimeter', 'distance'] : ['square', 'reflectline', 'perimeter']);
  if (kind === 'distance') { const y = r.int(1, 9), x1 = r.int(0, 5), x2 = x1 + r.int(2, 9), flip = r() < .5, A = flip ? pt(y, x1) : pt(x1, y), B = flip ? pt(y, x2) : pt(x2, y);
    return Q(`How many units apart are the points ${A} and ${B}?`, choices(r, x2 - x1, [x2 + x1, x2, x2 - x1 + 1, y]), 'The points are on the same line, so just find the difference between the numbers that change.', [`Only one coordinate changes: from ${x1} to ${x2}.`, `${x2} − ${x1} = ${x2 - x1} units.`]); }
  if (kind === 'axis') { const x = r.int(1, 9), y = r.int(1, 9), ask = r.pick(['x', 'y']);
    return Q(`What is the ${ask}-coordinate of the point ${pt(x, y)}?`, choices(r, ask === 'x' ? x : y, [ask === 'x' ? y : x, x + y, Math.abs(x - y) || 10, 0]), 'Coordinates are written (x, y): along the corridor, then up the stairs.', [`In ${pt(x, y)}, x = ${x} and y = ${y}.`]); }
  if (kind === 'quadrant') { const x = r.int(1, 8) * r.pick([1, -1]), y = r.int(1, 8) * r.pick([1, -1]), q = x > 0 ? (y > 0 ? 'first' : 'fourth') : (y > 0 ? 'second' : 'third');
    return Q(`The axes split a grid into four quadrants, numbered anticlockwise from the top right. Which quadrant is the point ${pt(x, y)} in?`, choices(r, q, ['first', 'second', 'third', 'fourth', 'on an axis'].filter(w => w !== q)), 'Top right is the first quadrant, top left the second, bottom left the third and bottom right the fourth.', [`x is ${x > 0 ? 'positive (right)' : 'negative (left)'} and y is ${y > 0 ? 'positive (up)' : 'negative (down)'}.`, `That is the ${q} quadrant.`]); }
  if (kind === 'perimeter') { const x1 = r.int(-4, 3), y1 = r.int(-4, 3), w = r.int(2, 8), h = r.int(2, 8);
    return Q(`A rectangle has corners at ${pt(x1, y1)}, ${pt(x1 + w, y1)}, ${pt(x1 + w, y1 + h)} and ${pt(x1, y1 + h)}. What is its perimeter?`, choices(r, `${2 * (w + h)} units`, [`${w * h} units`, `${w + h} units`, `${2 * (w + h) + 2} units`, `${4 * w} units`].filter(x => x !== `${2 * (w + h)} units`)), 'Find the width from the x values and the height from the y values.', [`Width: ${x1 + w} − ${x1} = ${w}. Height: ${y1 + h} − ${y1} = ${h}.`, `Perimeter: 2 × (${w} + ${h}) = ${2 * (w + h)} units.`]); }
  if (kind === 'square') { const x = r.int(0, 4), y = r.int(0, 4), a = r.int(1, 3), b = r.int(1, 3), P1 = [x, y], P2 = [x + a, y + b], P3 = [x + a - b, y + b + a], P4 = [x - b, y + a];
    if (P3[0] < -5 || P4[0] < -5) return null;
    return Q(`Three corners of a square are ${pt(...P1)}, ${pt(...P2)} and ${pt(...P3)}. Where is the fourth corner?`, choices(r, pt(...P4), [pt(P4[0] + 1, P4[1]), pt(P3[0] - a, P3[1] - b + 1), pt(x + b, y - a), pt(P2[0] + b, P2[1] - a)].filter(w => w !== pt(...P4))), 'Each side of the square makes the same move. Copy the move from one corner to the next.', [`From ${pt(...P2)} to ${pt(...P3)} the move is ${-b >= 0 ? '+' : ''}${-b} across and +${a} up.`, `Make the same move from ${pt(...P1)}: ${pt(...P4)}.`]); }
  const k = r.int(1, 6), x = k + r.int(1, 5) * r.pick([1, -1]), y = r.int(-4, 6), nx = 2 * k - x;
  return Q(`The point ${pt(x, y)} is reflected in the line x = ${k}. Where is its image?`, choices(r, pt(nx, y), [pt(-x, y), pt(x, 2 * k - y), pt(nx + 1, y), pt(k, y)].filter(w => w !== pt(nx, y))), 'The image is the same distance from the mirror line, on the other side. The y-coordinate does not change.', [`${pt(x, y)} is ${Math.abs(x - k)} units ${x > k ? 'right' : 'left'} of x = ${k}.`, `Go ${Math.abs(x - k)} units the other side: x = ${nx}.`, `The image is ${pt(nx, y)}.`]);
};
T.coordinates = since(2, 0.5, T.coordinates, coordQ);
})();
