/* Non-verbal reasoning generators, version 2.
   New topics: fold and punch, complete the symmetry, join the shapes, and which figure belongs to a group.
   More types in existing topics: "which cube could NOT be made", reflection in a diagonal mirror line,
   more hidden shapes, and grids where two boxes are combined (overlay). Uses the drawing tools in nvr-gen.js. */
(function () {
'use strict';
const G = window.NVRGEN, K = window.NVRKIT; if (!G || !K) return;
const T = G.table;
const { INK, FRAME, LET, rnd, draw, line, frame, svgOpen, cell, qmark, key, options, result, partsFigure, mirrorV, mirrorH, turn, norm, nudge, symCheck, fold, NETS, SYM, det3, vk, vneg, cubeSVG, sname, SHAPES, CHIRAL } = K;
const since = (v, share, base, extra) => (r, d) => (r.v >= v && r() < share ? extra(r, d) : base(r, d));
const fresh = f => (r, d) => (r.v >= 2 ? f(r, d) : null);
const ABCDE = ['A', 'B', 'C', 'D', 'E'];
const pick5 = (r, right, wrongs, toKey, render) => {   // like options(), for things that are not shape figures
  const seen = new Set([toKey(right)]), pool = [];
  for (const w of wrongs) { const k = toKey(w); if (!seen.has(k)) { seen.add(k); pool.push(w); } if (pool.length === 4) break; }
  if (pool.length < 4) return null;
  const a = r.int(0, 4); pool.splice(a, 0, right);
  return { of: pool.map(render), a };
};
const arrowHead = id => `<defs><marker id="${id}" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#e8590c"/></marker></defs>`;
const uid = () => 'm' + Math.floor(Math.random() * 1e9);

// ================================================================ fold and punch
// Paper is a square divided into a 4 x 4 grid of hole positions. Holes are punched through the folded paper; unfolding mirrors them.
const P0 = 8, PS = 44, C = k => P0 + PS * (k + .5) / 4;
const FOLDS = {
  LR: { say: 'The left half is folded over onto the right half.', inR: ([c]) => c >= 2, refl: ([c, w]) => [3 - c, w], line: [30, P0, 30, P0 + PS], region: [[30, P0], [P0 + PS, P0], [P0 + PS, P0 + PS], [30, P0 + PS]], from: [18, 30], to: [42, 30] },
  RL: { say: 'The right half is folded over onto the left half.', inR: ([c]) => c <= 1, refl: ([c, w]) => [3 - c, w], line: [30, P0, 30, P0 + PS], region: [[P0, P0], [30, P0], [30, P0 + PS], [P0, P0 + PS]], from: [42, 30], to: [18, 30] },
  TB: { say: 'The top half is folded down onto the bottom half.', inR: ([, w]) => w >= 2, refl: ([c, w]) => [c, 3 - w], line: [P0, 30, P0 + PS, 30], region: [[P0, 30], [P0 + PS, 30], [P0 + PS, P0 + PS], [P0, P0 + PS]], from: [30, 18], to: [30, 42] },
  BT: { say: 'The bottom half is folded up onto the top half.', inR: ([, w]) => w <= 1, refl: ([c, w]) => [c, 3 - w], line: [P0, 30, P0 + PS, 30], region: [[P0, P0], [P0 + PS, P0], [P0 + PS, 30], [P0, 30]], from: [30, 42], to: [30, 18] },
  DG: { say: 'The paper is folded along the diagonal, so the top-right corner goes onto the bottom-left corner.', inR: ([c, w]) => w > c, refl: ([c, w]) => [w, c], line: [P0, P0, P0 + PS, P0 + PS], region: [[P0, P0], [P0 + PS, P0 + PS], [P0, P0 + PS]], from: [40, 20], to: [20, 40] }
};
const holeKey = hs => hs.map(h => h.join(',')).sort().join(' ');
const paperSVG = (holes, extra) => svgOpen(60, 60) + frame(0, 0) + `<rect x="${P0}" y="${P0}" width="${PS}" height="${PS}" fill="#fff" stroke="${INK}" stroke-width="1.5"/>` + (extra || '') + holes.map(([c, w]) => `<circle cx="${rnd(C(c))}" cy="${rnd(C(w))}" r="3.6" fill="${INK}"/>`).join('') + '</svg>';
function foldPunch(r, d) {
  for (let t = 0; t < 40; t++) {
    const seq = d === 1 ? [r.pick(['LR', 'RL', 'TB', 'BT'])] : d === 2 ? [r.pick(['LR', 'RL', 'TB', 'BT', 'DG'])] : r.pick([[r.pick(['LR', 'RL']), r.pick(['TB', 'BT'])], [r.pick(['TB', 'BT']), r.pick(['LR', 'RL'])], ['DG']]);
    const cellsAll = []; for (let c = 0; c < 4; c++) for (let w = 0; w < 4; w++) cellsAll.push([c, w]);
    const region = cellsAll.filter(p => seq.every(f => FOLDS[f].inR(p)));
    const n = d === 1 ? r.int(1, 2) : r.int(2, 3), punched = r.sample(region, Math.min(n, region.length)); if (!punched.length) continue;
    // unfold: undo the folds in reverse order, each time adding the mirror images
    let holes = punched.slice(); for (let i = seq.length - 1; i >= 0; i--) holes = holes.concat(holes.map(FOLDS[seq[i]].refl));
    const uniq = hs => { const m = new Map(); hs.forEach(h => m.set(h.join(','), h)); return [...m.values()]; };
    holes = uniq(holes);
    const other = { LR: 'TB', RL: 'BT', TB: 'LR', BT: 'RL', DG: 'LR' };
    const wrongs = [
      punched, uniq(punched.concat(punched.map(FOLDS[other[seq[0]]].refl))),
      uniq(punched.concat(punched.map(([c, w]) => seq[0] === 'LR' || seq[0] === 'RL' ? [c >= 2 ? c - 2 : c + 2, w] : seq[0] === 'DG' ? [3 - w, 3 - c] : [c, w >= 2 ? w - 2 : w + 2]))),
      holes.slice(1), uniq(holes.concat([r.pick(cellsAll)])), uniq(holes.map(([c, w]) => [3 - c, 3 - w])), uniq(holes.map(([c, w]) => [c, (w + 1) % 4]))
    ].filter(x => x.length);
    const o = pick5(r, holes, r.shuffle(wrongs.slice(0, 3)).concat(r.shuffle(wrongs.slice(3))), holeKey, h => paperSVG(h));
    if (!o) continue;
    // the question: each fold shown in turn, then the folded paper with the holes punched through it
    const id = uid(); let s = svgOpen(68 * (seq.length + 1) - 8, 60), shape = [[P0, P0], [P0 + PS, P0], [P0 + PS, P0 + PS], [P0, P0 + PS]];
    const clip = (poly, f) => { const R = FOLDS[f].region; const xs = R.map(p => p[0]), ys = R.map(p => p[1]); if (f === 'DG') return R; return poly.map(([x, y]) => [Math.min(Math.max(x, Math.min(...xs)), Math.max(...xs)), Math.min(Math.max(y, Math.min(...ys)), Math.max(...ys))]); };
    seq.forEach((f, i) => {
      const F = FOLDS[f], ox = i * 68;
      s += frame(ox, 0) + `<g transform="translate(${ox} 0)">${arrowHead(id + i)}<polygon points="${shape.map(p => p.join(',')).join(' ')}" fill="#fff" stroke="${INK}" stroke-width="1.5"/>${line(F.line[0], F.line[1], F.line[2], F.line[3], 1.6, true)}<path d="M${F.from[0]} ${F.from[1]} Q30 ${f === 'TB' || f === 'BT' ? 30 : 4} ${F.to[0]} ${F.to[1]}" fill="none" stroke="#e8590c" stroke-width="2" marker-end="url(#${id + i})"/></g>`;
      shape = clip(shape, f);
    });
    const ox = seq.length * 68;
    s += frame(ox, 0) + `<g transform="translate(${ox} 0)"><polygon points="${shape.map(p => p.join(',')).join(' ')}" fill="#e9ecef" stroke="${INK}" stroke-width="1.5"/>${punched.map(([c, w]) => `<circle cx="${rnd(C(c))}" cy="${rnd(C(w))}" r="3.6" fill="${INK}"/>`).join('')}</g></svg>`;
    return result('A square of paper is folded as shown, then holes are punched right through it. What does the paper look like when it is unfolded?', s, o, 'Each hole goes through every layer of paper. When you unfold, each hole appears again as a mirror image across the fold line.',
      seq.map(f => FOLDS[f].say).concat([`${punched.length === 1 ? 'One hole is' : punched.length + ' holes are'} punched through all the layers.`, seq.length > 1 ? 'Unfold one fold at a time, starting with the last fold. Each time, every hole is reflected across that fold line, so the number of holes doubles.' : 'When the paper is unfolded, each hole is reflected across the fold line, so there are twice as many holes.', `Altogether there are ${holes.length} holes.`]));
  }
  return null;
}
T.paper_folding = fresh(foldPunch);

// ================================================================ complete the symmetry
const GN = 6, GC = 7, GO = 9;
const gridSVG = (cells, axis, half) => {
  let s = svgOpen(60, 60) + frame(0, 0);
  for (let i = 0; i <= GN; i++) s += `<line x1="${GO}" y1="${GO + i * GC}" x2="${GO + GN * GC}" y2="${GO + i * GC}" stroke="#dfe5ee" stroke-width=".8"/><line x1="${GO + i * GC}" y1="${GO}" x2="${GO + i * GC}" y2="${GO + GN * GC}" stroke="#dfe5ee" stroke-width=".8"/>`;
  cells.forEach(([c, w, f]) => { s += `<rect x="${GO + c * GC}" y="${GO + w * GC}" width="${GC}" height="${GC}" fill="${f === 'g' ? '#9aa5b1' : INK}"/>`; });
  s += `<rect x="${GO}" y="${GO}" width="${GN * GC}" height="${GN * GC}" fill="none" stroke="${INK}" stroke-width="1.2"/>`;
  if (half) { const M = GO + GN * GC / 2, E = GO + GN * GC; s += axis === 'v' ? `<line x1="${M}" y1="${GO - 4}" x2="${M}" y2="${E + 4}" stroke="#e8590c" stroke-width="2" stroke-dasharray="4 3"/>` : axis === 'h' ? `<line x1="${GO - 4}" y1="${M}" x2="${E + 4}" y2="${M}" stroke="#e8590c" stroke-width="2" stroke-dasharray="4 3"/>` : `<line x1="${GO - 3}" y1="${GO - 3}" x2="${E + 3}" y2="${E + 3}" stroke="#e8590c" stroke-width="2" stroke-dasharray="4 3"/>`; }
  return s + '</svg>';
};
const SREF = { v: ([c, w, f]) => [GN - 1 - c, w, f], h: ([c, w, f]) => [c, GN - 1 - w, f], d: ([c, w, f]) => [w, c, f] };
const cellKey = cs => cs.map(x => x.join(',')).sort().join(' ');
function symmetry(r, d) {
  for (let t = 0; t < 40; t++) {
    const axis = d === 1 ? r.pick(['v', 'h']) : d === 2 ? r.pick(['v', 'h', 'v']) : r.pick(['d', 'v', 'h', 'd']);
    const side = ([c, w]) => axis === 'v' ? c < GN / 2 : axis === 'h' ? w < GN / 2 : w > c;
    const all = []; for (let c = 0; c < GN; c++) for (let w = 0; w < GN; w++) if (side([c, w])) all.push([c, w]);
    const n = d === 1 ? r.int(3, 5) : d === 2 ? r.int(5, 7) : r.int(6, 9);
    const half = r.sample(all, n).map(([c, w]) => [c, w, d >= 2 && r() < .35 ? 'g' : 'b']);
    const full = half.concat(half.map(SREF[axis]));
    if (cellKey(full) === cellKey(full.map(SREF[axis === 'v' ? 'h' : 'v']))) continue;   // the whole pattern would look the same flipped the other way
    const shift = axis === 'v' ? ([c, w, f]) => [c + GN / 2, w, f] : axis === 'h' ? ([c, w, f]) => [c, w + GN / 2, f] : ([c, w, f]) => [w, c, f];
    const wrongAxis = axis === 'v' ? SREF.h : axis === 'h' ? SREF.v : ([c, w, f]) => [GN - 1 - w, GN - 1 - c, f];
    const flipped = full.map(([c, w, f]) => [c, w, f === 'g' ? 'b' : f]);
    const oneOff = () => { const k = r.int(0, half.length - 1), m = half.map(SREF[axis]); const [c, w, f] = m[k]; m[k] = axis === 'v' ? [c, (w + 1) % GN, f] : [(c + 1) % GN, w, f]; return half.concat(m); };
    const wrongs = [half.concat(half.map(shift)), half.concat(half.map(wrongAxis)).filter(([c, w]) => c >= 0 && w >= 0 && c < GN && w < GN), oneOff(), oneOff(), d >= 2 ? flipped : half, half.concat(half.map(([c, w, f]) => [GN - 1 - c, GN - 1 - w, f]))];
    const o = pick5(r, full, wrongs, cellKey, cs => gridSVG(cs));
    if (!o) continue;
    const word = axis === 'v' ? 'upright' : axis === 'h' ? 'flat' : 'diagonal';
    return result(`Which picture shows the pattern completed so that it is symmetrical about the ${word} dashed line?`, gridSVG(half, axis, true), o, 'Each square on one side has a partner on the other side, the same distance from the mirror line.',
      [`The mirror line is ${word}. Every shaded square needs a matching square on the other side, the same distance from the line.`, axis === 'd' ? 'For a diagonal line, a square moves across the diagonal: its row and column swap.' : 'Count the squares from the mirror line to each shaded square, then count the same number on the other side.', 'Watch out for answers where the half is copied across (slid) instead of reflected, and check the grey squares stay grey.']);
  }
  return null;
}
T.symmetry_complete = fresh(symmetry);

// ================================================================ join the shapes (no turning or flipping)
const PIECES = [[[0, 0], [1, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1], [0, 2]], [[0, 0], [1, 0], [0, 1]], [[0, 0], [1, 0], [1, 1]], [[0, 0], [0, 1], [1, 1]], [[1, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [2, 0], [0, 1]], [[0, 0], [1, 0], [2, 0], [2, 1]], [[0, 0], [0, 1], [0, 2], [1, 2]], [[1, 0], [1, 1], [1, 2], [0, 2]], [[0, 0], [1, 0], [1, 1], [2, 1]], [[1, 0], [2, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [2, 0], [1, 1]], [[1, 0], [0, 1], [1, 1], [2, 1]], [[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [0, 1], [1, 1], [1, 2]]];
const normC = cs => { const mx = Math.min(...cs.map(c => c[0])), my = Math.min(...cs.map(c => c[1])); return cs.map(([x, y]) => [x - mx, y - my]); };
const ck = cs => normC(cs).map(c => c.join(',')).sort().join(' ');
const rot90 = cs => normC(cs.map(([x, y]) => [-y, x])), flipX = cs => normC(cs.map(([x, y]) => [-x, y]));
const has = (cs, [x, y]) => cs.some(c => c[0] === x && c[1] === y);
function canMake(S, A, B) {   // can S be made from A and B placed side by side, without turning or flipping?
  S = normC(S); if (S.length !== A.length + B.length) return false;
  const w = Math.max(...S.map(c => c[0])), h = Math.max(...S.map(c => c[1]));
  for (let dx = 0; dx <= w; dx++) for (let dy = 0; dy <= h; dy++) {
    const a = A.map(([x, y]) => [x + dx, y + dy]); if (!a.every(c => has(S, c))) continue;
    const rest = S.filter(c => !has(a, c)); if (ck(rest) === ck(B)) return true;
  }
  return false;
}
const piecesSVG = (cs, fill, ox, oy, u) => cs.map(([x, y]) => `<rect x="${rnd(ox + x * u)}" y="${rnd(oy + y * u)}" width="${u}" height="${u}" fill="${fill}" stroke="${INK}" stroke-width="1.2"/>`).join('');
const shapeOpt = cs => { cs = normC(cs); const w = Math.max(...cs.map(c => c[0])) + 1, h = Math.max(...cs.map(c => c[1])) + 1, u = Math.min(9, 46 / Math.max(w, h)); return svgOpen(60, 60) + frame(0, 0) + piecesSVG(cs, '#c9d2de', 30 - w * u / 2, 30 - h * u / 2, u) + '</svg>'; };
function joinShapes(r, d) {
  for (let t = 0; t < 60; t++) {
    const pool = d === 1 ? PIECES.slice(0, 8) : d === 2 ? PIECES.slice(2) : PIECES.slice(8);
    const A = r.pick(pool), B = r.pick(PIECES.slice(d === 1 ? 0 : 2));
    // place B touching A along at least one edge, without overlapping
    const spotsOK = []; for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) { const b = B.map(([x, y]) => [x + dx, y + dy]); if (b.some(c => has(A, c))) continue; if (b.some(([x, y]) => has(A, [x + 1, y]) || has(A, [x - 1, y]) || has(A, [x, y + 1]) || has(A, [x, y - 1]))) spotsOK.push(b); }
    if (!spotsOK.length) continue;
    const right = normC(A.concat(r.pick(spotsOK)));
    const cands = [];
    const place = (P, Q) => { const out = []; for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) { const q = Q.map(([x, y]) => [x + dx, y + dy]); if (!q.some(c => has(P, c)) && q.some(([x, y]) => has(P, [x + 1, y]) || has(P, [x - 1, y]) || has(P, [x, y + 1]) || has(P, [x, y - 1]))) out.push(normC(P.concat(q))); } return out; };
    [rot90(B), flipX(B), rot90(rot90(B)), rot90(A), flipX(A)].forEach((X, i) => { const P = i < 3 ? A : X, Q = i < 3 ? X : B; r.shuffle(place(P, Q)).slice(0, 2).forEach(c => cands.push(c)); });
    // one square too many or too few
    const grow = right.concat([[right[0][0] - 1, right[0][1]]]); cands.push(normC(grow)); cands.push(normC(right.slice(0, -1)));
    const wrongs = r.shuffle(cands).filter(c => !canMake(c, A, B) && new Set(c.map(x => x.join())).size === c.length);
    const o = pick5(r, right, wrongs, ck, shapeOpt);
    if (!o) continue;
    const s = svgOpen(128, 60) + frame(0, 0) + piecesSVG(normC(A), '#9aa5b1', 30 - (Math.max(...A.map(c => c[0])) + 1) * 4.5, 30 - (Math.max(...A.map(c => c[1])) + 1) * 4.5, 9) + `<text x="64" y="36" text-anchor="middle" font-size="16" font-weight="700" fill="#5b6b7c" font-family="system-ui,sans-serif">+</text>` + frame(68, 0) + piecesSVG(normC(B), '#ffffff', 98 - (Math.max(...B.map(c => c[0])) + 1) * 4.5, 30 - (Math.max(...B.map(c => c[1])) + 1) * 4.5, 9) + '</svg>';
    return result('These two pieces are joined together edge to edge. They are not turned or flipped. Which shape could they make?', s, o, 'Count the squares first: the answer must have the same number of squares as the two pieces together. Then look for each piece, facing the same way.',
      [`The pieces have ${A.length} and ${B.length} squares, so the answer must have ${A.length + B.length} squares.`, 'Find the first piece inside each option, facing exactly the same way. Is the rest exactly the second piece, also facing the same way?', `Only option ${'ABCDE'[o.a]} can be split into the two pieces without turning or flipping either of them.`]);
  }
  return null;
}
T.combine_shapes = fresh(joinShapes);

// ================================================================ which figure belongs to the group
const POLYS = [['triangle', 3], ['square', 4], ['pentagon', 5], ['hexagon', 6]];
const FILLS = ['white', 'grey', 'black', 'stripes'];
const GROUP_RULES = [
  { lv: [1, 2], say: n => `Every figure in the group has exactly ${n} shapes.`, make: (r, ok, n) => { const k = ok ? n : r.pick([n - 1, n + 1].filter(x => x >= 1 && x <= 4)); const ps = r.shuffle([[17, 17], [43, 17], [17, 43], [43, 43]]).slice(0, k); return { els: ps.map(p => ({ s: r.pick(['circle', 'square', 'triangle', 'star', 'heart', 'diamond']), x: p[0], y: p[1], r: 8, f: r.pick(FILLS), rot: 0 })) }; }, param: r => r.int(2, 3) },
  { lv: [1, 2, 3], say: () => 'In every figure the number of dots matches the number of sides of the big shape.', make: (r, ok) => { const [s, n] = r.pick(POLYS), k = ok ? n : r.pick([n - 1, n + 1, n - 2].filter(x => x >= 1 && x <= 6)); const pts = [[22, 26], [38, 26], [22, 38], [38, 38], [30, 21], [30, 33]].slice(0, k); return { els: [{ s, x: 30, y: 31, r: 23, f: 'white', rot: 0 }], dots: pts.map(p => [p[0], p[1], 2.6, 'black']) }; } },
  { lv: [2, 3], say: () => 'In every figure the small shape inside is the same shape as the big one.', make: (r, ok) => { const big = r.pick(['circle', 'square', 'triangle', 'pentagon', 'hexagon', 'diamond']), small = ok ? big : r.pick(['circle', 'square', 'triangle', 'star', 'heart', 'diamond'].filter(x => x !== big)); return { els: [{ s: big, x: 30, y: 31, r: 22, f: r.pick(['white', 'grey']), rot: 0 }, { s: small, x: 30, y: 32, r: 8, f: r.pick(['black', 'white']), rot: 0 }] }; } },
  { lv: [2, 3], say: () => 'In every figure there are as many black shapes as white shapes.', make: (r, ok) => { const k = r.pick([2, 4]), nb = ok ? k / 2 : r.pick([0, 1, 3].filter(x => x !== k / 2 && x <= k)); const fills = r.shuffle(Array(nb).fill('black').concat(Array(k - nb).fill('white'))); const ps = r.shuffle([[17, 17], [43, 17], [17, 43], [43, 43]]).slice(0, k); return { els: ps.map((p, i) => ({ s: r.pick(['circle', 'square', 'triangle', 'star', 'heart']), x: p[0], y: p[1], r: 8, f: fills[i], rot: 0 })) }; } },
  { lv: [3], say: () => 'In every figure the small shape inside has one more side than the big shape.', make: (r, ok) => { const i = r.int(0, 2), [bs] = POLYS[i], j = ok ? i + 1 : r.pick([i, i + 2, i - 1].filter(x => x >= 0 && x < 4 && x !== i + 1)); return { els: [{ s: bs, x: 30, y: 31, r: 23, f: 'white', rot: 0 }, { s: POLYS[j][0], x: 30, y: 33, r: 8.5, f: r.pick(['black', 'grey']), rot: 0 }] }; } },
  { lv: [1, 2], say: () => 'Every figure has a black shape at the top and a white shape at the bottom.', make: (r, ok) => { const top = ok ? 'black' : r.pick(['white', 'grey']), bot = ok ? 'white' : r.pick(['black', 'white']); if (!ok && top === 'black' && bot === 'white') return null; return { els: [{ s: r.pick(['circle', 'square', 'star', 'heart', 'triangle']), x: 30, y: 17, r: 10, f: top, rot: 0 }, { s: r.pick(['circle', 'square', 'star', 'heart', 'triangle']), x: 30, y: 43, r: 10, f: bot, rot: 0 }] }; } }
];
function belongs(r, d) {
  for (let t = 0; t < 40; t++) {
    const rule = r.pick(GROUP_RULES.filter(g => g.lv.includes(d))), p = rule.param ? rule.param(r) : null;
    const mk = ok => { for (let k = 0; k < 20; k++) { const f = rule.make(r, ok, p); if (f) return f; } return null; };
    const group = [mk(true), mk(true), mk(true)], right = mk(true); if (group.some(g => !g) || !right) continue;
    if (new Set(group.concat([right]).map(key)).size < 4) continue;
    const wrongs = []; for (let k = 0; k < 10; k++) { const w = mk(false); if (w) wrongs.push(w); }
    const o = options(r, right, wrongs); if (!o) continue;
    const s = svgOpen(3 * 68 + 8, 76) + `<rect x="1" y="1" width="${3 * 68 + 6}" height="74" rx="10" fill="#f8fafc" stroke="${FRAME}" stroke-width="1.5" stroke-dasharray="5 4"/>` + group.map((g, i) => frame(i * 68 + 8, 8) + draw(g, i * 68 + 8, 8)).join('') + '</svg>';
    return result('The figures in the box all have something in common. Which figure belongs with them?', s, o, 'Say what is the same about every figure in the box. Ignore things that change from figure to figure.',
      ['Look at what changes from figure to figure (that cannot be the rule) and what stays the same.', rule.say(p), `Only option ${LET[o.a]} follows the same rule.`]);
  }
  return null;
}
T.belongs_group = fresh(belongs);

// ================================================================ which cube could NOT be made (added to nets)
function cubeNot(r, d) {
  for (let t = 0; t < 60; t++) {
    let cells = r.pick(NETS).map(c => c.slice());
    if (r() < .5) cells = cells.map(c => [-c[0], c[1]]);
    if (r() < .5) cells = cells.map(c => [c[1], c[0]]);
    const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1])); cells = cells.map(c => [c[0] - mx, c[1] - my]);
    const normals = fold(cells); if (normals.some(n => !n) || new Set(normals.map(vk)).size !== 6) continue;
    const syms = r.sample(SYM, 6), symAt = n => syms[normals.findIndex(m => vk(m) === vk(n))];
    const axes = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], corner = () => axes.map(a => r() < .5 ? a : vneg(a));
    const order = (tri, want) => { for (const p of r.shuffle([[0, 1, 2], [1, 2, 0], [2, 0, 1], [0, 2, 1], [2, 1, 0], [1, 0, 2]])) { const o = p.map(i => tri[i]); if (Math.sign(det3(o[0], o[1], o[2])) === want) return o; } };
    const fk = tri => tri.map(n => symAt(n).n).join('|');
    const good = [], seen = new Set();
    for (let k = 0; k < 40 && good.length < 4; k++) { const tri = order(corner(), 1), kk = fk(tri); if (!seen.has(kk)) { seen.add(kk); good.push(tri); } }
    if (good.length < 4) continue;
    let bad, why;
    if (d >= 2 && r() < .5) { bad = order(corner(), -1); why = 'mirror'; } else { const a = corner(), i = r.int(0, 2), j = (i + r.int(1, 2)) % 3; a[j] = vneg(a[i]); bad = r.shuffle(a); why = 'opposite'; }
    if (seen.has(fk(bad))) continue;
    const a = r.int(0, 4), list = good.slice(); list.splice(a, 0, bad);
    const of = list.map(tri => cubeSVG(symAt(tri[0]), symAt(tri[1]), symAt(tri[2])));
    const cw = Math.max(...cells.map(c => c[0])) + 1, ch = Math.max(...cells.map(c => c[1])) + 1, S = 26;
    let s = svgOpen(cw * S + 4, ch * S + 4, 1.3);
    cells.forEach((c, i) => { s += `<g transform="translate(${c[0] * S + 2} ${c[1] * S + 2}) scale(${S})"><rect width="1" height="1" fill="#fff" stroke="${INK}" stroke-width=".06"/>${syms[i].d}</g>`; });
    s += '</svg>';
    const pairs = [], done = new Set();
    normals.forEach((n, i) => { if (done.has(i)) return; const j = normals.findIndex(m => vk(m) === vk(vneg(n))); done.add(i); done.add(j); pairs.push(`${syms[i].n} and ${syms[j].n}`); });
    return { q: 'The net is folded to make a cube. Which cube could NOT be made from this net?', svg: s, of, opts: ABCDE, a,
      hint: 'Find the pairs of opposite faces first. A cube that shows two opposite faces at once is impossible.',
      steps: ['Faces that are opposite each other on the cube can never be seen together.', `On this net the opposite pairs are: ${pairs.join('; ')}.`, why === 'opposite' ? `Option ${LET[a]} shows two opposite faces next to each other, so it cannot be made.` : `Option ${LET[a]} shows three faces that do meet at a corner, but in the wrong order round the corner (a mirror image), so it cannot be made.`, 'The other four cubes can all be made by folding the net.', `The answer is ${LET[a]}.`] };
  }
  return null;
}
T.nets = since(2, 0.4, T.nets, cubeNot);

// ================================================================ reflection in a diagonal mirror line (added to reflections)
// Reflecting in the line from top-left to bottom-right swaps x and y, flips each shape and turns it to -90° - its angle.
const mirrorD = fig => ({ els: fig.els.map(e => Object.assign({}, e, { x: e.y, y: e.x, m: !e.m, rot: -90 - (e.rot || 0) })) });
function diagReflect(r, d) {
  for (let t = 0; t < 40; t++) {
    const fig = partsFigure(r, d === 3 ? 4 : 3); if (!symCheck(fig)) continue;
    const right = norm(mirrorD(fig));
    if (key(right) === key(norm(fig))) continue;
    const wrongs = [norm(mirrorV(fig)), norm(mirrorH(fig)), norm(turn(fig, 90)), norm(turn(fig, 270)), norm(nudge(r, right)), norm(turn(right, 180)), norm(fig)];
    const o = options(r, right, r.shuffle(wrongs.slice(0, 4)).concat(wrongs.slice(4)));
    if (!o) continue;
    const s = svgOpen(60, 60) + frame(0, 0) + draw(fig) + line(2, 2, 58, 58, 2, true) + '</svg>';
    return result('Which figure shows the shape reflected in the dashed diagonal mirror line?', s, o, 'For a diagonal mirror, imagine folding the box along the dashed line. Each part lands on the other side of the line, the same distance away.',
      ['The mirror line runs from the top-left corner to the bottom-right corner.', 'A part near the top edge ends up near the left edge, and a part near the right edge ends up near the bottom edge.', 'Each small shape is flipped as well as moved. Options that are only turned, or reflected in an upright or flat line, are wrong.']);
  }
  return null;
}
const reflectOld = T.reflections;   // level 1 keeps the upright and flat mirrors; a diagonal mirror is too hard there
T.reflections = since(2, 0.35, reflectOld, (r, d) => d >= 2 ? diagReflect(r, d) : reflectOld(r, d));

// ================================================================ more hidden shapes (a bigger library of shapes)
const HLIB = [
  [[0, 0], [2, 0], [2, 1], [1, 1], [1, 2], [0, 2]], [[0, 0], [3, 0], [2, 2], [0, 2]], [[0, 0], [2, 0], [3, 2], [1, 2]], [[0, 0], [3, 1], [0, 2]], [[0, 1], [1, 0], [3, 0], [3, 2], [1, 2]],
  [[0, 0], [2, 0], [2, 3], [1, 2], [0, 3]], [[0, 0], [3, 0], [3, 1], [1, 1], [1, 2], [0, 2]], [[1, 0], [2, 1], [1, 3], [0, 1]], [[0, 0], [1, 0], [3, 2], [0, 2]], [[0, 2], [1, 0], [3, 0], [2, 2]],
  [[0, 0], [1, 1], [2, 0], [2, 2], [0, 2]], [[0, 1], [1, 0], [2, 1], [1, 3]], [[0, 0], [3, 0], [3, 3], [2, 3], [2, 1], [0, 1]], [[0, 0], [2, 0], [2, 2], [1, 3], [0, 2]], [[1, 0], [3, 0], [2, 2], [0, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [0, 2]], [[0, 1], [2, 0], [2, 2], [0, 3]], [[0, 0], [2, 1], [3, 0], [3, 2], [0, 2]], [[1, 0], [2, 0], [3, 1], [3, 2], [0, 2], [0, 1]], [[0, 0], [3, 0], [1, 1], [1, 3], [0, 3]]
];
function hidden2(r, d) {
  const U = 18;
  const poly = (pts, u, ox, oy) => `<polygon points="${pts.map(p => rnd((ox || 0) + p[0] * u) + ',' + rnd((oy || 0) + p[1] * u)).join(' ')}" fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
  const mir = s => { const mx = Math.max(...s.map(p => p[0])); return s.map(p => [mx - p[0], p[1]]); };
  const rot = s => { const my = Math.max(...s.map(p => p[1])); return s.map(p => [my - p[1], p[0]]); };
  const same = (a, b) => { const k = s => s.map(p => p.join(',')).sort().join(' '); return k(a) === k(b); };
  const variants = s => [s, mir(s), rot(s), rot(rot(s)), rot(rot(rot(s))), mir(rot(s)), mir(rot(rot(s))), mir(rot(rot(rot(s))))];
  for (let t = 0; t < 40; t++) {
    const target = r.pick(HLIB), w = Math.max(...target.map(p => p[0])), h = Math.max(...target.map(p => p[1]));
    const ox = r.int(0, 6 - w), oy = r.int(0, 6 - h);
    let body = poly(target.map(p => [p[0] + ox, p[1] + oy]), U);
    const decoys = r.sample(HLIB.filter(s => s !== target), 3), avoid = variants(target).concat(decoys.flatMap(variants));
    const extraLib = HLIB.filter(s => !avoid.some(v => same(v, s))); if (extraLib.length < 2) continue;
    for (let k = 0; k < d + 1; k++) { const e = r.pick(extraLib), ex = r.int(0, 6 - Math.max(...e.map(p => p[0]))), ey = r.int(0, 6 - Math.max(...e.map(p => p[1]))); body += poly(e.map(p => [p[0] + ex, p[1] + ey]), U); }
    for (let k = 0; k < d - 1; k++) body += line(r.int(0, 6) * U, r.int(0, 6) * U, r.int(0, 6) * U, r.int(0, 6) * U, 2);
    const uniq = []; [mir(target), rot(target), rot(rot(target)), ...decoys].forEach(s => { if (!uniq.some(u => same(u, s)) && !same(s, target)) uniq.push(s); });
    if (uniq.length < 4) continue;
    const opt = s => { const ww = Math.max(...s.map(p => p[0])), hh = Math.max(...s.map(p => p[1])); return svgOpen(60, 60) + frame(0, 0) + poly(s, 16, 30 - ww * 8, 30 - hh * 8) + '</svg>'; };
    const list = r.shuffle(uniq).slice(0, 4), a = r.int(0, 4); list.splice(a, 0, target);
    const big = svgOpen(120, 120, 1.2) + `<rect x="1" y="1" width="118" height="118" rx="6" fill="#fff" stroke="${FRAME}" stroke-width="1.5"/><g transform="translate(6 6)">${body}</g></svg>`;
    return { q: 'Which shape is hidden in the big figure? It is the same size and turned the same way.', svg: big, of: list.map(opt), opts: ABCDE, a, hint: 'Pick the most unusual corner or angle in each option and hunt for it in the big figure. Then trace the outline with your eyes.',
      steps: ['A hidden shape is exactly the same size and faces the same way. It is not turned or flipped.', 'Start with the sharpest point or a slanted side of each option, and look for that exact corner in the big figure.', `Option ${LET[a]} can be traced all the way round inside the figure. The others are flipped or turned, or are not there at all.`, `The answer is ${LET[a]}.`] };
  }
  return null;
}
T.hidden_shapes = since(2, 0.5, T.hidden_shapes, hidden2);

// ================================================================ grids where the third box combines the first two (added to matrices)
const SEGS = [[8, 8, 52, 8], [52, 8, 52, 52], [8, 52, 52, 52], [8, 8, 8, 52], [8, 8, 52, 52], [52, 8, 8, 52], [30, 8, 30, 52], [8, 30, 52, 30]];
const segFig = ids => ({ lines: ids.slice().sort((a, b) => a - b).map(i => SEGS[i].concat([2.4])) });
function overlay(r, d) {
  for (let t = 0; t < 40; t++) {
    const xor = d === 3 && r() < .7, rows = [];
    for (let i = 0; i < 3; i++) { const A = r.sample([0, 1, 2, 3, 4, 5, 6, 7], r.int(2, 3)), B = r.sample([0, 1, 2, 3, 4, 5, 6, 7], r.int(2, 3)); const both = A.filter(x => B.includes(x)); if (!xor && both.length) { i--; continue; } if (xor && !both.length) { i--; continue; } const Cc = xor ? A.concat(B).filter(x => !(A.includes(x) && B.includes(x))) : Array.from(new Set(A.concat(B))); if (Cc.length < 2) { i--; continue; } rows.push([A, B, Cc]); }
    const right = segFig(rows[2][2]);
    const [A, B] = rows[2], unionAB = Array.from(new Set(A.concat(B)));
    const wrongs = [segFig(xor ? unionAB : unionAB.filter(x => !(A.includes(x) && B.includes(x)))), segFig(A), segFig(B), segFig(rows[2][2].slice(1)), segFig(rows[2][2].concat([r.pick([0, 1, 2, 3, 4, 5, 6, 7].filter(x => !rows[2][2].includes(x)))])), segFig(rows[1][2]), segFig(rows[0][2])];
    const o = options(r, right, wrongs.filter(w => w.lines.length)); if (!o) continue;
    let s = svgOpen(196, 196, 1);
    rows.flat().forEach((ids, k) => { const x = (k % 3) * 68, y = Math.floor(k / 3) * 68; s += k === 8 ? qmark(x, y) : frame(x, y) + draw(segFig(ids), x, y); });
    s += '</svg>';
    return result('Which figure completes the grid?', s, o, 'Look along each row. How is the third box made from the first two?',
      ['Look along each row and compare the third box with the first two.', xor ? 'The third box shows the lines from the first two boxes put together, but any line that is in BOTH boxes disappears.' : 'The third box is the first two boxes put on top of each other: it has every line from both.', 'Do the same with the first two boxes of the bottom row.']);
  }
  return null;
}
const matrixOld = T.matrices;
T.matrices = since(2, 0.35, matrixOld, (r, d) => d >= 2 ? overlay(r, d) : matrixOld(r, d));
})();
