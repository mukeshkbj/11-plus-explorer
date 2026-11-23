/* Non-verbal reasoning puzzle engine.
   Makes fresh NVR questions with pictures and step-by-step explanations, for all ten NVR topics.
   Every question comes from a seed, so the same id always rebuilds the same puzzle (history and review keep working).
   Id format: g-nvr-<topic>-<level>-<seed>. Each generator returns { q, svg, of (five option pictures) or opts, a, hint, steps }. */
(function () {
'use strict';

// ---------------------------------------------------------------- seeded random numbers
function rng(seed) {
  let a = seed >>> 0;
  const r = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  r.pick = arr => arr[Math.floor(r() * arr.length)];
  r.shuffle = arr => { arr = arr.slice(); for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  r.sample = (arr, k) => r.shuffle(arr).slice(0, k);
  return r;
}

// ---------------------------------------------------------------- drawing
const INK = '#1d2b3a', FRAME = '#c5cedb';
const FILL = { white: '#fff', grey: '#9aa5b1', black: INK };
const FILL_WORD = { white: 'white', grey: 'grey', black: 'black', stripes: 'striped', dots: 'spotted' };
let pid = 0;
// Fill attribute, with stripe and spot patterns defined inline so each picture stands alone.
// Patterns are drawn inside a shape scaled by r, so their size is divided by r to keep stripes and spots the same size on every shape.
function paint(f, r) {
  if (FILL[f]) return { a: FILL[f], defs: '' };
  const id = 'p' + (++pid) + Math.floor(Math.random() * 1e6), k = 1 / (r || 1), w = rnd3(5 * k);
  if (f === 'stripes') return { a: `url(#${id})`, defs: `<defs><pattern id="${id}" width="${w}" height="${w}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${w}" height="${w}" fill="#fff"/><line x1="0" y1="0" x2="0" y2="${w}" stroke="${INK}" stroke-width="${rnd3(1.8 * k)}"/></pattern></defs>` };
  return { a: `url(#${id})`, defs: `<defs><pattern id="${id}" width="${w}" height="${w}" patternUnits="userSpaceOnUse"><rect width="${w}" height="${w}" fill="#fff"/><circle cx="${rnd3(2.5 * k)}" cy="${rnd3(2.5 * k)}" r="${rnd3(1.1 * k)}" fill="${INK}"/></pattern></defs>` };
}
const rnd3 = v => Math.round(v * 1000) / 1000;
const reg = (n, start) => Array.from({ length: n }, (_, i) => { const t = (start === undefined ? -90 : start) * Math.PI / 180 + i * 2 * Math.PI / n; return [Math.cos(t), Math.sin(t)]; });
// Unit shapes centred on (0,0), radius about 1. "sides" is used by rules that count sides (curved shapes have none).
const SHAPES = {
  triangle: { pts: reg(3), sides: 3, name: 'triangle' },
  square: { pts: [[-.8, -.8], [.8, -.8], [.8, .8], [-.8, .8]], sides: 4, name: 'square' },
  rectangle: { pts: [[-1, -.55], [1, -.55], [1, .55], [-1, .55]], sides: 4, name: 'rectangle' },
  diamond: { pts: [[0, -1], [.7, 0], [0, 1], [-.7, 0]], sides: 4, name: 'rhombus' },
  kite: { pts: [[0, -1], [.62, -.25], [0, 1], [-.62, -.25]], sides: 4, name: 'kite' },
  trapezium: { pts: [[-.5, -.6], [.5, -.6], [1, .6], [-1, .6]], sides: 4, name: 'trapezium' },
  parallelogram: { pts: [[-.55, -.6], [1, -.6], [.55, .6], [-1, .6]], sides: 4, name: 'parallelogram' },
  pentagon: { pts: reg(5), sides: 5, name: 'pentagon' },
  hexagon: { pts: reg(6), sides: 6, name: 'hexagon' },
  heptagon: { pts: reg(7), sides: 7, name: 'heptagon' },
  octagon: { pts: reg(8, -67.5), sides: 8, name: 'octagon' },
  star: { pts: Array.from({ length: 10 }, (_, i) => { const t = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? .45 : 1; return [r * Math.cos(t), r * Math.sin(t)]; }), sides: 10, name: 'star' },
  cross: { pts: [[-.3, -1], [.3, -1], [.3, -.3], [1, -.3], [1, .3], [.3, .3], [.3, 1], [-.3, 1], [-.3, .3], [-1, .3], [-1, -.3], [-.3, -.3]], sides: 12, name: 'cross' },
  arrow: { pts: [[0, -1], [.75, -.15], [.28, -.15], [.28, 1], [-.28, 1], [-.28, -.15], [-.75, -.15]], sides: 7, name: 'arrow' },
  // shapes with no mirror symmetry, for rotation and reflection puzzles
  flag: { pts: [[-.55, -1], [.75, -.62], [-.3, -.2], [-.3, 1], [-.55, 1]], sides: 5, name: 'flag', chiral: true },
  ell: { pts: [[-.65, -1], [-.2, -1], [-.2, .45], [.75, .45], [.75, .9], [-.65, .9]], sides: 6, name: 'L shape', chiral: true },
  boot: { pts: [[-.6, -1], [0, -1], [0, .2], [.85, .45], [.85, 1], [-.6, 1]], sides: 6, name: 'boot', chiral: true },
  hook: { pts: [[-.2, -1], [.75, -1], [.75, -.5], [.2, -.5], [.2, 1], [-.75, 1], [-.75, .5], [-.2, .5]], sides: 8, name: 'S shape', chiral: true },
  wedge: { pts: [[-.8, -.9], [.9, .9], [-.8, .9]], sides: 3, name: 'right-angled triangle', chiral: true },
  // curved shapes
  circle: { circle: true, sides: 0, name: 'circle', curved: true },
  semicircle: { path: 'M-1 .45 A1 1 0 0 1 1 .45 Z', sides: 0, name: 'semicircle', curved: true },
  oval: { ellipse: [1, .62], sides: 0, name: 'oval', curved: true },
  crescent: { path: 'M.2 -.98 A1 1 0 1 0 .2 .98 A.78 .78 0 1 1 .2 -.98 Z', sides: 0, name: 'crescent', curved: true },
  heart: { path: 'M0 .95 C-.9 .3 -1.05 -.2 -.75 -.62 C-.45 -1 -.1 -.85 0 -.5 C.1 -.85 .45 -1 .75 -.62 C1.05 -.2 .9 .3 0 .95 Z', sides: 0, name: 'heart', curved: true }
};
const POLY4 = ['square', 'rectangle', 'diamond', 'kite', 'trapezium', 'parallelogram'];
const REGULAR = ['triangle', 'square', 'pentagon', 'hexagon', 'heptagon', 'octagon'];
const BASIC = ['triangle', 'square', 'pentagon', 'hexagon', 'circle', 'star', 'diamond', 'cross', 'heart', 'octagon'];
const CHIRAL = ['flag', 'ell', 'boot', 'hook', 'wedge'];
const CURVED = ['circle', 'semicircle', 'oval', 'crescent', 'heart'];
const sname = s => SHAPES[s].name;
const rnd = v => Math.round(v * 10) / 10;

// One element: { s: shape, x, y, r, rot (degrees clockwise), f: fill, m: mirrored, sw: stroke width }
function el(e) {
  const S = SHAPES[e.s], p = paint(e.f || 'white', e.r), sw = e.sw || 2;
  const tf = `translate(${rnd(e.x)} ${rnd(e.y)}) rotate(${rnd(e.rot || 0)}) scale(${e.m ? -e.r : e.r} ${e.r})`;
  const st = `fill="${p.a}" stroke="${INK}" stroke-width="${rnd(sw / e.r)}" stroke-linejoin="round"`;
  let body;
  if (S.circle) body = `<circle r="1" ${st}/>`;
  else if (S.ellipse) body = `<ellipse rx="${S.ellipse[0]}" ry="${S.ellipse[1]}" ${st}/>`;
  else if (S.path) body = `<path d="${S.path}" ${st}/>`;
  else body = `<polygon points="${S.pts.map(q => q.map(rnd).join(',')).join(' ')}" ${st}/>`;
  return `<g transform="${tf}">${p.defs}${body}</g>`;
}
const dot = (x, y, r, f) => `<circle cx="${rnd(x)}" cy="${rnd(y)}" r="${r || 2.6}" fill="${FILL[f || 'black']}" stroke="${INK}" stroke-width="1"/>`;
const line = (x1, y1, x2, y2, w, dash) => `<line x1="${rnd(x1)}" y1="${rnd(y1)}" x2="${rnd(x2)}" y2="${rnd(y2)}" stroke="${INK}" stroke-width="${w || 2}" stroke-linecap="round"${dash ? ' stroke-dasharray="4 3"' : ''}/>`;
const frame = (x, y, w, h) => `<rect x="${x + 1}" y="${y + 1}" width="${(w || 60) - 2}" height="${(h || 60) - 2}" rx="6" fill="#fff" stroke="${FRAME}" stroke-width="1.5"/>`;
// A figure is a list of elements plus optional dots/lines; drawn inside a 60 x 60 box at offset (ox, oy).
function draw(fig, ox, oy) {
  ox = ox || 0; oy = oy || 0;
  let s = '';
  (fig.els || []).forEach(e => { s += el(Object.assign({}, e, { x: e.x + ox, y: e.y + oy })); });
  (fig.dots || []).forEach(d => { s += dot(d[0] + ox, d[1] + oy, d[2], d[3]); });
  (fig.lines || []).forEach(l => { s += line(l[0] + ox, l[1] + oy, l[2] + ox, l[3] + oy, l[4], l[5]); });
  if (fig.raw) s += `<g transform="translate(${ox} ${oy})">${fig.raw}</g>`;
  return s;
}
const svgOpen = (w, h, k) => `<svg viewBox="0 0 ${w} ${h}" width="${rnd(w * (k || 1.25))}" height="${rnd(h * (k || 1.25))}" role="img">`;
const cell = fig => svgOpen(60, 60) + frame(0, 0) + draw(fig) + '</svg>';
const qmark = (x, y) => frame(x, y) + `<text x="${x + 30}" y="${y + 40}" text-anchor="middle" font-size="28" font-weight="700" fill="#5b6b7c" font-family="system-ui,sans-serif">?</text>`;
// A row of figures in boxes, optionally ending in a "?" box.
function strip(figs, withQ, gap) {
  gap = gap || 8;
  const n = figs.length + (withQ ? 1 : 0), w = n * 60 + (n - 1) * gap;
  let s = svgOpen(w, 60);
  figs.forEach((f, i) => { s += frame(i * (60 + gap), 0) + draw(f, i * (60 + gap), 0); });
  if (withQ) s += qmark(figs.length * (60 + gap), 0);
  return s + '</svg>';
}
// How a shape looks the same: turning by rotSym degrees, or flipping (vm: about its upright axis, hm: about its flat axis).
const SYMS = { circle: [1, 1], triangle: [120, 1], square: [90, 1], rectangle: [180, 1], diamond: [180, 1], kite: [360, 1], trapezium: [360, 1], parallelogram: [180, 0], pentagon: [72, 1], hexagon: [60, 1], heptagon: [360 / 7, 1], octagon: [45, 1], star: [72, 1], cross: [90, 1], arrow: [360, 1], flag: [360, 0], ell: [360, 0], boot: [360, 0], hook: [180, 0], wedge: [360, 0], semicircle: [360, 1], oval: [180, 1], crescent: [360, 0, 1], heart: [360, 1] };
// A key for what a figure looks like, so two figures that look identical are treated as the same.
function canon(e) {
  const [rs, vm, hm] = SYMS[e.s] || [360, 0]; let rot = e.rot || 0, m = !!e.m;
  if (m && vm) m = false; else if (m && hm) { m = false; rot += 180; }
  rot = rs === 1 ? 0 : Math.round(((rot % rs) + rs) % rs * 10) / 10; if (Math.abs(rot - rs) < .2) rot = 0;
  return [e.s, Math.round(e.x), Math.round(e.y), Math.round(e.r * 10) / 10, rot, m ? 1 : 0, e.f || 'white'].join(':');
}
const key = fig => fig && fig.els ? JSON.stringify([fig.els.map(canon).sort(), fig.dots || [], fig.lines || [], fig.raw || '']) : JSON.stringify(fig);
const LET = 'ABCDE';

// Puts the right answer among four distractors in a random place. Distractors must all look different from each other and from the answer.
function options(r, right, wrongs, render) {
  const seen = new Set([key(right)]), pool = [];
  for (const w of wrongs) { const k = key(w.fig || w); if (!seen.has(k)) { seen.add(k); pool.push(w); } if (pool.length === 4) break; }
  if (pool.length < 4) return null;
  const a = r.int(0, 4), list = pool.slice();
  list.splice(a, 0, { fig: right, why: null });
  return { of: list.map(x => (render || cell)(x.fig || x)), a, why: list.map(x => x.why || null) };
}
const result = (q, svg, o, hint, steps) => o && { q, svg, of: o.of, opts: ['A', 'B', 'C', 'D', 'E'], a: o.a, hint, steps: steps.concat([`The answer is ${LET[o.a]}.`]) };

// Places n items in a box without overlap, using a fixed grid of spots.
const SPOTS = [[18, 18], [42, 18], [18, 42], [42, 42], [30, 30], [30, 14], [30, 46], [14, 30], [46, 30]];
function spots(r, n) { return n === 1 ? [[30, 30]] : n === 2 ? r.pick([[[18, 30], [42, 30]], [[30, 18], [30, 42]], [[19, 19], [41, 41]]]) : n === 3 ? r.pick([[[30, 15], [17, 42], [43, 42]], [[15, 30], [30, 30], [45, 30]], [[17, 18], [43, 18], [30, 43]]]) : r.shuffle(SPOTS.slice(0, 4).concat(n > 4 ? [[30, 30]] : [])).slice(0, n); }

// ================================================================ odd one out
// Each rule gives the five figures (four that follow the rule and one that breaks it) and the explanation.
// After building, every other feature is checked so that no second "odd one out" sneaks in by accident.
function oddOneOut(r, d) {
  const rules = d === 1 ? ['fill', 'sides4', 'count'] : d === 2 ? ['curved', 'innerSame', 'dotsSides', 'inside', 'count2'] : ['mirror', 'sidesPlus', 'dotsSides3', 'shadedHalf'];
  for (let tries = 0; tries < 40; tries++) {
    const rule = r.pick(rules), odd = r.int(0, 4);
    const F = [], A = [];   // figures and their feature values (for the safety check)
    let say, hint = 'Find something that four figures share. Check shape, shading, number, size and direction one at a time.';
    const fills = ['white', 'grey', 'black', 'stripes', 'dots'];
    if (rule === 'fill') {
      const shapes = r.sample(BASIC, 5), f = r.pick(fills), g = r.pick(fills.filter(x => x !== f));
      for (let i = 0; i < 5; i++) { const fl = i === odd ? g : f; F.push({ els: [{ s: shapes[i], x: 30, y: 30, r: 17, f: fl, rot: SHAPES[shapes[i]].chiral ? r.pick([0, 90]) : 0 }] }); A.push({ shape: shapes[i], fill: fl }); }
      say = [`The shapes are all different, so shape is not the rule.`, `Look at the shading: four are ${FILL_WORD[f]} and one is ${FILL_WORD[g]}.`];
    } else if (rule === 'sides4') {
      const four = r.sample(POLY4, 4), other = r.pick(['triangle', 'pentagon', 'hexagon']), fl = r.sample(fills, 5);
      let k = 0;
      for (let i = 0; i < 5; i++) { const s = i === odd ? other : four[k++]; F.push({ els: [{ s, x: 30, y: 30, r: 18, f: fl[i], rot: r.pick([0, 0, 90]) }] }); A.push({ shape: s, fill: fl[i] }); }
      say = ['Every figure has a different shading, so shading is not the rule.', `Count the sides. Four shapes have 4 sides. The ${sname(other)} has ${SHAPES[other].sides}.`];
    } else if (rule === 'count' || rule === 'count2') {
      const n = r.int(2, 4), m = r.pick([n - 1, n + 1].filter(x => x >= 1 && x <= 5)), shapes = r.sample(['circle', 'square', 'triangle', 'star', 'heart', 'diamond', 'pentagon'], 5);
      const fl = rule === 'count2' ? r.sample(fills, 5) : Array(5).fill(r.pick(['white', 'black', 'grey']));
      for (let i = 0; i < 5; i++) { const c = i === odd ? m : n; F.push({ els: spots(r, c).map(p => ({ s: shapes[i], x: p[0], y: p[1], r: c > 3 ? 7 : 8.5, f: fl[i] })) }); A.push({ shape: shapes[i], fill: fl[i] }); }
      say = [`The shapes and shading change, so look at how many shapes are in each box.`, `Four boxes have ${n} shapes. One box has ${m}.`];
    } else if (rule === 'curved') {
      const curvedOdd = r() < .5, straight = r.sample(['triangle', 'square', 'pentagon', 'hexagon', 'diamond', 'star', 'cross', 'kite'], 5), curved = r.sample(CURVED, 5), fl = r.sample(fills, 5);
      for (let i = 0; i < 5; i++) { const s = (i === odd) === curvedOdd ? curved[i] : straight[i]; F.push({ els: [{ s, x: 30, y: 30, r: 18, f: fl[i] }] }); A.push({ fill: fl[i] }); }
      say = curvedOdd ? ['The shading is different every time.', 'Four shapes are made only of straight lines. The odd one out has a curved edge.'] : ['The shading is different every time.', 'Four shapes have curved edges. The odd one out is made only of straight lines.'];
    } else if (rule === 'innerSame') {
      const shapes = r.sample(['circle', 'square', 'triangle', 'hexagon', 'pentagon', 'diamond', 'star'], 6), inF = r.pick(['black', 'grey']);
      for (let i = 0; i < 5; i++) { const o = shapes[i], inn = i === odd ? shapes[5] : o; F.push({ els: [{ s: o, x: 30, y: 30, r: 20, f: 'white' }, { s: inn, x: 30, y: 31, r: 8, f: inF }] }); A.push({}); }
      say = ['Each figure has a big shape with a small shape inside.', 'In four figures the small shape is the same as the big shape. In the odd one out they are different.'];
    } else if (rule === 'dotsSides' || rule === 'dotsSides3') {
      const shapes = r.sample(['triangle', 'square', 'pentagon', 'hexagon', 'diamond'], 5), fl = rule === 'dotsSides3' ? r.sample(['white', 'grey', 'stripes', 'dots', 'white'], 5) : Array(5).fill('white');
      for (let i = 0; i < 5; i++) {
        const sd = SHAPES[shapes[i]].sides, n = i === odd ? sd + r.pick([-1, 1]) : sd;
        const ds = Array.from({ length: n }, (_, k) => [8 + (k % 4) * 6, 51 + Math.floor(k / 4) * -6 + 0, 2.3]);
        F.push({ els: [{ s: shapes[i], x: 34, y: 26, r: 15, f: fl[i] }], dots: ds }); A.push({ fill: fl[i], shape: shapes[i] });
      }
      say = ['Count the sides of each shape and the dots in each box.', 'In four boxes the number of dots matches the number of sides. In the odd one out it does not.'];
    } else if (rule === 'inside') {
      const big = r.sample(['circle', 'square', 'hexagon', 'pentagon', 'octagon'], 5), small = r.sample(['triangle', 'star', 'heart', 'diamond', 'circle'], 5);
      const outOdd = r() < .5;
      for (let i = 0; i < 5; i++) {
        const out = (i === odd) === outOdd;
        F.push({ els: [{ s: big[i], x: 26, y: 26, r: 17, f: 'white' }, { s: small[i] === big[i] ? 'cross' : small[i], x: out ? 49 : 26, y: out ? 49 : 27, r: 6.5, f: 'black' }] }); A.push({});
      }
      say = outOdd ? ['Look at where the small black shape is.', 'In four figures the small shape is inside the big shape. In the odd one out it is outside.'] : ['Look at where the small black shape is.', 'In four figures the small shape is outside the big shape. In the odd one out it is inside.'];
    } else if (rule === 'mirror') {
      const s = r.pick(CHIRAL), rots = r.sample([0, 45, 90, 135, 180, 225, 270, 315], 5), f = r.pick(['white', 'grey', 'black']);
      for (let i = 0; i < 5; i++) { F.push({ els: [{ s, x: 30, y: 30, r: 19, f, rot: rots[i], m: i === odd }] }); A.push({}); }
      say = [`All five figures are the same ${sname(s)}, turned to different angles.`, 'Turning a shape never changes it, but flipping it does. Four can be turned to match each other. The odd one out is a mirror image (it has been flipped over).'];
      hint = 'Imagine turning each shape round on the table. Which one would you have to flip over to match the others?';
    } else if (rule === 'sidesPlus') {
      const good = r.shuffle([['triangle', 'square'], ['square', 'pentagon'], ['pentagon', 'hexagon'], ['hexagon', 'heptagon']]), bad = r.pick([['square', 'square'], ['pentagon', 'square'], ['triangle', 'pentagon'], ['hexagon', 'triangle']]);
      const fl = r.sample(['grey', 'black', 'stripes', 'dots', 'grey'], 5);
      let k = 0;
      for (let i = 0; i < 5; i++) { const [o, inn] = i === odd ? bad : good[k++]; F.push({ els: [{ s: o, x: 30, y: 30, r: 21, f: 'white' }, { s: inn, x: 30, y: 31, r: 8.5, f: fl[i] }] }); A.push({}); }
      say = ['Each figure has a big shape with a small shape inside. Count the sides of both.', 'In four figures the small shape has one more side than the big shape. In the odd one out it does not.'];
    } else if (rule === 'shadedHalf') {
      // four figures have exactly as many black shapes as white shapes
      const s = r.pick(['circle', 'square', 'triangle', 'star', 'heart']), n2 = r.pick([2, 4]);
      for (let i = 0; i < 5; i++) {
        const tot = i === odd ? n2 + 1 : n2, blacks = i === odd ? r.pick([Math.floor(tot / 2), Math.ceil(tot / 2)]) : tot / 2;
        const ps = spots(r, tot), fl = r.shuffle(Array.from({ length: tot }, (_, k) => k < blacks ? 'black' : 'white'));
        F.push({ els: ps.map((p, k) => ({ s, x: p[0], y: p[1], r: 7.5, f: fl[k] })) }); A.push({});
      }
      say = ['Count the black shapes and the white shapes in each box.', 'In four boxes there are the same number of black and white shapes. In the odd one out there are not.'];
    }
    // safety check: no other feature may single out exactly one figure
    let bad = false;
    ['shape', 'fill'].forEach(k => {
      if (rule === 'fill' && k === 'fill') return;
      const vals = A.map(x => x[k]); if (vals.some(v => v === undefined)) return;
      const c = {}; vals.forEach(v => { c[v] = (c[v] || 0) + 1; });
      if (Object.values(c).some(n => n === 4)) bad = true;
    });
    if (bad) continue;
    const ks = new Set(F.map(key)); if (ks.size < 5) continue;
    return { q: 'Four of these figures are alike in some way. Which one is the odd one out?', svg: '', of: F.map(cell), opts: ['A', 'B', 'C', 'D', 'E'], a: odd, hint, steps: ['Look for a rule that fits four of the figures.'].concat(say, [`The answer is ${LET[odd]}.`]) };
  }
  return null;
}

// ================================================================ sequences
// A state function gives figure i of the sequence. Distractors break one part of the rule.
function seqRules(r, d) {
  const L = [];
  const shape = r.pick(['triangle', 'square', 'pentagon', 'star', 'heart', 'circle', 'diamond']);
  const chi = r.pick(CHIRAL.concat(['arrow']));
  L.push({ lv: 1, name: 'rotate90', make: () => { const dir = r.pick([1, -1]), f = r.pick(['white', 'grey', 'black']); return { st: i => ({ els: [{ s: chi, x: 30, y: 30, r: 19, f, rot: i * 90 * dir }] }), say: [`The ${sname(chi)} turns 90° ${dir > 0 ? 'clockwise' : 'anticlockwise'} (a quarter turn) each time.`], wrong: i => [{ els: [{ s: chi, x: 30, y: 30, r: 19, f, rot: i * 90 * -dir + 90 * dir }] }, { els: [{ s: chi, x: 30, y: 30, r: 19, f, rot: (i - 1) * 90 * dir }] }, { els: [{ s: chi, x: 30, y: 30, r: 19, f, rot: i * 90 * dir, m: true }] }, { els: [{ s: chi, x: 30, y: 30, r: 19, f: f === 'black' ? 'white' : 'black', rot: i * 90 * dir }] }, { els: [{ s: chi, x: 30, y: 30, r: 19, f, rot: i * 90 * dir + 45 }] }] }; } });
  L.push({ lv: 1, name: 'count', make: () => { const st0 = r.int(1, 2), f = r.pick(['white', 'black', 'grey']); const mk = n => ({ els: (n <= 6 ? [[15, 18], [30, 18], [45, 18], [15, 42], [30, 42], [45, 42]] : []).slice(0, n).map(p => ({ s: shape, x: p[0], y: p[1], r: 6.5, f })) }); return { st: i => mk(st0 + i), say: [`One more ${sname(shape)} is added each time.`], wrong: i => [mk(st0 + i - 1), mk(st0 + i + 1), mk(st0 + i - 2), { els: mk(st0 + i).els.map(e => Object.assign({}, e, { f: f === 'black' ? 'white' : 'black' })) }, { els: mk(st0 + i).els.map(e => Object.assign({}, e, { s: shape === 'circle' ? 'square' : 'circle' })) }] }; } });
  L.push({ lv: 1, name: 'sides', make: () => { const f = r.pick(['white', 'grey', 'stripes']); const mk = n => ({ els: [{ s: REGULAR[n], x: 30, y: 31, r: 19, f }] }); return { st: i => mk(i), say: ['Each new shape has one more side: triangle (3), square (4), pentagon (5), hexagon (6), so next comes 7 sides.'], wrong: i => [mk(i - 1), mk(i + 1), mk(i - 2), { els: [{ s: REGULAR[i], x: 30, y: 31, r: 19, f: f === 'white' ? 'black' : 'white' }] }, { els: [{ s: 'circle', x: 30, y: 31, r: 19, f }] }] }; } });
  L.push({ lv: 1, name: 'fillcycle', make: () => { const cyc = r.pick([['white', 'grey', 'black'], ['white', 'black'], ['black', 'stripes', 'white']]); const mk = i => ({ els: [{ s: shape, x: 30, y: 30, r: 19, f: cyc[((i % cyc.length) + cyc.length) % cyc.length] }] }); const others = ['white', 'grey', 'black', 'stripes', 'dots']; return { st: mk, say: [`The shading repeats in a pattern: ${cyc.map(c => FILL_WORD[c]).join(', ')}, then starts again.`], wrong: i => others.filter(c => c !== cyc[i % cyc.length]).map(c => ({ els: [{ s: shape, x: 30, y: 30, r: 19, f: c }] })).concat([{ els: [{ s: shape === 'circle' ? 'square' : 'circle', x: 30, y: 30, r: 19, f: cyc[i % cyc.length] }] }]) }; } });
  L.push({ lv: 2, name: 'corner', make: () => { const pos = [[16, 16], [44, 16], [44, 44], [16, 44]], dir = r.pick([1, -1]), sm = r.pick(['circle', 'triangle', 'star', 'square']); const P = i => pos[((i * dir) % 4 + 4) % 4]; const mk = (i, f) => ({ els: [{ s: sm, x: P(i)[0], y: P(i)[1], r: 9, f: f || 'black' }], lines: [[30, 4, 30, 56, 1.2], [4, 30, 56, 30, 1.2]] }); return { st: i => mk(i), say: [`The ${sname(sm)} moves one corner ${dir > 0 ? 'clockwise' : 'anticlockwise'} each time.`], wrong: i => [mk(i + 1), mk(i - 1), mk(i + 2), mk(i, 'white'), { els: [{ s: sm, x: 30, y: 30, r: 9, f: 'black' }], lines: [[30, 4, 30, 56, 1.2], [4, 30, 56, 30, 1.2]] }] }; } });
  L.push({ lv: 2, name: 'rotate45', make: () => { const dir = r.pick([1, -1]); const mk = (rot, f, m) => ({ els: [{ s: 'arrow', x: 30, y: 30, r: 20, f: f || 'grey', rot, m }] }); return { st: i => mk(i * 45 * dir), say: [`The arrow turns 45° ${dir > 0 ? 'clockwise' : 'anticlockwise'} (an eighth of a turn) each time.`], wrong: i => [mk(i * 45 * dir + 45 * dir), mk(i * 45 * dir - 90 * dir), mk(-i * 45 * dir), mk(i * 45 * dir, 'black'), mk(i * 45 * dir + 90 * dir)] }; } });
  L.push({ lv: 2, name: 'rotFill', make: () => { const dir = r.pick([1, -1]), cyc = ['white', 'black']; const mk = (rot, f) => ({ els: [{ s: chi, x: 30, y: 30, r: 19, f, rot }] }); return { st: i => mk(i * 90 * dir, cyc[i % 2]), say: [`Two things change. The ${sname(chi)} turns 90° ${dir > 0 ? 'clockwise' : 'anticlockwise'} each time.`, 'The shading swaps between white and black.'], wrong: i => [mk(i * 90 * dir, cyc[(i + 1) % 2]), mk((i - 1) * 90 * dir, cyc[i % 2]), mk(-i * 90 * dir, cyc[i % 2]), mk((i + 1) * 90 * dir, cyc[i % 2]), mk((i - 1) * 90 * dir, cyc[(i + 1) % 2])] }; } });
  L.push({ lv: 2, name: 'countDown', make: () => { const f0 = r.pick(['white', 'black']), alt = f0 === 'white' ? 'black' : 'white'; const P = [[12, 15], [30, 15], [48, 15], [12, 33], [30, 33], [48, 33], [12, 50], [30, 50], [48, 50]]; const mk = (n, f) => ({ els: P.slice(0, n).map(p => ({ s: shape, x: p[0], y: p[1], r: 6, f })) }); return { st: i => mk(8 - i, i % 2 ? alt : f0), say: [`One ${sname(shape)} is taken away each time.`, `The shading swaps between ${FILL_WORD[f0]} and ${FILL_WORD[alt]}.`], wrong: i => [mk(8 - i, i % 2 ? f0 : alt), mk(9 - i, i % 2 ? alt : f0), mk(7 - i, i % 2 ? alt : f0), mk(8 - i + 1, i % 2 ? f0 : alt), mk(6 - i, i % 2 ? f0 : alt)] }; } });
  L.push({ lv: 3, name: 'twoMovers', make: () => { const pos = [[16, 16], [44, 16], [44, 44], [16, 44]], dA = 1, dB = -1; const P = (i, dd) => pos[((i * dd) % 4 + 4) % 4]; const mk = (a, b) => ({ els: [{ s: 'circle', x: P(a, dA)[0], y: P(a, dA)[1], r: 8, f: 'black' }, { s: 'triangle', x: P(b, dB)[0], y: P(b, dB)[1], r: 9, f: 'white' }], lines: [[30, 4, 30, 56, 1.2], [4, 30, 56, 30, 1.2]] }); return { st: i => mk(i, i + 1), say: ['Follow each small shape on its own.', 'The black circle moves one corner clockwise each time.', 'The white triangle moves one corner anticlockwise each time.'], wrong: i => [mk(i, i + 3), mk(i + 1, i + 2), mk(i - 1, i + 2), mk(i + 2, i + 1), mk(i + 1, i)] }; } });
  L.push({ lv: 3, name: 'rotCount', make: () => { const dir = r.pick([1, -1]); const P = [[18, 20], [42, 20], [18, 44], [42, 44]]; const mk = (rot, n) => ({ els: [{ s: 'arrow', x: 30, y: 32, r: 15, f: 'white', rot }], dots: P.slice(0, n).map(p => [p[0] < 30 ? 7 : 53, p[1] < 30 ? 7 : 53, 2.6]) }); return { st: i => mk(i * 90 * dir, i), say: [`The arrow turns 90° ${dir > 0 ? 'clockwise' : 'anticlockwise'} each time.`, 'One more dot appears in the corners each time.'], wrong: i => [mk(i * 90 * dir, i - 1), mk((i + 1) * 90 * dir, i), mk((i - 1) * 90 * dir, i), mk((i + 1) * 90 * dir, i - 1), mk((i + 2) * 90 * dir, i)] }; } });
  L.push({ lv: 3, name: 'alternate', make: () => { const a = r.pick(['circle', 'square', 'triangle']), b = r.pick(['star', 'heart', 'diamond']); const mk = (i) => i % 2 === 0 ? { els: [{ s: a, x: 30, y: 30, r: 8 + i * 2.5, f: 'grey' }] } : { els: [{ s: b, x: 30, y: 30, r: 9, f: 'black', rot: (i - 1) / 2 * 90 }] }; return { st: i => mk(i), say: ['This sequence alternates: every other figure belongs to the same pattern.', `In boxes 1, 3 and 5 the ${sname(a)} grows bigger each time.`, `In boxes 2 and 4 the ${sname(b)} turns 90° clockwise.`], wrong: i => [mk(i - 2), mk(i - 1), mk(i + 1), { els: [{ s: a, x: 30, y: 30, r: 8 + i * 2.5, f: 'black' }] }, { els: [{ s: b, x: 30, y: 30, r: 8 + i * 2.5, f: 'grey' }] }] }; } });
  return L.filter(x => d === 3 ? x.lv >= 2 : d === 2 ? x.lv >= 1 && x.lv <= 2 : x.lv === 1);
}
function sequence(r, d) {
  for (let t = 0; t < 30; t++) {
    const rule = r.pick(seqRules(r, d)).make(), n = 4;
    if (rule.check && !rule.check()) continue;
    const shown = [...Array(n).keys()].map(rule.st), right = rule.st(n);
    const wr = rule.wrong(n).filter(w => !shown.slice(-1).some(s => key(s) === key(w)) || true);
    const o = options(r, right, r.shuffle(wr).concat(shown.slice(0, 3)));
    if (!o) continue;
    return result('Which figure comes next in the sequence?', strip(shown, true), o, 'Look at what changes from one box to the next. More than one thing can change.', ['Compare each box with the one before it.'].concat(rule.say));
  }
  return null;
}

// ================================================================ analogies
const TF = {
  rot90: { say: 'turns 90° clockwise', f: x => mapEls(x, e => ({ rot: (e.rot || 0) + 90 })) },
  rot180: { say: 'turns upside down (180°)', f: x => mapEls(x, e => ({ rot: (e.rot || 0) + 180 })) },
  flip: { say: 'is flipped over, like a reflection in a mirror', f: x => mapEls(x, e => ({ m: !e.m, rot: -(e.rot || 0) })) },
  swapFill: { say: 'swaps its shading: white parts become black and black parts become white', f: x => mapEls(x, e => ({ f: e.f === 'black' ? 'white' : e.f === 'white' ? 'black' : e.f })) },
  shrink: { say: 'becomes smaller', f: x => mapEls(x, e => ({ r: e.r * .6 })) },
  inOut: { say: 'swaps the big shape and the small shape', f: x => ({ els: [Object.assign({}, x.els[0], { s: x.els[1].s }), Object.assign({}, x.els[1], { s: x.els[0].s })] }) },
  addOne: { say: 'gets one more of the same shape', f: x => ({ els: x.els.concat([Object.assign({}, x.els[0], { x: 30, y: 47, r: 5 })]) }) }
};
function mapEls(x, fn) { return Object.assign({}, x, { els: x.els.map(e => Object.assign({}, e, fn(e))) }); }
function analogy(r, d) {
  for (let t = 0; t < 40; t++) {
    const base = () => { const two = r() < .5; const o = r.pick(['circle', 'square', 'hexagon', 'pentagon', 'triangle']), i = r.pick(['star', 'heart', 'diamond', 'cross', 'flag']); return two ? { els: [{ s: o, x: 30, y: 28, r: 18, f: 'white', rot: 0 }, { s: i, x: 30, y: 29, r: 8, f: 'black', rot: 0 }] } : { els: [{ s: r.pick(CHIRAL), x: 30, y: 30, r: 18, f: r.pick(['white', 'black']), rot: r.pick([0, 90]) }] }; };
    let names = d === 1 ? [r.pick(['rot90', 'swapFill', 'shrink', 'flip', 'rot180'])] : d === 2 ? r.sample(['rot90', 'swapFill', 'shrink', 'flip', 'inOut'], r() < .5 ? 1 : 2) : r.sample(['rot90', 'swapFill', 'flip', 'inOut', 'rot180'], 2);
    if (names.includes('rot90') && names.includes('flip')) continue;
    if (names.includes('rot180') && names.includes('flip')) continue;
    const A = base(), C = base();
    if (names.includes('inOut') && (A.els.length < 2 || C.els.length < 2)) continue;
    if (key(A) === key(C)) continue;
    const ap = x => names.reduce((acc, n) => TF[n].f(acc), x);
    const Bf = ap(A), D = ap(C);
    if (key(Bf) === key(A) || key(D) === key(C)) continue;
    // the change from A to B must have only one sensible reading, otherwise two answers could be argued
    const ALT = { rot90: TF.rot90.f, rot180: TF.rot180.f, rot270: x => TF.rot90.f(TF.rot180.f(x)), flip: TF.flip.f, flipV: x => TF.rot180.f(TF.flip.f(x)), swapFill: TF.swapFill.f, shrink: TF.shrink.f, inOut: x => x.els.length > 1 ? TF.inOut.f(x) : x, addOne: TF.addOne.f };
    const ks = Object.keys(ALT), reads = new Set();
    ks.forEach(a => { if (key(ALT[a](A)) === key(Bf)) reads.add(key(ALT[a](C))); ks.forEach(b => { if (a !== b && key(ALT[b](ALT[a](A))) === key(Bf)) reads.add(key(ALT[b](ALT[a](C)))); }); });
    if (reads.size !== 1) continue;
    const wrongs = [C, TF.flip.f(D), TF.rot90.f(D), TF.swapFill.f(D)];
    if (names.length === 2) { wrongs.unshift(TF[names[0]].f(C), TF[names[1]].f(C)); }
    else wrongs.unshift(TF[r.pick(Object.keys(TF).filter(k => k !== names[0] && k !== 'inOut' && k !== 'addOne'))].f(C));
    wrongs.push(TF.rot180.f(D), TF.shrink.f(D));
    const o = options(r, D, r.shuffle(wrongs.slice(0, 3)).concat(wrongs.slice(3)));
    if (!o) continue;
    const arrow = x => `<text x="${x}" y="36" font-size="16" fill="#5b6b7c" text-anchor="middle" font-family="system-ui,sans-serif">→</text>`;
    const s = svgOpen(312, 60) + frame(0, 0) + draw(A) + arrow(70) + frame(80, 0) + draw(Bf, 80, 0) + `<text x="156" y="36" font-size="13" fill="#5b6b7c" text-anchor="middle" font-family="system-ui,sans-serif">as</text>` + frame(172, 0) + draw(C, 172, 0) + arrow(242) + qmark(252, 0) + '</svg>';
    return result('The first pair of figures go together in a certain way. Which figure goes with the third figure in the same way?', s, o, 'Say in words exactly how the first figure changes into the second. Then do the same to the third figure.',
      ['Look carefully at how the first figure changes into the second.', ...names.map(n => `The figure ${TF[n].say}.`), 'Do exactly the same to the third figure.']);
  }
  return null;
}

// ================================================================ matrices
function matrix(r, d) {
  for (let t = 0; t < 40; t++) {
    const rows = r.sample(['circle', 'square', 'triangle', 'star', 'heart', 'diamond', 'pentagon', 'cross'], 3);
    const fills = r.sample(['white', 'grey', 'black', 'stripes'], 3);
    let G, say, wrongFn;
    const kind = d === 1 ? r.pick(['rowShapeColFill', 'rowShapeColCount']) : d === 2 ? r.pick(['latin', 'rowShapeColRot', 'latinCount']) : r.pick(['latinBoth', 'latinRot', 'sumRule']);
    const one = (s, f, n, rot) => { n = n || 1; const ps = n === 1 ? [[30, 30]] : n === 2 ? [[19, 30], [41, 30]] : [[30, 17], [18, 41], [42, 41]]; return { els: ps.map(p => ({ s, x: p[0], y: p[1], r: n === 1 ? 15 : 9, f, rot: rot || 0 })) }; };
    if (kind === 'rowShapeColFill') { G = (i, j) => one(rows[i], fills[j]); say = ['Each row uses one shape.', `Going across each row the shading goes ${fills.map(f => FILL_WORD[f]).join(', ')}.`]; }
    else if (kind === 'rowShapeColCount') { const f = r.pick(['white', 'black', 'grey']); G = (i, j) => one(rows[i], f, j + 1); say = ['Each row uses one shape.', 'Going across, the number of shapes goes 1, 2, 3.']; }
    else if (kind === 'latin') { const sh = r.shuffle([0, 1, 2]), fo = r.shuffle([0, 1, 2]); G = (i, j) => one(rows[sh[(i + j) % 3]], fills[fo[(i + 2 * j) % 3]]); say = ['Every row and every column has one of each shape.', 'Every row and every column also has one of each shading.', 'Find the shape and the shading that are missing from the last row and column.']; }
    else if (kind === 'rowShapeColRot') { const s = r.sample(CHIRAL, 3), f = r.pick(['white', 'grey']); G = (i, j) => one(s[i], f, 1, j * 90); say = ['Each row uses one shape.', 'Going across, the shape turns 90° clockwise each time.']; rows[0] = s[0]; }
    else if (kind === 'latinCount') { const sh = r.shuffle([0, 1, 2]), f = r.pick(['white', 'black']); G = (i, j) => one(rows[sh[(i + j) % 3]], f, ((i + 2 * j) % 3) + 1); say = ['Every row and column has one of each shape.', 'Every row and column also has 1, 2 and 3 shapes once each.']; }
    else if (kind === 'latinBoth') { const sh = r.shuffle([0, 1, 2]), fo = r.shuffle([0, 1, 2]), co = r.shuffle([0, 1, 2]); G = (i, j) => one(rows[sh[(i + j) % 3]], fills[fo[(2 * i + j) % 3]], co[(i + 2 * j) % 3] + 1); say = ['Three things are shared out: shape, shading and number.', 'In every row and every column each shape, each shading and each number (1, 2, 3) appears once.', 'Work out which shape, shading and number are missing.']; }
    else if (kind === 'latinRot') { const s = r.pick(CHIRAL), fo = r.shuffle([0, 1, 2]); G = (i, j) => one(s, fills[fo[(i + j) % 3]], 1, ((i + 2 * j) % 3) * 90); say = ['Every row and every column has one of each shading.', 'The shape points in three directions, and every row and column has each direction once.']; rows[0] = s; }
    else { const f = r.pick(['black', 'grey']), s = rows[0]; const n = (i, j) => [[1, 1, 2], [2, 1, 3], [1, 2, 3]][i][j]; G = (i, j) => one(s, j === 2 ? f : 'white', n(i, j)); say = ['Look along each row.', 'The number of shapes in the third box is the total of the first two boxes.', 'The third box in each row is shaded.']; }
    const cells = [...Array(9).keys()].map(k => G(Math.floor(k / 3), k % 3)), right = cells[8];
    // distractors change one feature of the answer, or copy a nearby box
    const e0 = right.els[0], cnt = right.els.length;
    const vary = [];
    ['white', 'grey', 'black', 'stripes'].filter(f => f !== e0.f).forEach(f => vary.push(one(e0.s, f, cnt, e0.rot)));
    rows.concat(['hexagon', 'circle']).filter(s => s !== e0.s).forEach(s => vary.push(one(s, e0.f, cnt, e0.rot)));
    [1, 2, 3].filter(c => c !== cnt).forEach(c => vary.push(one(e0.s, e0.f, c, e0.rot)));
    if (SHAPES[e0.s].chiral) [90, 180, 270].forEach(a => vary.push(one(e0.s, e0.f, cnt, (e0.rot || 0) + a)));
    const o = options(r, right, r.shuffle(vary).concat(cells.slice(0, 8)));
    if (!o) continue;
    let s = svgOpen(196, 196, 1);
    cells.forEach((c, k) => { const x = (k % 3) * 68, y = Math.floor(k / 3) * 68; s += k === 8 ? qmark(x, y) : frame(x, y) + draw(c, x, y); });
    s += '</svg>';
    return result('Which figure completes the grid?', s, o, 'Look along the rows first, then down the columns. Look for what stays the same and what changes.', ['Work out the rule across the rows and the rule down the columns.'].concat(say));
  }
  return null;
}

// ================================================================ codes
function codes(r, d) {
  for (let t = 0; t < 60; t++) {
    const nf = d === 3 ? 3 : 2;
    const letters = r.shuffle('ABCDEFGHJKLMNPRSTUVWXYZ'.split(''));
    const feats = [
      { name: 'shape', vals: r.sample(['circle', 'square', 'triangle', 'star', 'heart', 'pentagon', 'diamond'], 3), word: v => 'the ' + sname(v) },
      { name: 'shading', vals: r.sample(['white', 'grey', 'black', 'stripes'], 3), word: v => FILL_WORD[v] + ' shading' },
      { name: 'number', vals: [1, 2, 3], word: v => v + (v === 1 ? ' shape' : ' shapes') },
      { name: 'size', vals: ['small', 'big'], word: v => 'a ' + v + ' shape' }
    ];
    const alt = r.v >= 2 && r() < .5;   // version 2: codes for size, and number with shading
    const use = alt ? (d === 1 ? [feats[1], feats[2]] : d === 2 ? [feats[0], feats[3]] : [feats[0], feats[1], feats[3]]) : d === 1 ? [feats[0], feats[1]] : d === 2 ? [feats[0], r.pick([feats[1], feats[2]])] : [feats[0], feats[1], feats[2]];
    use.forEach((f, i) => { f.code = {}; f.vals.forEach((v, k) => { f.code[v] = letters[i * 3 + k]; }); });
    use.shapeDefault = feats[0].vals[0];
    const fig = c => { const n = c.number || 1, big = c.size !== 'small', ps = n === 1 ? [[30, 30]] : n === 2 ? [[19, 30], [41, 30]] : [[30, 17], [18, 41], [42, 41]]; return { els: ps.map(p => ({ s: c.shape || use.shapeDefault, x: p[0], y: p[1], r: n === 1 ? (big ? 17 : 10) : 9, f: c.shading || 'white' })) }; };
    const combo = () => { const c = {}; use.forEach(f => { c[f.name] = r.pick(f.vals); }); return c; };
    const codeOf = c => use.map(f => f.code[c[f.name]]).join('');
    // examples: enough to show every value used by the target, and every letter identifiable
    const target = combo(), ex = [];
    for (let k = 0; k < 40 && ex.length < (d === 3 ? 5 : 4); k++) { const c = combo(); if (codeOf(c) !== codeOf(target) && !ex.some(e => codeOf(e) === codeOf(c))) ex.push(c); }
    const okFeat = use.every(f => f.vals.filter(v => target[f.name] === v).every(v => ex.some(e => e[f.name] === v)));
    // each letter position: its value must be pinned down: the same letter always goes with the same value (true by design) and the target's value appears in the examples
    if (!okFeat || ex.length < 4) continue;
    const right = codeOf(target);
    const wrong = new Set();
    use.forEach((f, i) => f.vals.forEach(v => { if (v !== target[f.name]) { const c = Object.assign({}, target, { [f.name]: v }); wrong.add(codeOf(c)); } }));
    wrong.add(right.split('').reverse().join(''));
    const opts = r.shuffle([...wrong].filter(w => w !== right)).slice(0, 4);
    if (opts.length < 4) continue;
    const a = r.int(0, 4); opts.splice(a, 0, right);
    const n = ex.length + 1, w = n * 68 - 8;
    let s = svgOpen(w, 84);
    ex.forEach((c, k) => { s += frame(k * 68, 0) + draw(fig(c), k * 68, 0) + `<text x="${k * 68 + 30}" y="78" text-anchor="middle" font-size="14" font-weight="700" fill="${INK}" font-family="system-ui,sans-serif">${codeOf(c)}</text>`; });
    s += frame(ex.length * 68, 0) + draw(fig(target), ex.length * 68, 0) + `<text x="${ex.length * 68 + 30}" y="78" text-anchor="middle" font-size="16" font-weight="700" fill="#5b6b7c" font-family="system-ui,sans-serif">?</text></svg>`;
    const how = use.map((f, i) => { const ord = ['first', 'second', 'third'][i]; const shown = f.vals.filter(v => ex.some(e => e[f.name] === v)); return `The ${ord} letter is for the ${f.name}: ${shown.map(v => `${f.code[v]} = ${f.word(v)}`).join(', ')}.`; });
    return { q: 'Each figure has a code. Each letter stands for one feature of the figure. What is the code for the last figure?', svg: s, opts, a, hint: 'Find two figures that share a letter. What do they have in common? That is what the letter means.',
      steps: ['Compare figures that share a letter to find what each letter means.'].concat(how, [`The last figure has ${use.map(f => f.word(target[f.name])).join(', ')}, so its code is ${right}.`]) };
  }
  return null;
}

// ================================================================ reflections and rotations
// A figure made of three or four parts placed off-centre, so that turning and flipping it always looks different.
function partsFigure(r, n) {
  const ps = n === 4 ? r.shuffle([[16, 16], [44, 16], [16, 44], [44, 44]]) : r.sample([[16, 16], [44, 16], [16, 44], [44, 44], [30, 30]], n);
  const shapes = [r.pick(CHIRAL), r.pick(['triangle', 'arrow', 'semicircle', 'flag']), r.pick(['circle', 'square', 'star', 'heart']), r.pick(['diamond', 'triangle', 'circle'])];
  return { els: ps.map((p, i) => ({ s: shapes[i], x: p[0], y: p[1], r: i === 0 ? 9.5 : 7, f: i === 2 ? 'black' : i === 3 ? 'grey' : 'white', rot: r.pick([0, 90, 180, 270]) })) };
}
const mirrorV = fig => ({ els: fig.els.map(e => Object.assign({}, e, { x: 60 - e.x, m: !e.m, rot: -(e.rot || 0) })) });
const mirrorH = fig => ({ els: fig.els.map(e => Object.assign({}, e, { y: 60 - e.y, m: !e.m, rot: 180 - (e.rot || 0) })) });
const turn = (fig, deg) => ({ els: fig.els.map(e => { let x = e.x - 30, y = e.y - 30; for (let k = 0; k < ((deg / 90) % 4 + 4) % 4; k++) { const t = x; x = -y; y = t; } return Object.assign({}, e, { x: 30 + x, y: 30 + y, rot: (e.rot || 0) + deg }); }) });
const nudge = (r, fig) => { const g = JSON.parse(JSON.stringify(fig)); const e = g.els[r.int(1, g.els.length - 1)]; e.f = e.f === 'black' ? 'white' : 'black'; return g; };
const norm = fig => ({ els: fig.els.map(e => Object.assign({}, e, { rot: ((Math.round(e.rot || 0) % 360) + 360) % 360 })) });
function symCheck(fig) { const k = key(norm(fig)); return [mirrorV(fig), mirrorH(fig), turn(fig, 90), turn(fig, 180), turn(fig, 270)].every(g => key(norm(g)) !== k); }
function reflection(r, d) {
  for (let t = 0; t < 40; t++) {
    const fig = partsFigure(r, d === 1 ? 3 : 4); if (!symCheck(fig)) continue;
    const horiz = d >= 2 && r() < .5;
    const right = norm(horiz ? mirrorH(fig) : mirrorV(fig));
    const wrongs = [norm(horiz ? mirrorV(fig) : mirrorH(fig)), norm(turn(fig, 180)), norm(fig), norm(nudge(r, right)), norm(turn(right, 90)), norm(turn(fig, 90))];
    const o = options(r, right, d === 1 ? wrongs : r.shuffle(wrongs.slice(0, 4)).concat(wrongs.slice(4)));
    if (!o) continue;
    let s;
    if (horiz) s = svgOpen(60, 80) + frame(0, 0) + draw(fig) + line(0, 70, 60, 70, 2, true) + '</svg>';
    else s = svgOpen(80, 60) + frame(0, 0) + draw(fig) + line(70, 0, 70, 60, 2, true) + '</svg>';
    return result(`Which figure shows the shape reflected in the dashed mirror line${horiz ? ' below it' : ''}?`, s, o, 'In a mirror, things close to the line stay close and things far away stay far. Left and right swap (or top and bottom for a flat mirror line).',
      [horiz ? 'The mirror line is flat, so the figure flips upside down: parts at the top move to the bottom.' : 'The mirror line is upright, so the figure flips left to right: parts on the left move to the right.', 'Each part keeps the same distance from the mirror line, and each shape is flipped too, not just moved.', 'Watch out: turning the figure upside down is not the same as reflecting it.']);
  }
  return null;
}
function rotation(r, d) {
  for (let t = 0; t < 40; t++) {
    const fig = partsFigure(r, d === 1 ? 3 : 4); if (!symCheck(fig)) continue;
    const ask = d === 1 ? r.pick([90, 270]) : d === 2 ? r.pick([180, 90, 270]) : r.pick([90, 270, 180]);
    const right = norm(turn(fig, ask));
    const word = ask === 90 ? '90° clockwise (a quarter turn to the right)' : ask === 270 ? '90° anticlockwise (a quarter turn to the left)' : '180° (half a turn)';
    const wrongs = [norm(turn(fig, 360 - ask === 360 ? 180 : 360 - ask)), norm(mirrorV(right)), norm(turn(fig, (ask + 180) % 360)), norm(nudge(r, right)), norm(mirrorV(fig)), norm(fig), norm(mirrorH(fig))];
    const o = options(r, right, d === 3 ? [norm(mirrorV(right)), norm(nudge(r, right))].concat(r.shuffle(wrongs)) : wrongs);
    if (!o) continue;
    return result(`Which figure shows this shape turned ${word}?`, svgOpen(60, 60) + frame(0, 0) + draw(fig) + '</svg>', o, 'Pick one part, such as the black shape, and follow where it goes when the whole box turns. Then check a second part.',
      [`Imagine turning the whole box ${word}.`, ask === 180 ? 'In a half turn, top and bottom swap and left and right swap.' : ask === 90 ? 'In a quarter turn clockwise, the top moves to the right side, the right side moves to the bottom, and so on.' : 'In a quarter turn anticlockwise, the top moves to the left side, the left side moves to the bottom, and so on.', 'Every small shape turns too. Watch out for options that are flipped (mirror images) rather than turned.']);
  }
  return null;
}

// ================================================================ hidden shapes
function hidden(r, d) {
  const U = 18;   // grid unit: the big figure is 6 x 6 units in a 120 box
  const poly = (pts, ox, oy, u) => `<polygon points="${pts.map(p => rnd(ox + p[0] * u) + ',' + rnd(oy + p[1] * u)).join(' ')}" fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
  const shapesLib = [
    [[0, 0], [2, 0], [2, 1], [1, 1], [1, 2], [0, 2]], [[0, 0], [3, 0], [2, 2], [0, 2]], [[0, 0], [2, 0], [3, 2], [1, 2]], [[0, 0], [3, 1], [0, 2]], [[0, 1], [1, 0], [3, 0], [3, 2], [1, 2]],
    [[0, 0], [2, 0], [2, 3], [1, 2], [0, 3]], [[0, 0], [3, 0], [3, 1], [1, 1], [1, 2], [0, 2]], [[1, 0], [2, 1], [1, 3], [0, 1]], [[0, 0], [1, 0], [3, 2], [0, 2]], [[0, 2], [1, 0], [3, 0], [2, 2]]
  ];
  const mir = s => { const mx = Math.max(...s.map(p => p[0])); return s.map(p => [mx - p[0], p[1]]); };
  const rot = s => { const my = Math.max(...s.map(p => p[1])); return s.map(p => [my - p[1], p[0]]); };
  const same = (a, b) => { const k = s => s.map(p => p.join(',')).sort().join(' '); return k(a) === k(b); };
  for (let t = 0; t < 40; t++) {
    const target = r.pick(shapesLib), w = Math.max(...target.map(p => p[0])), h = Math.max(...target.map(p => p[1]));
    const ox = r.int(0, 6 - w), oy = r.int(0, 6 - h);
    const extras = d === 1 ? 2 : d === 2 ? 3 : 4;
    let body = poly(target.map(p => [p[0] + ox, p[1] + oy]), 0, 0, U);
    const variants = s => [s, mir(s), rot(s), rot(rot(s)), rot(rot(rot(s))), mir(rot(s)), mir(rot(rot(s))), mir(rot(rot(rot(s))))];
    const decoyLib = r.sample(shapesLib.filter(s => s !== target), 3);
    const avoid = [target, ...variants(target), ...decoyLib.flatMap(variants)];
    const extraLib = shapesLib.filter(s => !avoid.some(v => same(v, s)));
    if (extraLib.length < 2) continue;
    for (let k = 0; k < extras; k++) { const e = r.pick(extraLib), ex = r.int(0, 6 - Math.max(...e.map(p => p[0]))), ey = r.int(0, 6 - Math.max(...e.map(p => p[1]))); body += poly(e.map(p => [p[0] + ex, p[1] + ey]), 0, 0, U); }
    if (d >= 2) for (let k = 0; k < d; k++) body += line(r.int(0, 6) * U, r.int(0, 6) * U, r.int(0, 6) * U, r.int(0, 6) * U, 2);
    const wrongs = [mir(target), rot(target), rot(rot(rot(target))), ...decoyLib].filter(s => !same(s, target));
    const uniq = []; wrongs.forEach(s => { if (!uniq.some(u => same(u, s)) && !same(s, target)) uniq.push(s); });
    if (uniq.length < 4) continue;
    const opt = s => { const ww = Math.max(...s.map(p => p[0])), hh = Math.max(...s.map(p => p[1])); return svgOpen(60, 60) + frame(0, 0) + poly(s, 30 - ww * 8, 30 - hh * 8, 16) + '</svg>'; };
    const list = r.shuffle(uniq).slice(0, 4), a = r.int(0, 4); list.splice(a, 0, target);
    const big = svgOpen(120, 120, 1.2) + `<rect x="1" y="1" width="118" height="118" rx="6" fill="#fff" stroke="${FRAME}" stroke-width="1.5"/><g transform="translate(6 6)">${body}</g></svg>`;
    return { q: 'Which shape is hidden in the big figure? It is the same size and turned the same way.', svg: big, of: list.map(opt), opts: ['A', 'B', 'C', 'D', 'E'], a, hint: 'Pick the most unusual corner or angle in each option and hunt for it in the big figure. Then trace the outline with your eyes.',
      steps: ['A hidden shape is exactly the same size and faces the same way. It is not turned or flipped.', 'Look for an unusual corner or a slanted side in each option, then find it in the big figure.', `Option ${LET[a]} can be traced all the way round inside the figure. Other options are flipped or turned versions, or have a side that is not there.`, `The answer is ${LET[a]}.`] };
  }
  return null;
}

// ================================================================ cube nets
const NETS = [
  [[0, 1], [1, 1], [2, 1], [3, 1], [0, 0], [0, 2]], [[0, 1], [1, 1], [2, 1], [3, 1], [0, 0], [1, 2]], [[0, 1], [1, 1], [2, 1], [3, 1], [0, 0], [2, 2]], [[0, 1], [1, 1], [2, 1], [3, 1], [0, 0], [3, 2]],
  [[0, 1], [1, 1], [2, 1], [3, 1], [1, 0], [1, 2]], [[0, 1], [1, 1], [2, 1], [3, 1], [1, 0], [2, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [1, 2]], [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [2, 2]], [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [3, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]], [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [4, 1]]
];
const vadd = (a, b) => a.map((x, i) => x + b[i]), vneg = a => a.map(x => -x), vk = a => a.join(',');
function fold(cells) {
  const st = { [vk(cells[0])]: { n: [0, 0, 1], ex: [1, 0, 0], ey: [0, -1, 0] } }, q = [cells[0]];
  while (q.length) {
    const c = q.shift(), s = st[vk(c)];
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
      const nb = [c[0] + dx, c[1] + dy]; if (!cells.some(x => x[0] === nb[0] && x[1] === nb[1]) || st[vk(nb)]) return;
      let t;
      if (dx === 1) t = { n: s.ex, ex: vneg(s.n), ey: s.ey }; else if (dx === -1) t = { n: vneg(s.ex), ex: s.n, ey: s.ey };
      else if (dy === 1) t = { n: s.ey, ex: s.ex, ey: vneg(s.n) }; else t = { n: vneg(s.ey), ex: s.ex, ey: s.n };
      st[vk(nb)] = t; q.push(nb);
    });
  }
  return cells.map(c => st[vk(c)] && st[vk(c)].n);
}
const det3 = (a, b, c) => a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
const dotp = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
// Face symbols that look the same however a face is turned, so only which faces meet matters.
const SYM = [
  { n: 'black dot', d: '<circle cx=".5" cy=".5" r=".2" fill="#1d2b3a"/>' },
  { n: 'ring', d: '<circle cx=".5" cy=".5" r=".26" fill="none" stroke="#1d2b3a" stroke-width=".09"/>' },
  { n: 'plus sign', d: '<path d="M.5 .2V.8M.2 .5H.8" stroke="#1d2b3a" stroke-width=".11"/>' },
  { n: 'cross', d: '<path d="M.27 .27L.73 .73M.73 .27L.27 .73" stroke="#1d2b3a" stroke-width=".11"/>' },
  { n: 'grey square', d: '<rect x=".27" y=".27" width=".46" height=".46" fill="#9aa5b1" stroke="#1d2b3a" stroke-width=".05"/>' },
  { n: 'four dots', d: '<g fill="#1d2b3a"><circle cx=".3" cy=".3" r=".09"/><circle cx=".7" cy=".3" r=".09"/><circle cx=".3" cy=".7" r=".09"/><circle cx=".7" cy=".7" r=".09"/></g>' },
  { n: 'black face', d: '<rect x="0" y="0" width="1" height="1" fill="#1d2b3a"/>' },
  { n: 'target', d: '<circle cx=".5" cy=".5" r=".3" fill="none" stroke="#1d2b3a" stroke-width=".07"/><circle cx=".5" cy=".5" r=".11" fill="#1d2b3a"/>' }
];
function cubeSVG(t, l, rr) {
  const face = (sym, m, fill) => `<g transform="matrix(${m})"><polygon points="0,0 1,0 1,1 0,1" fill="${fill}" stroke="${INK}" stroke-width=".05"/>${sym.d}</g>`;
  return svgOpen(60, 60) + frame(0, 0) + face(t, '19 -11 19 11 11 21', '#fff') + face(l, '19 11 0 22 11 21', '#f1f3f5') + face(rr, '19 -11 0 22 30 32', '#e9ecef') + '</svg>';
}
function nets(r, d) {
  for (let t = 0; t < 60; t++) {
    let cells = r.pick(NETS).map(c => c.slice());
    // show the net turned or flipped for variety
    if (r() < .5) cells = cells.map(c => [-c[0], c[1]]);
    if (r() < .5) cells = cells.map(c => [c[1], c[0]]);
    const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1])); cells = cells.map(c => [c[0] - mx, c[1] - my]);
    const normals = fold(cells); if (normals.some(n => !n) || new Set(normals.map(vk)).size !== 6) continue;
    const syms = r.sample(SYM, 6);
    const symAt = n => syms[normals.findIndex(m => vk(m) === vk(n))];
    const axes = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    const corner = () => axes.map(a => r() < .5 ? a : vneg(a));
    const order = (tri, want) => { for (const p of r.shuffle([[0, 1, 2], [1, 2, 0], [2, 0, 1], [0, 2, 1], [2, 1, 0], [1, 0, 2]])) { const o = p.map(i => tri[i]); if (Math.sign(det3(o[0], o[1], o[2])) === want) return o; } };
    const right = order(corner(), 1);
    const W = [];
    const opp = () => { const a = corner(); const i = r.int(0, 2), j = (i + r.int(1, 2)) % 3; const tri = a.slice(); tri[j] = vneg(tri[i]); return r.shuffle(tri); };
    const nMirror = d === 1 ? 0 : d === 2 ? 1 : 2;
    for (let k = 0; k < nMirror; k++) W.push({ tri: order(corner(), -1), why: 'mirror' });
    for (let k = 0; k < 12; k++) W.push({ tri: opp(), why: 'opposite' });
    const fk = tri => tri.map(n => symAt(n).n).join('|');
    const seen = new Set([fk(right)]), chosen = [];
    W.forEach(w => { const k = fk(w.tri); if (!seen.has(k) && chosen.length < 4) { seen.add(k); chosen.push(w); } });
    if (chosen.length < 4) continue;
    const a = r.int(0, 4), list = chosen.slice(); list.splice(a, 0, { tri: right });
    const of = list.map(w => cubeSVG(symAt(w.tri[0]), symAt(w.tri[1]), symAt(w.tri[2])));
    const cw = Math.max(...cells.map(c => c[0])) + 1, ch = Math.max(...cells.map(c => c[1])) + 1, S = 26;
    let s = svgOpen(cw * S + 4, ch * S + 4, 1.3);
    cells.forEach((c, i) => { s += `<g transform="translate(${c[0] * S + 2} ${c[1] * S + 2}) scale(${S})"><rect width="1" height="1" fill="#fff" stroke="${INK}" stroke-width=".06"/>${syms[i].d}</g>`; });
    s += '</svg>';
    const pairs = [], done = new Set();
    normals.forEach((n, i) => { if (done.has(i)) return; const j = normals.findIndex(m => vk(m) === vk(vneg(n))); done.add(i); done.add(j); pairs.push(`${syms[i].n} and ${syms[j].n}`); });
    const oppOpts = list.map((w, i) => w.why === 'opposite' ? LET[i] : null).filter(Boolean), mirOpts = list.map((w, i) => w.why === 'mirror' ? LET[i] : null).filter(Boolean);
    return { q: 'The net is folded to make a cube. Which cube could it make?', svg: s, of, opts: ['A', 'B', 'C', 'D', 'E'], a,
      hint: 'Find the faces that will be opposite each other. Opposite faces can never be seen at the same time.',
      steps: ['Faces that are opposite each other on the cube can never be seen together.', `On this net the opposite pairs are: ${pairs.join('; ')}.`, oppOpts.length ? `Option${oppOpts.length > 1 ? 's' : ''} ${oppOpts.join(', ')} show${oppOpts.length > 1 ? '' : 's'} two opposite faces together, so ${oppOpts.length > 1 ? 'they are' : 'it is'} impossible.` : null, mirOpts.length ? `Option${mirOpts.length > 1 ? 's' : ''} ${mirOpts.join(', ')} show${mirOpts.length > 1 ? '' : 's'} three faces that do meet at a corner, but in the wrong order going round, like a mirror image. Check which face is clockwise from which.` : null, `Option ${LET[a]} shows three faces that really meet at one corner, in the right order.`, `The answer is ${LET[a]}.`].filter(Boolean) };
  }
  return null;
}

// ================================================================ 3D views (block models)
function views(r, d) {
  for (let t = 0; t < 150; t++) {
    const X = d === 1 ? 2 : 3, Y = 3;
    // heights never rise towards the viewer, so no stack is hidden behind a taller one
    const h = [...Array(X)].map(() => Array(Y).fill(0));
    for (let i = 0; i < X; i++) for (let j = 0; j < Y; j++) {
      const lim = Math.min(i > 0 ? h[i - 1][j] : 3, j > 0 ? h[i][j - 1] : 3);
      h[i][j] = i === 0 && j === 0 ? r.int(2, 3) : lim === 0 ? 0 : r() < .8 ? r.int(1, lim) : 0;
    }
    const total = h.flat().reduce((a, b) => a + b, 0), stacks = h.flat().filter(v => v > 0).length;
    const rowsUsed = h.filter(row => row.some(v => v > 0)).length, colsUsed = [...Array(Y).keys()].filter(j => h.some(row => row[j] > 0)).length;
    if (total < (d === 1 ? 4 : 6) || stacks < (d === 1 ? 3 : 4) || rowsUsed < 2 || colsUsed < 2 || h[0][0] < 2) continue;
    // isometric picture
    const c = 9, k = 10;
    const P = (x, y, z) => [60 + (y - x) * c * 1.732 / 1, 30 + (x + y) * c - z * k * 1.15];
    let pic = '';
    const cubes = []; for (let i = 0; i < X; i++) for (let j = 0; j < Y; j++) for (let z = 0; z < h[i][j]; z++) cubes.push([i, j, z]);
    cubes.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]) || a[2] - b[2]);
    const pg = (pts, f) => `<polygon points="${pts.map(p => p.map(rnd).join(',')).join(' ')}" fill="${f}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
    cubes.forEach(([i, j, z]) => {
      pic += pg([P(i, j, z + 1), P(i + 1, j, z + 1), P(i + 1, j + 1, z + 1), P(i, j + 1, z + 1)], '#ffffff');
      pic += pg([P(i + 1, j, z), P(i + 1, j + 1, z), P(i + 1, j + 1, z + 1), P(i + 1, j, z + 1)], '#c9d2de');
      pic += pg([P(i, j + 1, z), P(i + 1, j + 1, z), P(i + 1, j + 1, z + 1), P(i, j + 1, z + 1)], '#9aa5b1');
    });
    // arrow pointing at the middle of the front face, coming from further out along +x
    const tip = P(X + 0.25, Y / 2, 0.5), tail = P(X + 1.6, Y / 2, 0.5), mid = Math.floor(Math.random() * 1e6);
    pic += `<line x1="${rnd(tail[0])}" y1="${rnd(tail[1])}" x2="${rnd(tip[0])}" y2="${rnd(tip[1])}" stroke="#e8590c" stroke-width="2.5" marker-end="url(#ah${mid})"/><text x="${rnd(tail[0])}" y="${rnd(tail[1] + 12)}" text-anchor="middle" font-size="10" font-weight="700" fill="#e8590c" font-family="system-ui,sans-serif">Front</text>`;
    const main = `<svg viewBox="-10 -6 150 140" width="225" height="210" role="img"><defs><marker id="ah${mid}" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#e8590c"/></marker></defs><g transform="translate(0 20)">${pic}</g></svg>`;
    // views: top (front at the bottom, +y to the right), front (from +x, +y to the right), side (from +y, -x to the right)
    const top = () => [...Array(X)].map((_, i) => [...Array(Y)].map((_, j) => h[i][j] > 0 ? 1 : 0));   // rows: x (front row last)
    const front = () => [...Array(Y)].map((_, j) => Math.max(...[...Array(X)].map((_, i) => h[i][j])));
    const side = () => [...Array(X)].map((_, i) => Math.max(...h[i])).reverse();
    const ask = d === 1 ? 'top' : d === 2 ? r.pick(['top', 'front']) : r.pick(['front', 'side', 'top']);
    const gridSVG = g => { const R = g.length, C = g[0].length, u = Math.min(14, 44 / Math.max(R, C)); let s = svgOpen(60, 60) + frame(0, 0); g.forEach((row, ri) => row.forEach((v, ci) => { if (v) s += `<rect x="${rnd(30 - C * u / 2 + ci * u)}" y="${rnd(30 - R * u / 2 + ri * u)}" width="${rnd(u)}" height="${rnd(u)}" fill="#c9d2de" stroke="${INK}" stroke-width="1.2"/>`; })); return s + '</svg>'; };
    const colsSVG = hs => { const C = hs.length, u = 12; let s = svgOpen(60, 60) + frame(0, 0); hs.forEach((v, ci) => { for (let z = 0; z < v; z++) s += `<rect x="${rnd(30 - C * u / 2 + ci * u)}" y="${rnd(50 - (z + 1) * u)}" width="${u}" height="${u}" fill="#c9d2de" stroke="${INK}" stroke-width="1.2"/>`; }); return s + `<line x1="8" y1="50" x2="52" y2="50" stroke="${INK}" stroke-width="1.5"/></svg>`; };
    let right, wr, render, word;
    if (ask === 'top') {
      right = top(); render = gridSVG; word = 'from directly above (with the front at the bottom)';
      const flipLR = g => g.map(row => row.slice().reverse()), flipUD = g => g.slice().reverse();
      const rot = g => g[0].map((_, j) => g.map(row => row[j]).reverse());
      const tog = (g, i, j) => { const n = g.map(row => row.slice()); n[i][j] = 1 - n[i][j]; return n; };
      wr = [flipLR(right), flipUD(right), rot(right), tog(right, r.int(0, X - 1), r.int(0, Y - 1)), tog(right, X - 1, Y - 1), tog(right, 0, Y - 1), tog(right, X - 1, 0)];
    } else {
      const f = front(), sd = side();
      right = ask === 'front' ? f : sd; render = colsSVG; word = ask === 'front' ? 'from the front (the arrow)' : 'from the right-hand side';
      const other = ask === 'front' ? sd : f, bump = (a, i, v) => a.map((x, k) => k === i ? Math.max(0, Math.min(3, x + v)) : x);
      wr = [right.slice().reverse(), other, other.slice().reverse(), bump(right, r.int(0, right.length - 1), 1), bump(right, r.int(0, right.length - 1), -1), bump(right, 0, -1), bump(right, right.length - 1, 1)].filter(w => w.some(v => v > 0));
    }
    const o = options(r, right, r.shuffle(wr), render);
    if (!o) continue;
    return result(`Which picture shows this model ${word}?`, main, o, ask === 'top' ? 'From above you only see the top of each stack, so height does not matter. Count how many stacks are in each row.' : 'From the front you see the tallest stack in each column. Count the height of each column from left to right.',
      ask === 'top' ? ['From above you see one square for every stack of cubes, however tall it is.', 'Count the stacks in each row, starting with the row furthest away at the top.', 'Check the gaps too. Flipped or turned plans are common wrong answers.']
        : ['From the side you see the tallest stack in each column. Shorter stacks behind are hidden.', 'Work column by column: how tall is the highest stack in that column?', 'Watch out for the view from the other side, which is the right answer flipped.']);
  }
  return null;
}

// ---------------------------------------------------------------- public API
const GEN = { odd_one_out: oddOneOut, nvr_sequences: sequence, analogies: analogy, matrices: matrix, nvr_codes: codes, reflections: reflection, rotations: rotation, hidden_shapes: hidden, nets: nets, views_3d: views };
// ver 2: new question types (see nvr-gen2.js). r.v is the version an id was made with, so old ids rebuild exactly.
const VER = 2;
function make(topic, d, seed, v) {
  const g = GEN[topic]; if (!g) return null;
  v = v || VER;
  for (let k = 0; k < 6; k++) {
    let q = null;
    try { const rr = rng(seed + k * 7919); rr.v = v; q = g(rr, d); } catch (e) { q = null; }
    if (q) { q.id = `g${v > 1 ? v : ''}-nvr-${topic}-${d}-${seed}`; q.topic = topic; q.d = d; q.gen = true; if (!q.svg) delete q.svg; if (!q.of) delete q.of; return q; }
  }
  return null;
}
function fromId(id) { const m = /^g(\d*)-nvr-([a-z_0-9]+)-(\d)-(\d+)$/.exec(id); return m ? make(m[2], +m[3], +m[4], m[1] ? +m[1] : 1) : null; }
// A batch of new questions for one topic: n at each level.
function batch(topic, n) { const out = []; for (let d = 1; d <= 3; d++) for (let i = 0; i < n; i++) { const q = make(topic, d, Math.floor(Math.random() * 1e9)); if (q) out.push(q); } return out; }
window.NVRGEN = { get topics() { return Object.keys(GEN); }, make, fromId, batch, table: GEN, ver: VER, _fold: fold, _nets: NETS };
// Drawing tools shared with nvr-gen2.js.
window.NVRKIT = { SHAPES, CHIRAL, BASIC, REGULAR, CURVED, FILL, FILL_WORD, INK, FRAME, LET, sname, rnd, el, draw, dot, line, frame, svgOpen, cell, qmark, strip, key, options, result, spots, partsFigure, mirrorV, mirrorH, turn, nudge, norm, symCheck, mapEls, fold, NETS, SYM, det3, dotp, vk, vneg, cubeSVG };
window.GENS = window.GENS || {}; window.GENS.nvr = window.NVRGEN;
})();
