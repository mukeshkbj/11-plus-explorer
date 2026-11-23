/* Maths question generators: fresh questions for every maths topic at three levels.
   Wrong answers come from real mistakes (wrong column, forgetting to carry, adding denominators, and so on),
   and every question has a worked method. Uses the shared tools in gen-core.js. */
(function () {
'use strict';
const { choices, Q, N, gcd } = window.GENCORE;
const P = (n, d) => `${n}/${d}`;                       // fraction text, shown stacked by the app
const pounds = p => '£' + (p / 100).toFixed(2);          // pence to £x.xx
const dp = (x, k) => { const s = x.toFixed(k); return s.replace(/\.?0+$/, ''); };   // decimals without trailing zeros
const pad2 = n => String(n).padStart(2, '0');
const hhmm = m => { m = ((m % 1440) + 1440) % 1440; return pad2(Math.floor(m / 60)) + ':' + pad2(m % 60); };
const ampm = m => { m = ((m % 1440) + 1440) % 1440; const h = Math.floor(m / 60), mm = m % 60; return `${h % 12 === 0 ? 12 : h % 12}:${pad2(mm)} ${h < 12 ? 'am' : 'pm'}`; };
const dur = m => m >= 60 ? `${Math.floor(m / 60)} h ${m % 60 ? (m % 60) + ' min' : ''}`.trim() : `${m} min`;
const an = w => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
const NAMES = ['Amir', 'Bella', 'Chen', 'Daisy', 'Ethan', 'Freya', 'Grace', 'Harry', 'Isla', 'Jack', 'Kiran', 'Leo', 'Maya', 'Noah', 'Olivia', 'Priya', 'Ravi', 'Sophie', 'Tom', 'Zara'];

const T = {};
const pickLevel = (r, d, byLevel) => r.pick(byLevel[d - 1])(r);

// ------------------------------------------------------------ place value
T.place_value = (r, d) => pickLevel(r, d, [
  [r => { const n = r.int(1000, 99999), s = String(n), i = r.int(0, s.length - 2), dig = +s[i]; if (!dig) return null; const place = 10 ** (s.length - 1 - i), names = { 1: 'ones', 10: 'tens', 100: 'hundreds', 1000: 'thousands', 10000: 'ten thousands' };
      return Q(`What is the value of the digit ${dig} in ${N(n)}?`, choices(r, dig * place, [dig * place / 10, dig * place * 10, dig, dig * place / 100].filter(x => x >= 1), N), 'Which column is the digit in: ones, tens, hundreds, thousands...?', [`Find the digit ${dig} in ${N(n)}.`, `It is in the ${names[place]} column.`, `So it is worth ${dig} × ${N(place)} = ${N(dig * place)}.`]); },
   r => { const to = r.pick([10, 100]), n = r.int(101, 9999); if (n % to === 0) return null; const ans = Math.round(n / to) * to, down = Math.floor(n / to) * to, up = down + to, next = Math.floor((n % to) / (to / 10));
      return Q(`Round ${N(n)} to the nearest ${to}.`, choices(r, ans, [ans === up ? down : up, n, Math.round(n / (to * 10)) * to * 10, ans + to], N), `Which two multiples of ${to} is it between? Which one is closer?`, [`${N(n)} is between ${N(down)} and ${N(up)}.`, `Look at the next digit to the right: it is ${next}. ${next >= 5 ? '5 or more means round up.' : '4 or less means round down.'}`]); },
   r => { const n = r.int(2000, 98000), k = r.pick([10, 100, 1000]), more = r() < .5, ans = more ? n + k : n - k;
      return Q(`What is ${N(k)} ${more ? 'more' : 'less'} than ${N(n)}?`, choices(r, ans, [more ? n - k : n + k, more ? n + k * 10 : n - k * 10, more ? n + k / 10 : n - k / 10], N), `Only the ${k === 10 ? 'tens' : k === 100 ? 'hundreds' : 'thousands'} digit needs to change (watch out if it goes past 9 or below 0).`, [`${more ? 'Add' : 'Take away'} ${N(k)}.`, `${N(n)} ${more ? '+' : '−'} ${N(k)} = ${N(ans)}.`]); }],
  [r => { const to = r.pick([1000, 10000]), n = r.int(10001, 999999); if (n % to === 0) return null; const ans = Math.round(n / to) * to, down = Math.floor(n / to) * to;
      return Q(`Round ${N(n)} to the nearest ${N(to)}.`, choices(r, ans, [ans === down ? down + to : down, Math.round(n / (to / 10)) * to / 10, Math.round(n / (to * 10)) * to * 10, ans + to], N), `Find the ${N(to)}s on either side, then look at the digit to the right of the ${to === 1000 ? 'thousands' : 'ten thousands'} column.`, [`${N(n)} is between ${N(down)} and ${N(down + to)}.`, `Look at the digit to the right: ${Math.floor((n % to) / (to / 10))}. ${Math.floor((n % to) / (to / 10)) >= 5 ? 'Round up.' : 'Round down.'}`]); },
   r => { const a = r.int(-12, -1), rise = r.int(4, 15), b = a + rise;
      return Q(`At night the temperature was ${a}°C. By noon it had risen by ${rise}°C. What was the temperature at noon?`, choices(r, b + '°C', [(a - rise) + '°C', (-a + rise) + '°C', (rise + a + (b > 0 ? -2 * b : 2)) + '°C', (-(b)) + '°C'].filter(x => x !== b + '°C')), 'Start at the first temperature on a number line and count up.', [`Start at ${a}°C and count up ${rise}.`, `${-a} steps takes you to 0°C, then ${rise + a >= 0 ? rise + a : 0} more.`, `${a} + ${rise} = ${b}.`]); },
   r => { const base = r.int(1, 8) * 100000 + r.int(0, 99) * 1000, nums = r.shuffle([base + r.int(100, 999), base + r.int(1000, 9000) + 7, base + r.int(10000, 90000), base - r.int(1000, 9000), base + 3]), big = r() < .5, ans = big ? Math.max(...nums) : Math.min(...nums);
      return Q(`Which of these numbers is the ${big ? 'largest' : 'smallest'}?`, choices(r, ans, nums.filter(x => x !== ans), N), 'Compare digits from the left: the biggest column first.', ['All the numbers have the same number of digits, so compare the left-hand digits first.', 'If they match, move to the next digit along.', `The ${big ? 'largest' : 'smallest'} is ${N(ans)}.`]); }],
  [r => { const n = r.int(1001, 99999) / 1000, k = r.pick([1, 2]); const ans = Math.round(n * 10 ** k) / 10 ** k;
      return Q(`Round ${n.toFixed(3)} to ${k} decimal place${k > 1 ? 's' : ''}.`, choices(r, ans.toFixed(k), [Math.floor(n * 10 ** k) / 10 ** k === ans ? (Math.floor(n * 10 ** k) + 1) / 10 ** k : Math.floor(n * 10 ** k) / 10 ** k, Math.round(n * 10 ** (k + 1)) / 10 ** (k + 1), Math.round(n), Math.round(n * 10 ** (k - 1)) / 10 ** (k - 1)].map(x => typeof x === 'number' ? x.toFixed(k) : x)), `Look at the digit in decimal place ${k + 1}. Is it 5 or more?`, [`Keep ${k} digit${k > 1 ? 's' : ''} after the point.`, `The next digit is ${String(n.toFixed(3))[String(n.toFixed(3)).indexOf('.') + k + 1]}, so ${+String(n.toFixed(3))[String(n.toFixed(3)).indexOf('.') + k + 1] >= 5 ? 'round up' : 'leave the last digit as it is'}.`]); },
   r => { const th = r.int(11, 99), h = r.int(1, 9), u = r.int(1, 99), n = th * 1000 + h * 100 + u, words = `${tens(th)} thousand, ${ones(h)} hundred and ${tens(u)}`;
      return Q(`Write in figures: ${words}.`, choices(r, n, [th * 1000 + h * 10 + u, th * 100 + h * 100 + u, th * 1000 + h * 100 + u * 10, th * 10000 + h * 100 + u], N), 'Write each part in its column. Use zeros to hold empty columns.', [`${tens(th)} thousand = ${N(th * 1000)}.`, `${ones(h)} hundred = ${h * 100}.`, `Add ${u}: ${N(n)}.`]); },
   r => { const n = r.int(1, 9) + r.int(1, 999) / 1000, s = n.toFixed(3), pos = r.int(1, 3), dig = +s[1 + pos]; if (!dig) return null; const val = dig / 10 ** pos, names = ['', 'tenths', 'hundredths', 'thousandths'];
      return Q(`What is the value of the digit ${dig} in ${s}?`, choices(r, dp(val, 3), [dig, dp(dig / 10 ** (pos + 1), 4), dp(dig / 10 ** Math.max(1, pos - 1), 3), dig * 10].map(String)), 'After the decimal point come tenths, hundredths and thousandths.', [`The ${dig} is ${pos} place${pos > 1 ? 's' : ''} after the decimal point, in the ${names[pos]} column.`, `So it is worth ${dig} ${names[pos]} = ${dp(val, 3)}.`]); }]
]);
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const ones = n => ONES[n];
const tens = n => n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');

// ------------------------------------------------------------ four operations
T.four_ops = (r, d) => pickLevel(r, d, [
  [r => { const a = r.int(120, 899), b = r.int(120, 899), add = r() < .5, x = Math.max(a, b), y = Math.min(a, b), ans = add ? a + b : x - y;
      const noCarry = add ? +String(a).split('').map((c, i) => (+c + +String(b)[i]) % 10).join('') : +String(x).split('').map((c, i) => Math.abs(+c - +String(y)[i])).join('');
      return Q(add ? `${a} + ${b} = ?` : `${x} − ${y} = ?`, choices(r, ans, [noCarry, ans + 10, ans - 100, ans + 100]), 'Line the numbers up in columns and start with the ones.', add ? ['Add the ones, then the tens, then the hundreds.', 'Carry 1 to the next column whenever a column makes 10 or more.', `${a} + ${b} = ${ans}.`] : ['Subtract the ones, then the tens, then the hundreds.', 'If the top digit is smaller, exchange 1 from the next column.', `${x} − ${y} = ${ans}.`]); },
   r => { const a = r.int(12, 99), b = r.int(3, 9), ans = a * b;
      return Q(`${a} × ${b} = ?`, choices(r, ans, [(a % 10) * b + Math.floor(a / 10) * b, ans + b, ans - b, Math.floor(a / 10) * 10 * b + (a % 10)]), `Split ${a} into tens and ones, multiply each part by ${b}, then add.`, [`${a} = ${Math.floor(a / 10) * 10} + ${a % 10}.`, `${Math.floor(a / 10) * 10} × ${b} = ${Math.floor(a / 10) * 10 * b} and ${a % 10} × ${b} = ${(a % 10) * b}.`, `${Math.floor(a / 10) * 10 * b} + ${(a % 10) * b} = ${ans}.`]); },
   r => { const b = r.int(3, 9), ans = r.int(12, 60), a = ans * b;
      return Q(`${a} ÷ ${b} = ?`, choices(r, ans, [ans + 1, ans - 1, ans + 10, a - b]), `How many ${b}s fit into ${a}? Use your ${b} times table.`, [`Think: ? × ${b} = ${a}.`, `${ans} × ${b} = ${a}, so ${a} ÷ ${b} = ${ans}.`]); }],
  [r => { const a = r.int(12, 49), b = r.int(12, 39), ans = a * b;
      return Q(`${a} × ${b} = ?`, choices(r, ans, [a * (b % 10) + a * Math.floor(b / 10), ans + a, ans - a, ans + 100]), 'Use long multiplication or split one number into tens and ones.', [`${a} × ${Math.floor(b / 10) * 10} = ${a * Math.floor(b / 10) * 10}.`, `${a} × ${b % 10} = ${a * (b % 10)}.`, `${a * Math.floor(b / 10) * 10} + ${a * (b % 10)} = ${ans}.`]); },
   r => { const a = r.int(2, 20), b = r.int(2, 9), c = r.int(2, 9), ans = a + b * c;
      return Q(`${a} + ${b} × ${c} = ?`, choices(r, ans, [(a + b) * c, a + b + c, a * b + c, ans + 1]), 'Multiply before you add.', ['Multiplication comes before addition.', `${b} × ${c} = ${b * c}.`, `${a} + ${b * c} = ${ans}.`]); },
   r => { const b = r.int(4, 12), m = r.int(6, 25), ans = b * m;
      return Q(`? ÷ ${b} = ${m}`, choices(r, ans, [m + b, m - b > 0 ? m - b : ans + 2, ans + b, ans - b]), 'Use the inverse: multiplying undoes dividing.', [`If ? ÷ ${b} = ${m}, then ? = ${m} × ${b}.`, `${m} × ${b} = ${ans}.`]); }],
  [r => { const a = r.int(3, 15), b = r.int(2, 9), c = r.int(2, 9), e = r.int(1, 20), ans = (a + b) * c - e;
      return Q(`(${a} + ${b}) × ${c} − ${e} = ?`, choices(r, ans, [a + b * c - e, (a + b) * (c - e) > 0 ? (a + b) * (c - e) : ans + 10, (a + b) * c + e, ans - c]), 'Brackets first, then multiply, then subtract.', [`Brackets: ${a} + ${b} = ${a + b}.`, `Multiply: ${a + b} × ${c} = ${(a + b) * c}.`, `Subtract: ${(a + b) * c} − ${e} = ${ans}.`]); },
   r => { const k = r.int(3, 9), x = r.int(4, 20), s = r.int(1, 15), res = x * k - s;
      return Q(`I think of a number, multiply it by ${k} and take away ${s}. The answer is ${res}. What was my number?`, choices(r, x, [Math.round((res - s) / k) === x ? x + 1 : Math.round((res - s) / k), res + s, Math.round(res / k), x - 1]), 'Work backwards: undo each step in reverse order.', [`Undo "take away ${s}": ${res} + ${s} = ${res + s}.`, `Undo "multiply by ${k}": ${res + s} ÷ ${k} = ${x}.`]); },
   r => { const per = r.int(6, 15), n = r.int(40, 200), boxes = Math.ceil(n / per); if (n % per === 0) return null; const thing = r.pick([['eggs', 'boxes'], ['children', 'minibuses'], ['books', 'shelves'], ['pupils', 'tables']]);
      return Q(`${n} ${thing[0]} need ${thing[1]}. Each one holds ${per}. How many ${thing[1]} are needed?`, choices(r, boxes, [Math.floor(n / per), boxes + 1, n % per, Math.round(n / per) === boxes ? boxes - 1 : Math.round(n / per)]), 'Divide, then think: what happens to the ones left over?', [`${n} ÷ ${per} = ${Math.floor(n / per)} remainder ${n % per}.`, `The ${n % per} left over still need one more, so round up.`]); }]
]);

// ------------------------------------------------------------ fractions
T.fractions = (r, d) => pickLevel(r, d, [
  [r => { const den = r.pick([2, 3, 4, 5, 6, 8, 10]), num = r.int(1, den - 1), m = r.int(2, 12), amt = den * m, ans = num * m; if (gcd(num, den) > 1) return null;
      return Q(`What is ${P(num, den)} of ${amt}?`, choices(r, ans, [m, amt / num, ans + m, amt - ans]), 'Divide by the bottom number, then multiply by the top number.', [`Divide by the bottom: ${amt} ÷ ${den} = ${m}.`, `Multiply by the top: ${m} × ${num} = ${ans}.`]); },
   r => { const den = r.pick([2, 3, 4, 5, 6]), num = r.int(1, den - 1), k = r.int(2, 6), tgt = den * k, ans = num * k; if (gcd(num, den) > 1) return null;
      return Q(`${P(num, den)} = ?/${tgt}. What is the missing number?`, choices(r, ans, [num + k, num * tgt, ans + 1, tgt - ans]), 'Whatever you do to the bottom, do the same to the top.', [`${den} × ${k} = ${tgt}, so the bottom was multiplied by ${k}.`, `Multiply the top by ${k} too: ${num} × ${k} = ${ans}.`]); },
   r => { const den = r.pick([2, 3, 4, 5]), num = r.int(1, den - 1); if (gcd(num, den) > 1) return null; const k = r.int(2, 6), N2 = num * k, D2 = den * k;
      return Q(`Write ${P(N2, D2)} in its simplest form.`, choices(r, P(num, den), [P(N2 / 2 === Math.floor(N2 / 2) && D2 % 2 === 0 ? N2 / 2 : N2, D2 % 2 === 0 ? D2 / 2 : D2), P(den, num), P(num + 1, den), P(num, den + 1)]), 'Divide the top and bottom by the biggest number that goes into both.', [`The biggest number that divides ${N2} and ${D2} is ${k}.`, `${N2} ÷ ${k} = ${num} and ${D2} ÷ ${k} = ${den}.`]); }],
  [r => { const den = r.pick([5, 6, 7, 8, 9, 10, 12]), a = r.int(1, den - 2), b = r.int(1, den - 1 - a), add = r() < .5, A = add ? a + b : a + b, B = add ? b : b;
      if (add) { const s = a + b, g = gcd(s, den); return Q(`${P(a, den)} + ${P(b, den)} = ?`, choices(r, P(s, den), [P(s, den * 2), P(a * b, den), P(s + 1, den), P(s, den + 1)]), 'The denominators are the same, so just add the tops.', [`The bottoms are the same (${den}), so they stay the same.`, `Add the tops: ${a} + ${b} = ${s}.`, g > 1 ? `${P(s, den)} could also be simplified to ${P(s / g, den / g)}, but ${P(s, den)} is in the options.` : `So the answer is ${P(s, den)}.`]); }
      const t = a + b; return Q(`${P(t, den)} − ${P(b, den)} = ?`, choices(r, P(a, den), [P(a, den * 2), P(t + b, den), P(a, den - b > 0 ? den - b : den + 1), P(a + 1, den)]), 'The denominators are the same, so just subtract the tops.', [`The bottoms stay as ${den}.`, `Subtract the tops: ${t} − ${b} = ${a}.`]); },
   r => { const d1 = r.pick([2, 3, 4, 5]), k = r.pick([2, 3]), d2 = d1 * k, a = r.int(1, d1 - 1), b = r.int(1, d2 - 1), s = a * k + b; if (s >= d2 * 2) return null;
      return Q(`${P(a, d1)} + ${P(b, d2)} = ? (give the answer in ${d2}ths)`, choices(r, P(s, d2), [P(a + b, d1 + d2), P(a + b, d2), P(s, d1 + d2), P(s + 1, d2)]), `Change ${P(a, d1)} into ${d2}ths first.`, [`${P(a, d1)} = ${P(a * k, d2)} (multiply top and bottom by ${k}).`, `${P(a * k, d2)} + ${P(b, d2)} = ${P(s, d2)}.`]); },
   r => { const fr = r.sample([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [5, 8], [3, 8], [7, 10]], 5), big = r() < .5, val = f => f[0] / f[1];
      const ans = fr.reduce((m, f) => (big ? val(f) > val(m) : val(f) < val(m)) ? f : m), ties = fr.filter(f => val(f) === val(ans)).length; if (ties > 1) return null;
      return Q(`Which fraction is the ${big ? 'largest' : 'smallest'}?`, choices(r, P(...ans), fr.filter(f => f !== ans).map(f => P(...f))), 'Change them into decimals or fractions with the same bottom number, then compare.', [`As decimals: ${fr.map(f => `${P(...f)} = ${dp(val(f), 3)}`).join(', ')}.`, `The ${big ? 'largest' : 'smallest'} is ${P(...ans)}.`]); }],
  [r => { const den = r.pick([2, 3, 4, 5, 8]), w = r.int(1, 4), n = r.int(1, den - 1), top = w * den + n;
      return Q(`Write ${P(top, den)} as a mixed number.`, choices(r, `${w} ${P(n, den)}`, [`${w + 1} ${P(n, den)}`, `${w} ${P(den - n, den)}`, `${w + 1} ${P(den - n, den)}`, `${w} ${P(n, top)}`]), `How many whole ${den}s fit into ${top}? What is left over?`, [`${top} ÷ ${den} = ${w} remainder ${n}.`, `So ${P(top, den)} = ${w} whole and ${P(n, den)}.`]); },
   r => { const den = r.pick([3, 4, 5, 6, 8]), num = r.int(1, den - 1), part = r.int(2, 12) * num, whole = part / num * den; if (gcd(num, den) > 1) return null;
      return Q(`${P(num, den)} of a number is ${part}. What is the number?`, choices(r, whole, [part / num, part * den, part * num, whole + den]), `First find ${P(1, den)}, then multiply up to the whole.`, [num === 1 ? `${P(1, den)} of the number is ${part}.` : `If ${P(num, den)} is ${part}, then ${P(1, den)} is ${part} ÷ ${num} = ${part / num}.`, `The whole is ${den} lots of that: ${part / num} × ${den} = ${whole}.`]); },
   r => { const den = r.pick([3, 4, 5, 6, 8]), num = r.int(1, den - 1), w = r.int(2, 9), top = num * w, _ok = gcd(num, den) === 1 || null; if (!_ok) return null; const g = gcd(top, den), mixedW = Math.floor(top / den), rem = top % den;
      const ans = rem === 0 ? String(top / den) : mixedW ? `${mixedW} ${P(rem / gcd(rem, den), den / gcd(rem, den))}` : P(top / g, den / g);
      return Q(`${P(num, den)} × ${w} = ?`, choices(r, ans, [P(top, den * w), P(num, den * w), `${w} ${P(num, den)}`, P(num + w, den)]), 'Multiply the top number by the whole number. The bottom stays the same.', [`${num} × ${w} = ${top}, so the answer is ${P(top, den)}.`, rem === 0 ? `${P(top, den)} = ${top / den}.` : mixedW ? `${P(top, den)} = ${ans} as a mixed number (simplified).` : `Simplified, that is ${ans}.`]); }]
]);

// ------------------------------------------------------------ decimals (worked in tenths and hundredths to avoid rounding errors)
T.decimals = (r, d) => pickLevel(r, d, [
  [r => { const a = r.int(11, 99), b = r.int(11, 99), s = a + b;
      return Q(`${dp(a / 10, 1)} + ${dp(b / 10, 1)} = ?`, choices(r, dp(s / 10, 1), [dp(s / 100, 2), dp((a + b + 10) / 10, 1), dp((a % 10 + b % 10) / 10 + Math.floor(a / 10) + Math.floor(b / 10) - 1, 1), String(s)]), 'Line up the decimal points, then add.', [`Line up the points: ${dp(a / 10, 1)} + ${dp(b / 10, 1)}.`, `Add the tenths, carry if needed, then add the ones: ${dp(s / 10, 1)}.`]); },
   r => { const x = r.int(11, 999) / 100, k = r.pick([10, 100]);
      return Q(`${dp(x, 2)} × ${k} = ?`, choices(r, dp(x * k, 2), [dp(x * k / 10, 2), dp(x * k * 10, 2), dp(x / k, 4), dp(x + k, 2)]), `Multiplying by ${k} moves every digit ${k === 10 ? 'one place' : 'two places'} to the left.`, [`× ${k} makes the number ${k} times bigger.`, `The digits move ${k === 10 ? 'one place' : 'two places'} to the left: ${dp(x * k, 2)}.`]); },
   r => { const vals = r.sample([0.5, 0.45, 0.405, 0.54, 0.055, 0.6, 0.06, 0.65, 0.506, 0.15, 0.51], 5), big = r() < .5, ans = big ? Math.max(...vals) : Math.min(...vals);
      return Q(`Which number is the ${big ? 'largest' : 'smallest'}?`, choices(r, String(ans), vals.filter(v => v !== ans).map(String)), 'Write them all with the same number of decimal places, then compare.', [`With three decimal places: ${vals.map(v => v.toFixed(3)).join(', ')}.`, `The ${big ? 'largest' : 'smallest'} is ${ans}.`]); }],
  [r => { const a = r.int(300, 999), b = r.int(105, a - 50), s = a - b;
      return Q(`${dp(a / 100, 2)} − ${dp(b / 100, 2)} = ?`, choices(r, (s / 100).toFixed(2), [((s + 10) / 100).toFixed(2), ((s - 10) / 100).toFixed(2), ((s + 100) / 100).toFixed(2), (s / 10).toFixed(2)]), 'Line up the decimal points. Exchange from the next column when you need to.', [`Line up the points and subtract the hundredths, then the tenths, then the ones.`, `${(a / 100).toFixed(2)} − ${(b / 100).toFixed(2)} = ${(s / 100).toFixed(2)}.`]); },
   r => { const x = r.int(5, 9999), k = r.pick([10, 100, 1000]);
      return Q(`${N(x)} ÷ ${N(k)} = ?`, choices(r, dp(x / k, 4), [dp(x / k * 10, 4), dp(x / k / 10, 5), String(x * k), dp(x - k > 0 ? x - k : x / k * 100, 4)]), `Dividing by ${N(k)} moves every digit ${Math.log10(k)} place${k > 10 ? 's' : ''} to the right.`, [`÷ ${N(k)} makes the number ${N(k)} times smaller.`, `The digits move ${Math.log10(k)} place${k > 10 ? 's' : ''} to the right: ${dp(x / k, 4)}.`]); },
   r => { const pairs = [[0.5, [1, 2]], [0.25, [1, 4]], [0.75, [3, 4]], [0.2, [1, 5]], [0.4, [2, 5]], [0.6, [3, 5]], [0.8, [4, 5]], [0.1, [1, 10]], [0.3, [3, 10]], [0.7, [7, 10]], [0.125, [1, 8]], [0.05, [1, 20]]], [x, f] = r.pick(pairs);
      return Q(`Write ${x} as a fraction in its simplest form.`, choices(r, P(...f), [P(Math.round(x * 10), 100), P(Math.round(x * 100), 10), P(f[1], f[0]), P(f[0], f[1] + 1)].filter(s => s !== P(...f))), 'Write the decimal over 10, 100 or 1,000, then simplify.', [`${x} = ${P(Math.round(x * 1000), 1000)}.`, `Simplify: ${P(...f)}.`]); }],
  [r => { const a = r.int(12, 95), k = r.int(3, 9), p = a * k;
      return Q(`${dp(a / 10, 1)} × ${k} = ?`, choices(r, dp(p / 10, 1), [dp(p / 100, 2), String(p), dp((p + 10) / 10, 1), dp(a / 10 + k, 1)]), `Work out ${a} × ${k}, then put the decimal point back.`, [`${a} × ${k} = ${p}.`, `${dp(a / 10, 1)} has one decimal place, so the answer has one too: ${dp(p / 10, 1)}.`]); },
   r => { const price = r.int(105, 899), n = r.int(3, 8), tot = price * n;
      return Q(`A notebook costs ${pounds(price)}. How much do ${n} notebooks cost?`, choices(r, pounds(tot), [pounds(tot - price), pounds(tot + 100), pounds(price + n * 100), pounds(tot / 10)]), 'Change to pence, multiply, then change back to pounds.', [`${pounds(price)} = ${price}p.`, `${price} × ${n} = ${tot}p.`, `${tot}p = ${pounds(tot)}.`]); },
   r => { const a = r.int(12, 98) / 100, b = r.int(2, 9) / 10, s = Math.round((a + b) * 100) / 100;
      return Q(`${a.toFixed(2)} + ${b.toFixed(1)} = ?`, choices(r, s.toFixed(2), [(a + b / 10).toFixed(2), (Math.round((a + b) * 100 + 10) / 100).toFixed(2), String(Math.round(a * 100 + b * 10)), ((a + b) / 10).toFixed(3)]), 'Line up the decimal points carefully. Tenths go under tenths.', [`${b.toFixed(1)} = ${b.toFixed(2)}.`, `${a.toFixed(2)} + ${b.toFixed(2)} = ${s.toFixed(2)}.`]); }]
]);

// ------------------------------------------------------------ percentages
T.percentages = (r, d) => pickLevel(r, d, [
  [r => { const p = r.pick([10, 50, 25]), x = r.int(2, 40) * (p === 25 ? 4 : p === 50 ? 2 : 10), ans = x * p / 100;
      return Q(`What is ${p}% of ${x}?`, choices(r, ans, [x * p / 10, x - ans, ans + p, p]), p === 10 ? 'To find 10%, divide by 10.' : p === 50 ? '50% is a half.' : '25% is a quarter: halve, then halve again.', [p === 10 ? `${x} ÷ 10 = ${ans}.` : p === 50 ? `Half of ${x} is ${ans}.` : `Half of ${x} is ${x / 2}, and half again is ${ans}.`]); },
   r => { const [n, dn] = r.pick([[1, 2], [1, 4], [3, 4], [1, 10], [3, 10], [1, 5], [2, 5], [7, 10]]), ans = n / dn * 100;
      return Q(`What is ${P(n, dn)} as a percentage?`, choices(r, ans + '%', [n * 10 + '%', dn + '%', (100 - ans) + '%', n + dn + '%']), 'Per cent means out of 100. Make the bottom number 100.', [`${P(n, dn)} = ${P(ans, 100)}.`, `So it is ${ans}%.`]); }],
  [r => { const p = r.pick([5, 20, 30, 40, 60, 75, 15]), x = r.int(2, 30) * 20, ans = x * p / 100;
      return Q(`What is ${p}% of ${x}?`, choices(r, ans, [x / p, ans + x / 10, x - ans, ans * 2]), 'Find 10% (or 1%) first, then build up to the percentage you need.', [`10% of ${x} is ${x / 10}.`, p % 10 === 0 ? `${p}% is ${p / 10} lots of 10%: ${p / 10} × ${x / 10} = ${ans}.` : p === 5 ? `5% is half of 10%: ${ans}.` : p === 15 ? `5% is ${x / 20}, so 15% is ${x / 10} + ${x / 20} = ${ans}.` : `75% is three quarters: ${ans}.`]); },
   r => { const total = r.pick([20, 25, 40, 50]), part = r.int(1, total - 1); if ((part * 100) % total) return null; const ans = part * 100 / total;
      return Q(`${part} out of ${total} pupils walk to school. What percentage is that?`, choices(r, ans + '%', [part + '%', (100 - ans) + '%', total - part + '%', ans / 2 + '%']), 'Write it as a fraction, then make the bottom number 100.', [`${part} out of ${total} = ${P(part, total)}.`, `Multiply top and bottom by ${100 / total}: ${P(ans, 100)} = ${ans}%.`]); }],
  [r => { const p = r.pick([10, 20, 25, 30, 50]), price = r.int(4, 30) * 4 * 100, up = r() < .5, ch = price * p / 100, ans = up ? price + ch : price - ch, item = r.pick(['bike', 'scooter', 'game', 'jacket', 'tent']);
      return Q(`A ${item} costs ${pounds(price)}. In a ${up ? 'price rise' : 'sale'} the price goes ${up ? 'up' : 'down'} by ${p}%. What is the new price?`, choices(r, pounds(ans), [pounds(ch), pounds(up ? price - ch : price + ch), pounds(price - p * 100 > 0 ? price - p * 100 : price + p * 100), pounds(ans + 100)]), `Find ${p}% of the price first, then ${up ? 'add it on' : 'take it off'}.`, [`${p}% of ${pounds(price)} = ${pounds(ch)}.`, `${pounds(price)} ${up ? '+' : '−'} ${pounds(ch)} = ${pounds(ans)}.`]); },
   r => { const p = r.pick([12, 15, 35, 45, 65, 85]), x = r.int(2, 12) * 20, ans = x * p / 100;
      return Q(`What is ${p}% of ${x}?`, choices(r, dp(ans, 1), [dp(x * p / 1000, 2), dp(ans + x / 10, 1), dp(x - ans, 1), dp(ans - x / 20, 1)]), 'Split the percentage into easy parts like 10%, 5% and 1%.', [`10% of ${x} = ${x / 10}, 5% = ${x / 20}, 1% = ${dp(x / 100, 2)}.`, `${p}% = ${Math.floor(p / 10)} × 10%${p % 10 === 5 ? ' + 5%' : p % 10 ? ` + ${p % 10} × 1%` : ''} = ${dp(ans, 1)}.`]); }]
]);

// ------------------------------------------------------------ ratio and proportion
T.ratio = (r, d) => pickLevel(r, d, [
  [r => { const ppl = r.pick([2, 3, 4, 5]), m = r.pick([2, 3, 4]), g = r.int(2, 9) * 25, ing = r.pick(['flour', 'sugar', 'rice', 'pasta', 'butter']);
      return Q(`A recipe for ${ppl} people uses ${g} g of ${ing}. How much ${ing} is needed for ${ppl * m} people?`, choices(r, g * m, [g + ppl * m, g * m + g, g * ppl, g * (m + 1)], v => v + ' g', 25), `How many times bigger is ${ppl * m} than ${ppl}?`, [`${ppl * m} people is ${m} times as many as ${ppl}.`, `${g} g × ${m} = ${g * m} g.`]); },
   r => { const a = r.int(1, 6), b = r.int(1, 6), k = r.int(2, 6); if (gcd(a, b) > 1 || a === b) return null;
      return Q(`Write the ratio ${a * k} : ${b * k} in its simplest form.`, choices(r, `${a} : ${b}`, [`${b} : ${a}`, `${a * k / (k > 2 ? 2 : 1)} : ${b * k / (k > 2 ? 2 : 1)}`, `${a + 1} : ${b}`, `${a} : ${b + 1}`]), 'Divide both parts by the biggest number that goes into both.', [`Both ${a * k} and ${b * k} divide by ${k}.`, `${a * k} ÷ ${k} = ${a} and ${b * k} ÷ ${k} = ${b}.`]); }],
  [r => { const a = r.int(1, 5), b = r.int(1, 5), unit = r.int(2, 12), tot = (a + b) * unit, [x, y] = r.sample(NAMES, 2);
      return Q(`${x} and ${y} share £${tot} in the ratio ${a} : ${b}. How much does ${x} get?`, choices(r, '£' + a * unit, ['£' + b * unit, '£' + tot / 2, '£' + Math.round(tot / a), '£' + a * b * unit / Math.max(a, b)]), 'Add the parts of the ratio to find how many shares there are.', [`${a} + ${b} = ${a + b} shares.`, `One share is £${tot} ÷ ${a + b} = £${unit}.`, `${x} gets ${a} shares: ${a} × £${unit} = £${a * unit}.`]); },
   r => { const g = r.int(2, 9), b = r.int(2, 9), k = r.int(2, 5), [c1, c2] = r.sample(['red', 'blue', 'green', 'yellow'], 2);
      return Q(`In a bag the ratio of ${c1} to ${c2} beads is ${g} : ${b}. There are ${g * k} ${c1} beads. How many ${c2} beads are there?`, choices(r, b * k, [b, g * k + b, b * g, b * k + k]), `How many times bigger than ${g} is ${g * k}?`, [`${g * k} ÷ ${g} = ${k}, so everything is ${k} times bigger.`, `${b} × ${k} = ${b * k} ${c2} beads.`]); }],
  [r => { const a = r.int(1, 4), b = r.int(1, 4), c = r.int(1, 4), u = r.int(3, 10), tot = (a + b + c) * u;
      return Q(`${tot} sweets are shared in the ratio ${a} : ${b} : ${c}. How many sweets are in the biggest share?`, choices(r, Math.max(a, b, c) * u, [Math.min(a, b, c) * u, tot / 3, Math.max(a, b, c) * u + u, u]), 'Add all three parts to find the number of shares.', [`${a} + ${b} + ${c} = ${a + b + c} shares.`, `One share is ${tot} ÷ ${a + b + c} = ${u}.`, `The biggest share is ${Math.max(a, b, c)} × ${u} = ${Math.max(a, b, c) * u}.`]); },
   r => { const n1 = r.pick([4, 5, 6, 8]), cost = r.int(3, 9) * n1 * 10, n2 = r.int(2, 12); if (n2 === n1) return null; const each = cost / n1;
      return Q(`${n1} pencils cost ${pounds(cost)}. How much do ${n2} pencils cost?`, choices(r, pounds(each * n2), [pounds(cost + (n2 - n1) * 10), pounds(each), pounds(cost * n2 / 10), pounds(each * (n2 + 1))]), 'Find the cost of one first.', [`One pencil costs ${pounds(cost)} ÷ ${n1} = ${pounds(each)}.`, `${n2} pencils cost ${n2} × ${pounds(each)} = ${pounds(each * n2)}.`]); }]
]);

// ------------------------------------------------------------ algebra
T.algebra = (r, d) => pickLevel(r, d, [
  [r => { const x = r.int(3, 40), a = r.int(3, 30), b = x + a;
      return Q(`x + ${a} = ${b}. What is x?`, choices(r, x, [b + a, a, x + 1, b]), `Undo "+ ${a}" by taking away ${a} from both sides.`, [`x + ${a} = ${b}.`, `Take ${a} from both sides: x = ${b} − ${a} = ${x}.`]); },
   r => { const k = r.int(2, 9), x = r.int(2, 12);
      return Q(`${k}y = ${k * x}. What is y?`, choices(r, x, [k * x - k, k * x * k, k + x, x + 1]), `${k}y means ${k} × y. Undo it by dividing by ${k}.`, [`${k} × y = ${k * x}.`, `y = ${k * x} ÷ ${k} = ${x}.`]); },
   r => { const a = r.int(2, 9), k = r.int(2, 6), c = r.int(1, 15), ans = k * a + c;
      return Q(`If a = ${a}, what is ${k}a + ${c}?`, choices(r, ans, [Number(`${k}${a}`) + c, k + a + c, k * (a + c), ans - c]), `${k}a means ${k} × a.`, [`${k}a = ${k} × ${a} = ${k * a}.`, `${k * a} + ${c} = ${ans}.`]); }],
  [r => { const k = r.int(2, 9), x = r.int(2, 15), c = r.int(1, 20), res = k * x + c;
      return Q(`${k}n + ${c} = ${res}. What is n?`, choices(r, x, [Math.round((res + c) / k) === x ? x + 2 : Math.round((res + c) / k), res - c, Math.round(res / k), x - 1]), 'Undo the adding first, then undo the multiplying.', [`Take ${c} from both sides: ${k}n = ${res - c}.`, `Divide by ${k}: n = ${res - c} ÷ ${k} = ${x}.`]); },
   r => { const per = r.int(2, 9), fixed = r.int(5, 30), n = r.int(3, 12), ans = per * n + fixed, w = r.pick(['A taxi', 'A plumber', 'A bike hire shop']);
      return Q(`${w} charges £${fixed} plus £${per} for each ${w === 'A taxi' ? 'mile' : 'hour'}. The rule is: cost = ${per}h + ${fixed}. How much is it for ${n} ${w === 'A taxi' ? 'miles' : 'hours'}?`, choices(r, '£' + ans, ['£' + (per + fixed) * n, '£' + (per * n), '£' + (per + n + fixed), '£' + (ans + per)]), 'Put the number in place of the letter, then multiply before adding.', [`cost = ${per} × ${n} + ${fixed}.`, `${per * n} + ${fixed} = £${ans}.`]); },
   r => { const a = r.int(2, 9), b = r.int(2, 9), ans = a * a + b;
      return Q(`If m = ${a}, what is m² + ${b}?`, choices(r, ans, [a * 2 + b, (a + b) ** 2, a * a * b, ans + a]), 'm² means m × m.', [`m² = ${a} × ${a} = ${a * a}.`, `${a * a} + ${b} = ${ans}.`]); }],
  [r => { const k = r.int(2, 6), c = r.int(1, 9), x = r.int(c + 1, c + 12), res = k * (x - c);
      return Q(`${k}(x − ${c}) = ${res}. What is x?`, choices(r, x, [res / k, x - 2 * c > 0 ? x - 2 * c : x + 3, res - c, Math.round((res + c) / k)]), 'Divide both sides by the number outside the bracket first.', [`Divide by ${k}: x − ${c} = ${res / k}.`, `Add ${c}: x = ${res / k} + ${c} = ${x}.`]); },
   r => { const k = r.int(2, 5), c = r.int(2, 12), n = r.int(3, 12), [x] = r.sample(NAMES, 1);
      return Q(`${x} has n marbles. Ali has ${c} more than ${k} times as many as ${x}. Which expression shows how many marbles Ali has?`, choices(r, `${k}n + ${c}`, [`${c}n + ${k}`, `${k}(n + ${c})`, `n + ${k} + ${c}`, `${k}n − ${c}`]), `"${k} times as many" means ${k}n. "${c} more" means + ${c}.`, [`${k} times as many as n is ${k}n.`, `${c} more than that is ${k}n + ${c}.`]); },
   r => { const a = r.int(3, 9), c = r.int(1, a - 1), b = r.int(1, 9), x = r.int(1, 10), rhs = a * x + b - c * x;
      return Q(`${a}x + ${b} = ${c}x + ${rhs}. What is x?`, choices(r, x, [x + 1, rhs - b, Math.round((rhs + b) / (a - c)) === x ? x + 2 : Math.round((rhs + b) / (a - c)), Math.round((rhs - b) / (a + c))]), 'Get the x terms on one side and the numbers on the other.', [`Take ${c}x from both sides: ${a - c}x + ${b} = ${rhs}.`, `Take ${b} from both sides: ${a - c}x = ${rhs - b}.`, `Divide by ${a - c}: x = ${x}.`]); }]
]);

// ------------------------------------------------------------ sequences
T.sequences = (r, d) => pickLevel(r, d, [
  [r => { const s = r.int(1, 30), k = r.int(2, 12), t = [0, 1, 2, 3, 4].map(i => s + i * k);
      return Q(`What is the next number? ${t.slice(0, 4).join(', ')}, ?`, choices(r, t[4], [t[4] + 1, t[3] + 2 * k, t[4] - 1, t[3] + k + 10]), 'Find the difference between neighbouring numbers.', [`The numbers go up by ${k} each time.`, `${t[3]} + ${k} = ${t[4]}.`]); },
   r => { const s = r.int(50, 120), k = r.int(3, 11), t = [0, 1, 2, 3, 4].map(i => s - i * k), gap = r.int(1, 3);
      return Q(`What is the missing number? ${t.map((v, i) => i === gap ? '?' : v).join(', ')}`, choices(r, t[gap], [t[gap] + 1, t[gap] - k, t[gap] + k, t[gap] - 2]), 'Work out how much it goes down by each time.', [`The numbers go down by ${k} each time.`, `The missing number is ${t[gap - 1]} − ${k} = ${t[gap]}.`]); }],
  [r => { const s = r.int(-5, 8), k = r.int(-6, -2), t = [0, 1, 2, 3, 4].map(i => s + i * k);
      return Q(`What is the next number? ${t.slice(0, 4).join(', ')}, ?`, choices(r, String(t[4]), [String(-t[4]), String(t[4] + 1), String(t[3] - k), String(t[4] - 1)]), 'The numbers go down past zero. Count back carefully.', [`The numbers go down by ${-k} each time.`, `${t[3]} − ${-k} = ${t[4]}.`]); },
   r => { const k = r.int(2, 9), c = r.int(-3, 9), n = r.pick([10, 20, 50, 100]), ans = k * n + c;
      return Q(`The rule for a sequence is ${k}n ${c < 0 ? '− ' + -c : '+ ' + c}. What is the ${n}th term?`, choices(r, ans, [k * n, k + n + c, k * (n + c), ans + k]), 'Put the term number in place of n.', [`n = ${n}.`, `${k} × ${n} = ${k * n}, then ${c < 0 ? 'take away ' + -c : 'add ' + c}: ${ans}.`]); },
   r => { const s = r.int(1, 6), m = r.pick([2, 3]), t = [0, 1, 2, 3, 4].map(i => s * m ** i);
      return Q(`What is the next number? ${t.slice(0, 4).join(', ')}, ?`, choices(r, t[4], [t[3] + (t[3] - t[2]), t[4] + m, t[3] * (m + 1), t[3] + m]), 'Is it adding the same amount, or multiplying?', [`Each number is ${m} times the one before.`, `${t[3]} × ${m} = ${t[4]}.`]); }],
  [r => { const s = r.int(1, 10), d0 = r.int(1, 4), t = [s]; for (let i = 1; i < 6; i++) t.push(t[i - 1] + d0 + i - 1);
      return Q(`What is the next number? ${t.slice(0, 5).join(', ')}, ?`, choices(r, t[5], [t[4] + (t[4] - t[3]), t[5] + 1, t[4] + d0, t[5] + 2]), 'Look at the differences. Do they follow a pattern too?', [`The differences are ${[1, 2, 3, 4].map(i => t[i] - t[i - 1]).join(', ')}: each one is 1 more than the last.`, `The next difference is ${t[5] - t[4]}, so ${t[4]} + ${t[5] - t[4]} = ${t[5]}.`]); },
   r => { const a = r.int(1, 5), b = r.int(1, 6), t = [a, b]; for (let i = 2; i < 7; i++) t.push(t[i - 1] + t[i - 2]);
      return Q(`What is the next number? ${t.slice(0, 6).join(', ')}, ?`, choices(r, t[6], [t[5] + (t[5] - t[4]), t[5] * 2, t[6] + 1, t[5] + t[3]]), 'Look at how each number is made from the two before it.', ['Each number is the total of the two numbers before it.', `${t[4]} + ${t[5]} = ${t[6]}.`]); },
   r => { const sq = r() < .5, k = r.int(1, 4), t = [0, 1, 2, 3, 4, 5].map(i => sq ? (i + k) ** 2 : (i + k) * (i + k + 1) / 2);
      return Q(`What is the next number? ${t.slice(0, 5).join(', ')}, ?`, choices(r, t[5], [t[4] + (t[4] - t[3]), t[5] + 1, t[5] - 2, t[4] * 2]), sq ? 'Do you recognise these numbers? Think of a number times itself.' : 'Look at the differences between the numbers.', sq ? [`These are square numbers: ${k}², ${k + 1}², ${k + 2}² and so on.`, `Next is ${k + 5}² = ${t[5]}.`] : ['These are triangle numbers: the differences go up by 1 each time.', `${t[4]} + ${t[5] - t[4]} = ${t[5]}.`]); }]
]);

// ------------------------------------------------------------ measures
const CONV = [['cm', 'm', 100], ['mm', 'cm', 10], ['m', 'km', 1000], ['g', 'kg', 1000], ['ml', 'l', 1000]];
T.measures = (r, d) => pickLevel(r, d, [
  [r => { const [s, b, f] = r.pick(CONV), n = r.int(2, 9), big = r() < .5;
      return big ? Q(`How many ${s} are there in ${n} ${b}?`, choices(r, n * f, [n * f / 10, n * f * 10, n + f, n * 100 === n * f ? n * 10 : n * 100]), `There are ${N(f)} ${s} in 1 ${b}.`, [`1 ${b} = ${N(f)} ${s}.`, `${n} × ${N(f)} = ${N(n * f)} ${s}.`])
        : Q(`${N(n * f)} ${s} = ? ${b}`, choices(r, n, [n * 10, n * f, n / 10, n + 1]), `There are ${N(f)} ${s} in 1 ${b}. Divide by ${N(f)}.`, [`1 ${b} = ${N(f)} ${s}.`, `${N(n * f)} ÷ ${N(f)} = ${n} ${b}.`]); }],
  [r => { const [s, b, f] = r.pick(CONV.filter(c => c[2] >= 100)), whole = r.int(1, 9), part = r.pick([0.5, 0.25, 0.75, 0.2, 0.4, 0.1]), x = whole + part, ans = Math.round(x * f);
      return Q(`${x} ${b} = ? ${s}`, choices(r, ans, [Math.round(x * f / 10), whole * f + part * 100, Math.round(x * 100), ans + f], N), `1 ${b} = ${N(f)} ${s}. Multiply by ${N(f)}.`, [`${x} × ${N(f)} = ${N(ans)} ${s}.`]); },
   r => { const m = r.int(1, 4), cm = r.int(5, 95), add = r.int(15, 95), tot = m * 100 + cm + add;
      return Q(`A plank is ${m} m ${cm} cm long. Another ${add} cm is added. How long is it now?`, choices(r, `${Math.floor(tot / 100)} m ${tot % 100} cm`, [`${m} m ${cm + add} cm`, `${m + 1} m ${(cm + add) % 100 + 10} cm`, `${Math.floor(tot / 100)} m ${(tot % 100 + 10) % 100} cm`, `${m} m ${(cm + add) % 100} cm`]), 'Change everything to centimetres, add, then change back.', [`${m} m ${cm} cm = ${m * 100 + cm} cm.`, `${m * 100 + cm} + ${add} = ${tot} cm = ${Math.floor(tot / 100)} m ${tot % 100} cm.`]); }],
  [r => { const jug = r.pick([1, 1.5, 2, 2.5]), glass = r.pick([125, 200, 250]), ml = jug * 1000; if (ml % glass) return null;
      return Q(`A jug holds ${jug} litres of juice. How many ${glass} ml glasses can be filled from it?`, choices(r, ml / glass, [jug * 1000 / glass / 10, Math.round(jug * 100 / glass * 10), ml / glass + 2, ml / glass - 1]), 'Change litres to millilitres first.', [`${jug} litres = ${N(ml)} ml.`, `${N(ml)} ÷ ${glass} = ${ml / glass} glasses.`]); },
   r => { const kg = r.int(2, 6), g = r.int(1, 9) * 100, parts = r.pick([2, 4, 5]), tot = kg * 1000 + g; if (tot % parts) return null;
      return Q(`${kg} kg ${g} g of flour is shared equally into ${parts} bags. How much is in each bag?`, choices(r, `${N(tot / parts)} g`, [`${N((kg * 1000 + g / 10) / parts)} g`, `${N(tot / parts / 10)} g`, `${N(tot * parts)} g`, `${N(tot / parts + 100)} g`]), 'Change to grams, then divide.', [`${kg} kg ${g} g = ${N(tot)} g.`, `${N(tot)} ÷ ${parts} = ${N(tot / parts)} g.`]); }]
]);

// ------------------------------------------------------------ time
T.time = (r, d) => pickLevel(r, d, [
  [r => { const h = r.int(7, 18), m1 = r.int(0, 4) * 5, m2 = m1 + r.int(3, 11) * 5; if (m2 >= 60) return null; const st = h * 60 + m1;
      return Q(`A lesson starts at ${hhmm(st)} and ends at ${hhmm(h * 60 + m2)}. How long is it?`, choices(r, `${m2 - m1} min`, [`${m2 - m1 + 5} min`, `${m2 - m1 - 5} min`, `${m2} min`, `${100 - (m2 - m1)} min`]), 'Count on from the start time.', [`From ${hhmm(st)} to ${hhmm(h * 60 + m2)} is ${m2 - m1} minutes.`]); },
   r => { const st = r.int(6 * 12, 20 * 12) * 5, add = r.int(2, 11) * 5 + r.pick([0, 60]), end = st + add;
      return Q(`A film starts at ${hhmm(st)} and lasts ${dur(add)}. What time does it finish?`, choices(r, hhmm(end), [hhmm(end + 40), hhmm(end - 60), hhmm(st + add + 10), hhmm(st + (add % 60) + 100)]), 'Add the hours, then the minutes. Remember there are 60 minutes in an hour, not 100.', [`${hhmm(st)} + ${dur(add)} = ${hhmm(end)}.`]); }],
  [r => { const t = r.int(13 * 12, 23 * 12) * 5;
      return Q(`What is ${hhmm(t)} in 12-hour time?`, choices(r, ampm(t), [ampm(t - 720), `${Math.floor(t / 60) - 10}:${pad2(t % 60)} pm`, `${Math.floor(t / 60) - 2}:${pad2(t % 60)} pm`, ampm(t + 60)]), 'For afternoon times, take 12 away from the hours and add pm.', [`${Math.floor(t / 60)} − 12 = ${Math.floor(t / 60) - 12}.`, `So ${hhmm(t)} is ${ampm(t)}.`]); },
   r => { const st = r.int(8 * 12, 17 * 12) * 5 + r.pick([0, 2, 3]), len = r.int(25, 110), end = st + len;
      return Q(`A train leaves at ${hhmm(st)} and arrives at ${hhmm(end)}. How long is the journey?`, choices(r, dur(len), [dur(len + 40), dur(len - 10), dur(len + 60), dur(Math.abs(Number(hhmm(end).replace(':', '')) - Number(hhmm(st).replace(':', ''))))]), 'Count on to the next o\'clock, then on to the arrival time.', [`From ${hhmm(st)} to ${hhmm(Math.ceil(st / 60) * 60)} is ${Math.ceil(st / 60) * 60 - st} min.`, `Then on to ${hhmm(end)} is ${end - Math.ceil(st / 60) * 60} min.`, `Altogether ${len} min = ${dur(len)}.`]); }],
  [r => { const st = r.int(9 * 12, 15 * 12) * 5 + r.int(0, 4), len = r.int(70, 220), end = st + len;
      return Q(`A coach leaves at ${hhmm(st)}. The journey takes ${dur(len)}. At what time does it arrive?`, choices(r, hhmm(end), [hhmm(end + 40), hhmm(end - 60), hhmm(st + Math.floor(len / 60) * 100 + len % 60), hhmm(end + 10)]), 'Add the hours first, then the minutes. Go past the hour carefully.', [`${hhmm(st)} + ${Math.floor(len / 60)} h = ${hhmm(st + Math.floor(len / 60) * 60)}.`, `+ ${len % 60} min = ${hhmm(end)}.`]); },
   r => { const w = r.int(2, 9), days = r.int(1, 6), unit = r.pick(['days', 'hours']); const ans = unit === 'days' ? w * 7 + days : (w * 24 + days);
      return unit === 'days' ? Q(`How many days are there in ${w} weeks and ${days} days?`, choices(r, ans, [w * 10 + days, w * 5 + days, w + days, w * 7]), 'There are 7 days in a week.', [`${w} × 7 = ${w * 7}.`, `${w * 7} + ${days} = ${ans} days.`])
        : Q(`How many hours are there in ${w} days and ${days} hours?`, choices(r, ans, [w * 12 + days, w * 60 + days, w * 100 + days, w * 24]), 'There are 24 hours in a day.', [`${w} × 24 = ${w * 24}.`, `${w * 24} + ${days} = ${ans} hours.`]); }]
]);

// ------------------------------------------------------------ money
T.money = (r, d) => pickLevel(r, d, [
  [r => { const note = r.pick([500, 1000, 2000]), cost = r.int(105, note - 50); if (cost % 5) return null;
      return Q(`You buy a toy for ${pounds(cost)} and pay with a ${pounds(note).replace('.00', '')} note. How much change do you get?`, choices(r, pounds(note - cost), [pounds(note - cost + 100), pounds(note - cost - 10), pounds(note - cost + 10), pounds(cost)]), 'Count up from the cost to the amount paid.', [`Count up from ${pounds(cost)} to ${pounds(note)}.`, `The change is ${pounds(note - cost)}.`]); },
   r => { const a = r.int(45, 399), b = r.int(45, 399), c = r.int(45, 199), tot = a + b + c;
      return Q(`A sandwich costs ${pounds(a)}, a drink ${pounds(b)} and a cake ${pounds(c)}. What is the total?`, choices(r, pounds(tot), [pounds(tot - 100), pounds(tot + 10), pounds(tot - 10), pounds(a + b)]), 'Add the pounds and pence carefully, or change everything to pence.', [`In pence: ${a} + ${b} + ${c} = ${tot}p.`, `${tot}p = ${pounds(tot)}.`]); }],
  [r => { const each = r.int(35, 280), n = r.int(3, 9), tot = each * n, item = r.pick(['tickets', 'comics', 'cupcakes', 'pens']);
      return Q(`${item[0].toUpperCase() + item.slice(1)} cost ${pounds(each)} each. How much do ${n} ${item} cost?`, choices(r, pounds(tot), [pounds(tot - each), pounds(each + n), pounds(tot + 100), pounds(tot / 10)]), 'Multiply the price by the number of items.', [`${each}p × ${n} = ${tot}p.`, `${tot}p = ${pounds(tot)}.`]); },
   r => { const price = r.int(4, 40) * 100, off = r.pick([100, 150, 200, 250, 500]); if (off >= price) return null; const n = r.int(2, 4), tot = (price - off) * n;
      return Q(`A game costs ${pounds(price)}. In a sale it is ${pounds(off)} cheaper. How much do ${n} games cost in the sale?`, choices(r, pounds(tot), [pounds(price * n - off), pounds(price * n), pounds((price + off) * n), pounds(price - off)]), 'Find the sale price of one game first.', [`Sale price: ${pounds(price)} − ${pounds(off)} = ${pounds(price - off)}.`, `${n} × ${pounds(price - off)} = ${pounds(tot)}.`]); }],
  [r => { const sizes = r.sample([2, 3, 4, 5, 6, 8, 10, 12], 5), base = r.int(35, 70), packs = sizes.map(n => ({ n, p: Math.round(n * (base + r.int(-12, 12)) / 5) * 5 }));
      const unit = k => k.p / k.n, best = packs.reduce((m, k) => unit(k) < unit(m) ? k : m); if (packs.filter(k => Math.abs(unit(k) - unit(best)) < 1).length > 1) return null;
      const lab = k => `${k.n} for ${pounds(k.p)}`;
      return Q('Which pack of yoghurts is the best value for money?', choices(r, lab(best), packs.filter(k => k !== best).map(lab)), 'Work out the cost of one yoghurt in each pack. The lowest price per yoghurt is the best value.', [packs.map(k => `${lab(k)}: ${dp(unit(k), 1)}p each`).join('; ') + '.', `The cheapest per yoghurt is ${lab(best)}.`]); },
   r => { const people = r.int(3, 6), tot = people * r.int(450, 1600); if (tot % 5) return null;
      return Q(`${people} friends share a bill of ${pounds(tot)} equally. How much does each person pay?`, choices(r, pounds(tot / people), [pounds(tot / people + 100), pounds(tot / (people + 1)), pounds(tot - people * 100), pounds(tot / people / 10)]), 'Divide the total by the number of people.', [`${tot}p ÷ ${people} = ${tot / people}p.`, `${tot / people}p = ${pounds(tot / people)}.`]); }]
]);

// ------------------------------------------------------------ area and perimeter
T.area_perimeter = (r, d) => pickLevel(r, d, [
  [r => { const l = r.int(3, 15), w = r.int(2, 12), area = r() < .5;
      return area ? Q(`A rectangle is ${l} cm long and ${w} cm wide. What is its area?`, choices(r, `${l * w} cm²`, [`${2 * (l + w)} cm²`, `${l + w} cm²`, `${l * w + l} cm²`, `${l * w * 2} cm²`]), 'Area = length × width.', [`${l} × ${w} = ${l * w}.`, 'Area is measured in square units, cm².'])
        : Q(`A rectangle is ${l} cm long and ${w} cm wide. What is its perimeter?`, choices(r, `${2 * (l + w)} cm`, [`${l * w} cm`, `${l + w} cm`, `${2 * l + w} cm`, `${2 * (l + w) + 2} cm`]), 'Perimeter is the distance all the way round: add all four sides.', [`${l} + ${w} + ${l} + ${w} = ${2 * (l + w)} cm.`]); }],
  [r => { const w = r.int(3, 12), l = r.int(4, 15), A = l * w;
      return Q(`A rectangle has an area of ${A} cm². Its width is ${w} cm. How long is it?`, choices(r, `${l} cm`, [`${A - w} cm`, `${A / 2} cm`, `${l + 1} cm`, `${w} cm`]), 'Area = length × width, so length = area ÷ width.', [`${A} ÷ ${w} = ${l} cm.`]); },
   r => { const s = r.int(3, 15);
      return Q(`A square has a perimeter of ${4 * s} cm. What is its area?`, choices(r, `${s * s} cm²`, [`${4 * s} cm²`, `${2 * s} cm²`, `${(4 * s) ** 2} cm²`, `${s * 4 * s} cm²`]), 'All four sides of a square are the same length.', [`Each side is ${4 * s} ÷ 4 = ${s} cm.`, `Area = ${s} × ${s} = ${s * s} cm².`]); }],
  [r => { const L = r.int(8, 14), W = r.int(6, 12), cl = r.int(2, L - 3), cw = r.int(2, W - 3), A = L * W - cl * cw;
      return Q(`An L-shape is made by cutting a ${cl} cm by ${cw} cm rectangle from the corner of a ${L} cm by ${W} cm rectangle. What is the area of the L-shape?`, choices(r, `${A} cm²`, [`${L * W} cm²`, `${L * W + cl * cw} cm²`, `${2 * (L + W)} cm²`, `${A - cl} cm²`]), 'Find the area of the big rectangle, then take away the piece that was cut out.', [`Big rectangle: ${L} × ${W} = ${L * W} cm².`, `Cut-out piece: ${cl} × ${cw} = ${cl * cw} cm².`, `${L * W} − ${cl * cw} = ${A} cm².`]); },
   r => { const L = r.int(8, 14), W = r.int(6, 12), cl = r.int(2, L - 3), cw = r.int(2, W - 3);
      return Q(`An L-shape is made by cutting a ${cl} cm by ${cw} cm rectangle from the corner of a ${L} cm by ${W} cm rectangle. What is the perimeter of the L-shape?`, choices(r, `${2 * (L + W)} cm`, [`${2 * (L + W) - 2 * (cl + cw)} cm`, `${2 * (L + W) + cl + cw} cm`, `${L * W - cl * cw} cm`, `${2 * (L + W) - cl} cm`]), 'Cutting a corner out does not change the perimeter: the two new edges are as long as the two pieces of edge removed.', [`The two new inside edges (${cl} cm and ${cw} cm) replace the two pieces of edge that were cut away.`, `So the perimeter is the same as the big rectangle: 2 × (${L} + ${W}) = ${2 * (L + W)} cm.`]); },
   r => { const b = r.int(3, 16), h = r.int(2, 12); if ((b * h) % 2) return null;
      return Q(`A triangle has a base of ${b} cm and a height of ${h} cm. What is its area?`, choices(r, `${b * h / 2} cm²`, [`${b * h} cm²`, `${b + h} cm²`, `${b * h / 4} cm²`, `${(b + h) * 2} cm²`]), 'A triangle is half of a rectangle with the same base and height.', [`Base × height = ${b} × ${h} = ${b * h}.`, `Half of ${b * h} = ${b * h / 2} cm².`]); }]
]);

// ------------------------------------------------------------ angles
T.angles = (r, d) => pickLevel(r, d, [
  [r => { const a = r.int(20, 160);
      return Q(`Two angles sit together on a straight line. One is ${a}°. What is the other?`, choices(r, `${180 - a}°`, [`${360 - a}°`, `${90 - a > 0 ? 90 - a : a + 10}°`, `${a}°`, `${180 - a + 10}°`]), 'Angles on a straight line add up to 180°.', [`180° − ${a}° = ${180 - a}°.`]); },
   r => { const a = r.int(15, 75);
      return Q(`A right angle is split into two angles. One is ${a}°. What is the other?`, choices(r, `${90 - a}°`, [`${180 - a}°`, `${a}°`, `${100 - a}°`, `${90 + a}°`]), 'A right angle is 90°.', [`90° − ${a}° = ${90 - a}°.`]); }],
  [r => { const a = r.int(30, 100), b = r.int(20, 150 - a);
      return Q(`Two angles in a triangle are ${a}° and ${b}°. What is the third angle?`, choices(r, `${180 - a - b}°`, [`${360 - a - b}°`, `${180 - a}°`, `${a + b}°`, `${170 - a - b}°`]), 'The angles in a triangle add up to 180°.', [`${a}° + ${b}° = ${a + b}°.`, `180° − ${a + b}° = ${180 - a - b}°.`]); },
   r => { const a = r.int(60, 150), b = r.int(40, 280 - a), c = 360 - a - b; if (c < 20) return null;
      return Q(`Three angles meet at a point. Two of them are ${a}° and ${b}°. What is the third?`, choices(r, `${c}°`, [`${180 - a - b > 0 ? 180 - a - b : c + 20}°`, `${c + 10}°`, `${a + b}°`, `${c - 10}°`]), 'Angles around a point add up to 360°.', [`${a}° + ${b}° = ${a + b}°.`, `360° − ${a + b}° = ${c}°.`]); }],
  [r => { const top = r.int(20, 140); if (top % 2) return null; const base = (180 - top) / 2;
      return Q(`An isosceles triangle has one angle of ${top}° between its two equal sides. What size is each of the other two angles?`, choices(r, `${base}°`, [`${top}°`, `${180 - top}°`, `${base + 10}°`, `${(360 - top) / 2}°`]), 'In an isosceles triangle the two base angles are equal.', [`180° − ${top}° = ${180 - top}°.`, `Share it equally: ${180 - top}° ÷ 2 = ${base}°.`]); },
   r => { const n = r.pick([5, 6, 8, 10, 12]), each = 180 - 360 / n, name = { 5: 'pentagon', 6: 'hexagon', 8: 'octagon', 10: 'decagon', 12: 'dodecagon' }[n];
      return Q(`What is the size of each inside angle of a regular ${name}?`, choices(r, `${each}°`, [`${360 / n}°`, `${180 / n * (n - 2) + 10}°`, `${each - 12}°`, `${90}°`]), `A ${name} has ${n} sides. Split it into triangles from one corner.`, [`It splits into ${n - 2} triangles, so the angles add up to ${n - 2} × 180° = ${(n - 2) * 180}°.`, `${(n - 2) * 180}° ÷ ${n} = ${each}°.`]); },
   r => { const a = r.int(60, 120), b = r.int(60, 120), c = r.int(50, 120), dd = 360 - a - b - c; if (dd < 40 || dd > 170) return null;
      return Q(`Three angles of a quadrilateral are ${a}°, ${b}° and ${c}°. What is the fourth angle?`, choices(r, `${dd}°`, [`${180 - (a + b + c) % 180}°`, `${dd + 10}°`, `${dd - 10}°`, `${540 - a - b - c}°`]), 'The angles in a quadrilateral add up to 360°.', [`${a} + ${b} + ${c} = ${a + b + c}.`, `360° − ${a + b + c}° = ${dd}°.`]); }]
]);

// ------------------------------------------------------------ 2D and 3D shapes
T.shapes = (r, d) => pickLevel(r, d, [
  [r => { const [nm, n] = r.pick([['pentagon', 5], ['hexagon', 6], ['octagon', 8], ['heptagon', 7], ['quadrilateral', 4], ['decagon', 10]]);
      return Q(`How many sides does ${an(nm)} have?`, choices(r, n, [n + 1, n - 1, n + 2, n * 2]), 'Think of the start of the word: penta = 5, hexa = 6, hepta = 7, octa = 8, deca = 10.', [`A ${nm} has ${n} sides.`]); },
   r => { const n = r.pick([3, 4, 5, 6, 8]), nm = { 3: 'equilateral triangle', 4: 'square', 5: 'regular pentagon', 6: 'regular hexagon', 8: 'regular octagon' }[n];
      return Q(`How many lines of symmetry does ${an(nm)} have?`, choices(r, n, [n - 1, n + 1, n * 2, 1]), 'A regular shape has as many lines of symmetry as it has sides.', [`${an(nm).replace(/^a/, 'A')} has ${n} equal sides, so it has ${n} lines of symmetry.`]); }],
  [r => { const n = r.pick([3, 4, 5, 6, 8]), base = { 3: 'triangular', 4: 'square-based', 5: 'pentagonal', 6: 'hexagonal', 8: 'octagonal' }[n], what = r.pick(['faces', 'edges', 'vertices']), ans = what === 'faces' ? n + 2 : what === 'edges' ? 3 * n : 2 * n;
      return Q(`How many ${what} does ${an(base)} prism have?`, choices(r, ans, [what === 'faces' ? n + 1 : what === 'edges' ? 2 * n : n + 1, ans + 1, ans - 1, ans + 2]), `A prism has two identical ends joined by rectangles. Each end here has ${n} sides.`, what === 'faces' ? [`2 end faces + ${n} rectangles = ${n + 2} faces.`] : what === 'edges' ? [`${n} edges on each end (${2 * n}) + ${n} edges joining them = ${3 * n}.`] : [`${n} corners on each end: 2 × ${n} = ${2 * n} vertices.`]); },
   r => { const n = r.pick([3, 4, 5, 6]), base = { 3: 'triangle-based', 4: 'square-based', 5: 'pentagon-based', 6: 'hexagon-based' }[n], what = r.pick(['faces', 'edges', 'vertices']), ans = what === 'faces' ? n + 1 : what === 'edges' ? 2 * n : n + 1;
      return Q(`How many ${what} does ${an(base)} pyramid have?`, choices(r, ans, [what === 'edges' ? 3 * n : n + 2, ans + 1, ans - 1, n]), `A pyramid has a base with ${n} sides and triangles that meet at the top.`, what === 'faces' ? [`1 base + ${n} triangles = ${n + 1} faces.`] : what === 'edges' ? [`${n} edges round the base + ${n} going up to the top = ${2 * n}.`] : [`${n} corners on the base + 1 at the top = ${n + 1}.`]); }],
  [r => { const opts = [['It has 4 right angles and 4 equal sides', 'square'], ['It has exactly one pair of parallel sides', 'trapezium'], ['It has 4 equal sides but no right angles', 'rhombus'], ['It has two pairs of equal sides next to each other, and one line of symmetry', 'kite'], ['It has two pairs of parallel sides but no right angles, and its sides are not all equal', 'parallelogram']], [clue, ans] = r.pick(opts);
      return Q(`Which quadrilateral is this? ${clue}.`, choices(r, ans, ['square', 'rectangle', 'rhombus', 'kite', 'trapezium', 'parallelogram'].filter(x => x !== ans)), 'Think about parallel sides, equal sides and right angles.', [`${clue}: that describes a ${ans}.`]); },
   r => { const s = r.int(2, 6), what = r.pick(['volume', 'surface area']), ans = what === 'volume' ? s ** 3 : 6 * s * s;
      return Q(`A cube has edges ${s} cm long. What is its ${what}?`, choices(r, what === 'volume' ? `${ans} cm³` : `${ans} cm²`, what === 'volume' ? [`${s * s} cm³`, `${6 * s * s} cm³`, `${3 * s} cm³`, `${s ** 3 + s} cm³`] : [`${s ** 3} cm²`, `${4 * s * s} cm²`, `${s * s} cm²`, `${6 * s} cm²`]), what === 'volume' ? 'Volume = length × width × height.' : 'A cube has 6 square faces.', what === 'volume' ? [`${s} × ${s} × ${s} = ${ans} cm³.`] : [`Each face is ${s} × ${s} = ${s * s} cm².`, `6 faces: 6 × ${s * s} = ${ans} cm².`]); }]
]);

// ------------------------------------------------------------ coordinates
const pt = (x, y) => `(${x}, ${y})`;
T.coordinates = (r, d) => pickLevel(r, d, [
  [r => { const x = r.int(1, 8), y = r.int(1, 8), dx = r.int(1, 5) * r.pick([1, -1]), dy = r.int(1, 5) * r.pick([1, -1]); if (x + dx < 0 || y + dy < 0) return null;
      return Q(`Point A is at ${pt(x, y)}. It moves ${Math.abs(dx)} ${dx > 0 ? 'right' : 'left'} and ${Math.abs(dy)} ${dy > 0 ? 'up' : 'down'}. Where is it now?`, choices(r, pt(x + dx, y + dy), [pt(x + dy, y + dx), pt(x - dx, y - dy), pt(y + dy, x + dx), pt(x + dx, y - dy)]), 'Right and left change the first number. Up and down change the second.', [`x: ${x} ${dx > 0 ? '+' : '−'} ${Math.abs(dx)} = ${x + dx}.`, `y: ${y} ${dy > 0 ? '+' : '−'} ${Math.abs(dy)} = ${y + dy}.`]); }],
  [r => { const x1 = r.int(1, 4), y1 = r.int(1, 4), w = r.int(2, 5), h = r.int(2, 5);
      return Q(`Three corners of a rectangle are ${pt(x1, y1)}, ${pt(x1 + w, y1)} and ${pt(x1 + w, y1 + h)}. Where is the fourth corner?`, choices(r, pt(x1, y1 + h), [pt(x1 + h, y1 + w), pt(x1 + w, y1 + h + 1), pt(y1 + h, x1), pt(x1 + w, y1 - h)]), 'Opposite sides of a rectangle line up: the fourth corner shares an x with one corner and a y with another.', [`The left side is at x = ${x1}. The top is at y = ${y1 + h}.`, `So the fourth corner is ${pt(x1, y1 + h)}.`]); },
   r => { const x = r.int(1, 7), y = r.int(1, 7), axis = r.pick(['x', 'y']);
      return Q(`Point P is at ${pt(x, y)}. It is reflected in the ${axis}-axis. Where is it now?`, choices(r, axis === 'x' ? pt(x, -y) : pt(-x, y), [axis === 'x' ? pt(-x, y) : pt(x, -y), pt(-x, -y), pt(y, x), pt(x, y)]), `Reflecting in the ${axis}-axis flips the point to the other side of that axis.`, [axis === 'x' ? 'Reflecting in the x-axis keeps x the same and makes y negative.' : 'Reflecting in the y-axis keeps y the same and makes x negative.']); }],
  [r => { const x1 = r.int(-6, 4) * 1, y1 = r.int(-6, 4), x2 = x1 + 2 * r.int(1, 4), y2 = y1 + 2 * r.int(1, 4);
      return Q(`What is the midpoint of ${pt(x1, y1)} and ${pt(x2, y2)}?`, choices(r, pt((x1 + x2) / 2, (y1 + y2) / 2), [pt(x2 - x1, y2 - y1), pt((x2 - x1) / 2, (y2 - y1) / 2), pt(x1 + x2, y1 + y2), pt((x1 + x2) / 2, (y1 + y2) / 2 + 1)]), 'The midpoint is halfway: add the x values and halve, then do the same for y.', [`x: (${x1} + ${x2}) ÷ 2 = ${(x1 + x2) / 2}.`, `y: (${y1} + ${y2}) ÷ 2 = ${(y1 + y2) / 2}.`]); },
   r => { const x = r.int(-5, 5), y = r.int(-5, 5), dx = r.int(2, 7) * r.pick([1, -1]), dy = r.int(2, 7) * r.pick([1, -1]);
      return Q(`A point at ${pt(x, y)} is translated ${Math.abs(dx)} ${dx > 0 ? 'right' : 'left'} and ${Math.abs(dy)} ${dy > 0 ? 'up' : 'down'}. What are its new coordinates?`, choices(r, pt(x + dx, y + dy), [pt(x - dx, y - dy), pt(x + dy, y + dx), pt(x + dx, y - dy), pt(-(x + dx), y + dy)]), 'Be careful crossing zero on each axis.', [`x: ${x} ${dx > 0 ? '+' : '−'} ${Math.abs(dx)} = ${x + dx}.`, `y: ${y} ${dy > 0 ? '+' : '−'} ${Math.abs(dy)} = ${y + dy}.`]); }]
]);

// ------------------------------------------------------------ data handling
T.data = (r, d) => pickLevel(r, d, [
  [r => { const v = Array.from({ length: 6 }, () => r.int(2, 30)), ans = Math.max(...v) - Math.min(...v);
      return Q(`What is the range of these scores? ${v.join(', ')}`, choices(r, ans, [Math.max(...v), Math.max(...v) + Math.min(...v), v[v.length - 1] - v[0] > 0 ? v[v.length - 1] - v[0] : ans + 3, ans + 1]), 'Range = biggest − smallest.', [`Biggest: ${Math.max(...v)}. Smallest: ${Math.min(...v)}.`, `${Math.max(...v)} − ${Math.min(...v)} = ${ans}.`]); },
   r => { const m = r.int(2, 20), v = r.shuffle([m, m, m, r.int(21, 30), r.int(1, 1) + m + 1, m + 3, r.int(31, 40)].slice(0, 6));
      return Q(`What is the mode of these numbers? ${v.join(', ')}`, choices(r, m, [Math.max(...v), Math.min(...v), m + 1, v.length]), 'The mode is the number that appears most often.', [`${m} appears ${v.filter(x => x === m).length} times, more than any other number.`]); }],
  [r => { const n = r.pick([3, 4, 5]), mean = r.int(4, 20), v = Array.from({ length: n - 1 }, () => r.int(mean - 4, mean + 4)), last = mean * n - v.reduce((a, b) => a + b, 0); if (last < 0) return null; const all = r.shuffle(v.concat([last]));
      return Q(`What is the mean of ${all.join(', ')}?`, choices(r, mean, [mean * n, Math.round(all.reduce((a, b) => a + b, 0) / (n + 1)), mean + 1, all.slice().sort((a, b) => a - b)[Math.floor(n / 2)] === mean ? mean + 2 : all.slice().sort((a, b) => a - b)[Math.floor(n / 2)]]), 'Mean = total ÷ how many numbers there are.', [`Total: ${all.join(' + ')} = ${mean * n}.`, `${mean * n} ÷ ${n} = ${mean}.`]); },
   r => { const v = Array.from({ length: r.pick([5, 7]) }, () => r.int(1, 40)), s = v.slice().sort((a, b) => a - b), ans = s[Math.floor(s.length / 2)];
      return Q(`What is the median of ${v.join(', ')}?`, choices(r, ans, [v[Math.floor(v.length / 2)], Math.round(v.reduce((a, b) => a + b, 0) / v.length), s[Math.floor(s.length / 2) + 1], s[Math.floor(s.length / 2) - 1]]), 'Put the numbers in order first, then find the middle one.', [`In order: ${s.join(', ')}.`, `The middle number is ${ans}.`]); }],
  [r => { const n = r.pick([4, 5]), mean = r.int(6, 15), v = Array.from({ length: n - 1 }, () => r.int(mean - 5, mean + 5)), miss = mean * n - v.reduce((a, b) => a + b, 0); if (miss < 1) return null;
      return Q(`The mean of ${n} numbers is ${mean}. ${n - 1 === 3 ? 'Three' : 'Four'} of them are ${v.join(', ')}. What is the missing number?`, choices(r, miss, [mean, mean * n, miss + n, Math.round(v.reduce((a, b) => a + b, 0) / (n - 1))]), 'Mean × how many = total. Then find what is missing from the total.', [`The total must be ${mean} × ${n} = ${mean * n}.`, `The others add up to ${v.reduce((a, b) => a + b, 0)}.`, `${mean * n} − ${v.reduce((a, b) => a + b, 0)} = ${miss}.`]); },
   r => { const tot = r.pick([20, 24, 30, 36, 40, 60]), parts = [[1, 2], [1, 4], [1, 3], [1, 6], [1, 5], [3, 4], [2, 3]].filter(f => tot % f[1] === 0), f = r.pick(parts), deg = 360 * f[0] / f[1], n = tot * f[0] / f[1], sport = r.pick(['football', 'swimming', 'tennis', 'netball']);
      return Q(`In a pie chart of ${tot} children's favourite sports, the ${sport} slice has an angle of ${deg}°. How many children chose ${sport}?`, choices(r, n, [deg, Math.round(deg / 10), tot - n, n + 2]), 'The whole circle (360°) stands for all the children.', [`${deg}° out of 360° is ${P(f[0], f[1])} of the circle.`, `${P(f[0], f[1])} of ${tot} = ${n}.`]); }]
]);

// ------------------------------------------------------------ word problems (mixed, several steps)
T.word_problems = (r, d) => pickLevel(r, d, [
  [r => { const [x] = r.sample(NAMES, 1), a = r.int(20, 80), b = r.int(5, 30), c = r.int(5, 20);
      return Q(`${x} has ${a} stickers. ${x} is given ${b} more, then gives ${c} to a friend. How many stickers does ${x} have now?`, choices(r, a + b - c, [a + b + c, a - b - c > 0 ? a - b - c : a + c, a + b, a - c]), 'Do one step at a time.', [`${a} + ${b} = ${a + b}.`, `${a + b} − ${c} = ${a + b - c}.`]); },
   r => { const rows = r.int(3, 9), per = r.int(4, 12), extra = r.int(1, 9);
      return Q(`A hall has ${rows} rows of ${per} chairs, plus ${extra} chairs at the front. How many chairs are there altogether?`, choices(r, rows * per + extra, [rows * per, rows + per + extra, rows * (per + extra), rows * per - extra]), 'Multiply for the rows, then add the extra chairs.', [`${rows} × ${per} = ${rows * per}.`, `${rows * per} + ${extra} = ${rows * per + extra}.`]); }],
  [r => { const tot = r.int(4, 12) * 100, spent = r.int(1, 3), each = r.int(120, 380), left = tot - spent * each; if (left <= 0) return null;
      return Q(`Mia has ${pounds(tot)}. She buys ${spent} book${spent > 1 ? 's' : ''} at ${pounds(each)} each. How much money does she have left?`, choices(r, pounds(left), [pounds(tot - each), pounds(spent * each), pounds(left + 100), pounds(left - 10)]), 'Find the total cost first, then take it away.', [`${spent} × ${pounds(each)} = ${pounds(spent * each)}.`, `${pounds(tot)} − ${pounds(spent * each)} = ${pounds(left)}.`]); },
   r => { const laps = r.int(3, 9), len = r.int(2, 9) * 50, days = r.int(2, 5);
      return Q(`Sam runs ${laps} laps of a ${len} m track each day for ${days} days. How far does he run altogether, in kilometres?`, choices(r, `${dp(laps * len * days / 1000, 3)} km`, [`${laps * len * days} km`, `${dp(laps * len / 1000, 3)} km`, `${dp(laps * len * days / 100, 2)} km`, `${dp((laps + days) * len / 1000, 3)} km`]), 'Work out the metres first, then change to kilometres.', [`Each day: ${laps} × ${len} = ${laps * len} m.`, `${days} days: ${laps * len} × ${days} = ${N(laps * len * days)} m.`, `${N(laps * len * days)} m = ${dp(laps * len * days / 1000, 3)} km.`]); }],
  [r => { const tot = r.int(6, 20) * 12, a = r.pick([[1, 3], [1, 4], [2, 3], [1, 6]]), b = r.pick([[1, 2], [1, 4], [1, 3]]), first = tot * a[0] / a[1], rest = tot - first, second = rest * b[0] / b[1], left = rest - second; if (left % 1 || second % 1) return null;
      return Q(`A shop has ${tot} cupcakes. It sells ${P(...a)} of them in the morning and ${P(...b)} of the rest in the afternoon. How many are left?`, choices(r, left, [tot - first - tot * b[0] / b[1], rest, second, left + first]), 'Work out the morning sales first. The afternoon fraction is of what was left, not of the start.', [`Morning: ${P(...a)} of ${tot} = ${first}. Left: ${rest}.`, `Afternoon: ${P(...b)} of ${rest} = ${second}.`, `${rest} − ${second} = ${left}.`]); },
   r => { const price = r.int(2, 9) * 50, n = r.int(4, 12), p = r.pick([10, 20, 25, 50]), full = price * n, ans = full - full * p / 100;
      return Q(`Tickets cost ${pounds(price)} each. A group buys ${n} tickets and gets ${p}% off the total. How much do they pay?`, choices(r, pounds(ans), [pounds(full), pounds(full * p / 100), pounds(full - p * 100 > 0 ? full - p * 100 : full + 100), pounds((price - price * p / 100) * (n - 1))]), 'Find the full total, then work out the discount and take it off.', [`Full price: ${n} × ${pounds(price)} = ${pounds(full)}.`, `${p}% of ${pounds(full)} = ${pounds(full * p / 100)}.`, `${pounds(full)} − ${pounds(full * p / 100)} = ${pounds(ans)}.`]); }]
]);

window.GENCORE.register('maths', T);
})();
