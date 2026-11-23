/* Shared tools for the question generators (Maths, Verbal Reasoning and Non-Verbal Reasoning).
   Each subject registers a table of topic generators. Every question comes from a seed, so its id
   (g-<subject>-<topic>-<level>-<seed>) always rebuilds the same question for history and revision. */
(function () {
'use strict';
function rng(seed) {
  let a = seed >>> 0;
  const r = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  r.pick = arr => arr[Math.floor(r() * arr.length)];
  r.shuffle = arr => { arr = arr.slice(); for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  r.sample = (arr, k) => r.shuffle(arr).slice(0, k);
  return r;
}
// Five answer options: the right one plus four wrong ones (common mistakes first, then near misses).
function choices(r, ans, wrongs, fmt, step) {
  fmt = fmt || String; step = step || 1;
  const A = fmt(ans), seen = new Set([A]), out = [];
  // A wrong option must never equal the answer in value (2/4 when the answer is 1/2, or 0.50 and 0.5).
  const val = x => { const t = String(x).trim(); let m = /^(\d+)\/(\d+)$/.exec(t); if (m && +m[2]) return +m[1] / +m[2]; m = /^-?\d+(\.\d+)?$/.exec(t); return m ? +t : null; };
  const av = val(A);
  const add = w => { if (w === undefined || w === null || (typeof w === 'number' && (!isFinite(w) || w < 0 || (Number.isInteger(ans) && !Number.isInteger(w))))) return; const s = fmt(w); if (/\d\.\d{5,}/.test(s) && !/\d\.\d{5,}/.test(A)) return; if (av !== null && val(s) !== null && Math.abs(val(s) - av) < 1e-9) return; if (!seen.has(s) && out.length < 4) { seen.add(s); out.push(s); } };
  r.shuffle(wrongs.slice(0, 3)).concat(wrongs.slice(3)).forEach(add);
  for (let k = 1; out.length < 4 && typeof ans === 'number' && k < 60; k++) { add(Math.round((ans + k * step) * 1e6) / 1e6); add(Math.round((ans - k * step) * 1e6) / 1e6); }
  if (out.length < 4) return null;
  const a = r.int(0, 4); out.splice(a, 0, A);
  return { opts: out, a, A };
}
// Builds a question object; returns null if the options could not be made (the generator then tries another seed).
function Q(text, c, hint, steps, extra) { return c ? Object.assign({ q: text, opts: c.opts, a: c.a, hint, steps: steps.concat([`The answer is ${c.A}.`]) }, extra || {}) : null; }
const N = n => Number(n).toLocaleString('en-GB', { maximumFractionDigits: 3 });
const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
// ver: bump when a subject's generators change, so ids made before the change still rebuild the old questions.
// Generators read r.v (the version an id was made with) and only use new question types when r.v >= the version they arrived in.
function register(subject, table, ver) {
  ver = ver || 1;
  const make = (topic, d, seed, v) => {
    const g = table[topic]; if (!g) return null;
    v = v || ver;
    for (let k = 0; k < 8; k++) {
      let q = null;
      try { const r = rng(seed + k * 7919); r.v = v; q = g(r, d); } catch (e) { q = null; }
      if (q && q.opts && q.opts.length === 5 && new Set(q.opts).size === 5) { q.id = `g${v > 1 ? v : ''}-${subject}-${topic}-${d}-${seed}`; q.topic = topic; q.d = d; q.gen = true; return q; }
    }
    return null;
  };
  const fromId = id => { const m = new RegExp(`^g(\\d*)-${subject}-([a-z_0-9]+)-(\\d)-(\\d+)$`).exec(id); return m ? make(m[2], +m[3], +m[4], m[1] ? +m[1] : 1) : null; };
  const batch = (topic, n) => { const out = []; for (let d = 1; d <= 3; d++) for (let i = 0; i < n; i++) { const q = make(topic, d, Math.floor(Math.random() * 1e9)); if (q) out.push(q); } return out; };
  window.GENS = window.GENS || {};
  window.GENS[subject] = { get topics() { return Object.keys(table); }, make, fromId, batch, ver, table };
}
// Mixes a newer question type into an existing generator without changing questions made by older versions.
const since = (v, share, base, extra) => (r, d) => (r.v >= v && r() < share ? extra(r, d) : base(r, d));
window.GENCORE = { rng, choices, Q, N, gcd, register, since };
})();
