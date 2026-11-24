/* 11+ Explorer. All progress is stored on this device only (browser localStorage). */
(function () {
'use strict';

// ---------------------------------------------------------------- setup
// ---- children on this device: each child has their own saved progress; the parent PIN is shared
const PKEY = 'elevenplus.profiles';
const sync = { fb: null, user: null, status: '', last: null, timer: null, busy: false, ready: false };   // cloud sync state (see the sync section)
const AVATARS = ['🦊', '🐼', '🦁', '🐯', '🐸', '🐙', '🦄', '🐧', '🐨', '🐬', '🦉', '🐲'];
const keyFor = id => id === 'p1' ? 'elevenplus.v1' : 'elevenplus.v1.' + id;   // the first child keeps the original key, so nothing is lost
function loadMeta() {
  let m = null; try { m = JSON.parse(localStorage.getItem(PKEY)); } catch (e) { /* storage blocked */ }
  if (m && Array.isArray(m.list) && m.list.length) return m;
  let first = {}; try { first = JSON.parse(localStorage.getItem('elevenplus.v1')) || {}; } catch (e) { /* none yet */ }
  return { list: [{ id: 'p1', name: (first.settings && first.settings.name) || '', avatar: '🦉' }], current: 'p1', pin: first.settings && first.settings.pin };
}
let meta = loadMeta();
function saveMetaLocal() { try { localStorage.setItem(PKEY, JSON.stringify(meta)); } catch (e) { /* storage blocked */ } }
function saveMeta() { saveMetaLocal(); if (sync.user) sync.fb.F.setDoc(familyRef(), { meta: { list: meta.list, pin: meta.pin || null }, updatedAt: Date.now() }).catch(() => {}); }
if (!meta.list.some(p => p.id === meta.current)) meta.current = meta.list[0].id;
let KEY = keyFor(meta.current);
const me = () => meta.list.find(p => p.id === meta.current);
const SUBJECTS = [
  { id: 'maths', name: 'Maths', icon: '➗', c: '#3b5bdb' },
  { id: 'english', name: 'English', icon: '📖', c: '#ae3ec9' },
  { id: 'vr', name: 'Verbal Reasoning', icon: '🔤', c: '#e8590c' },
  { id: 'nvr', name: 'Non-Verbal Reasoning', icon: '🔷', c: '#0c8599' }
];
// The exam setting changes the pace of timed tests. More differences can hang off this later (mock exam formats).
const BOARDS = {
  kent: { name: 'Kent Test (GL Assessment style)', pace: 60, note: 'Multiple choice with five options, at about one minute per question.' },
  gl: { name: 'Another GL Assessment area', pace: 60, note: 'Multiple choice with five options, at about one minute per question.' },
  cem: { name: 'CEM style', pace: 45, note: 'Multiple choice at a faster pace, so timed tests include more questions.' },
  iseb: { name: 'ISEB Common Pre-Test style', pace: 50, note: 'On-screen multiple choice at a brisk pace.' }
};
const WEEK = [
  { label: 'Flashcards', sid: null, kind: 'light' }, { label: 'Maths', sid: 'maths', kind: 'learn' },
  { label: 'English', sid: 'english', kind: 'learn' }, { label: 'Verbal', sid: 'vr', kind: 'learn' },
  { label: 'Non-verbal', sid: 'nvr', kind: 'learn' }, { label: 'Maths', sid: 'maths', kind: 'learn' },
  { label: 'Timed test', sid: null, kind: 'test' }
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MODE = { exercise: 'Exercise', quiz: 'Quiz', test: '10-minute test', revision: 'Revision', mock: 'Mock exam', fix: 'Fix my mistakes' };
const LEVEL = ['', 'Warm-up', 'Stretch', 'Challenge'];
const PRAISE = ['Spot on!', 'Brilliant!', 'You got it!', 'Great thinking!', 'Exactly right!', 'Super work!', 'Nailed it!'];
const KINDLY = ['Good try!', 'Nice effort!', 'So close!', 'Good thinking. Let\'s look at this one together.', 'Tricky one. Here\'s the method.'];
const INTERVALS = [1, 3, 7];

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Turns 3/4 into a stacked fraction and keeps line breaks.
const rich = s => esc(s).replace(/(\d+)\/(\d+)/g, '<span class="frac"><span>$1</span><span>$2</span></span>').replace(/\n/g, '<br>');
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
// Answer options are shuffled each time a question is shown, so the right answer is never in a remembered place.
// Questions whose explanation names a letter ("the answer is D") or depends on option order keep their order.
const NOSHUF = /\b(?:[Ii]s|[Oo]ptions?|[Ff]igure|[Ss]hape|[Aa]nswer|[Cc]hoice|[Ll]etter)\s+[A-E]\b|\b[A-E]\)|\([A-E]\)|\b[Aa]bove\b|\b[Bb]oth\b|[Nn]one of/;
const canShuffle = q => !q.of && !NOSHUF.test([q.hint].concat(q.steps, q.opts).join(' '));
function prep(q) {
  if (!canShuffle(q)) return q;
  const perm = shuffle(q.opts.map((_, i) => i));
  return Object.assign({}, q, { opts: perm.map(i => q.opts[i]), a: perm.indexOf(q.a), perm });
}
// Turns a chosen option back into its place in the question bank, so history and review stay consistent.
const orig = (q, c) => c === null || c === undefined || !q.perm ? c : q.perm[c];
const canSpeak = () => 'speechSynthesis' in window;
// Running inside the iOS or Android app (Capacitor) rather than a browser.
const isNative = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const canPrint = () => !isNative();
const buzz = ms => { try { if (isNative() && navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* optional */ } };
function speak(text) {
  if (!canSpeak()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/\s+/g, ' ').replace(/(\d+)\/(\d+)/g, '$1 over $2'));
  const v = speechSynthesis.getVoices().find(x => /en-GB/i.test(x.lang));
  if (v) u.voice = v;
  u.lang = 'en-GB'; u.rate = 0.92;
  speechSynthesis.speak(u);
}
function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4500);
}

const dstr = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const today = () => dstr(new Date());
const plusDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return dstr(d); };
const fmtWhen = ts => { const d = new Date(ts); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const fmtSecs = s => s < 60 ? s + ' s' : Math.floor(s / 60) + ' min ' + (s % 60 ? (s % 60) + ' s' : '');

// ---------------------------------------------------------------- saved state
const fresh = () => ({ v: 1, settings: { board: 'kent' }, stars: 0, streak: 0, lastDay: null, badges: {}, topic: {}, q: {}, review: {}, history: [], last: null, time: {}, lessons: {}, plan: null, flashDay: null });
let storageOK = true;
function load() {
  try { const r = localStorage.getItem(KEY); if (r) return Object.assign(fresh(), JSON.parse(r)); } catch (e) { storageOK = false; }
  return fresh();
}
function save() { st.savedAt = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { storageOK = false; } if (sync.user) syncSoon(); }
let st = load();
if (!meta.pin && st.settings.pin) meta.pin = st.settings.pin;
saveMeta();

// ---------------------------------------------------------------- question bank
const B = id => (window.BANK || {})[id];
const ready = id => !!(B(id) && B(id).questions && B(id).questions.length);
// Fresh generated questions are added each time the app opens: non-verbal reasoning puzzles, maths and verbal reasoning.
const GEN_PER_LEVEL = { nvr: 12, maths: 8, vr: 8, english: 8 };
Object.keys(window.GENS || {}).forEach(sid => { if (!ready(sid)) return; const g = window.GENS[sid]; g.topics.forEach(t => { if (B(sid).topics.some(x => x.id === t)) B(sid).questions.push(...g.batch(t, GEN_PER_LEVEL[sid] || 6)); }); });
const QIraw = {};
SUBJECTS.forEach(s => { if (ready(s.id)) B(s.id).questions.forEach(q => { q.subject = s.id; QIraw[q.id] = q; }); });
// Exact duplicate questions are kept for looking up old history, but taken out of the pool so they are never asked twice.
SUBJECTS.forEach(s => { if (!ready(s.id)) return; const seen = new Set(); B(s.id).questions = B(s.id).questions.filter(q => { const k = q.q + '|' + (q.svg || '') + '|' + (q.of || q.opts).join('|'); if (seen.has(k)) return false; seen.add(k); return true; }); });
// Generated puzzles from earlier sessions are rebuilt from their id when history or revision needs them.
const QI = new Proxy(QIraw, { get: (t, k) => {
  if (t[k] || typeof k !== 'string') return t[k];
  const m = /^g\d*-([a-z]+)-/.exec(k), g = m && window.GENS && window.GENS[m[1]];
  if (g) { const q = g.fromId(k); if (q) { q.subject = m[1]; t[k] = q; } return q || undefined; }
  if (k.startsWith('ai-') && st.aiq && st.aiq[k]) return (t[k] = st.aiq[k]);
  return undefined;
} });
const firstReady = () => (SUBJECTS.find(s => ready(s.id)) || {}).id;
const subj = id => SUBJECTS.find(s => s.id === id);
const topicOf = (sid, tid) => B(sid).topics.find(t => t.id === tid);
const tkey = (sid, tid) => sid + '/' + tid;
const ts = (sid, tid) => st.topic[tkey(sid, tid)] || (st.topic[tkey(sid, tid)] = { level: 1, up: 0, down: 0, seen: 0, correct: 0, recent: [] });
const peek = (sid, tid) => st.topic[tkey(sid, tid)];
function accuracy(sid, tid) { const t = peek(sid, tid); if (!t || !t.recent.length) return 0; return t.recent.reduce((a, b) => a + b, 0) / t.recent.length; }
function mastery(sid, tid) { const t = peek(sid, tid); if (!t || !t.seen) return 0; return accuracy(sid, tid) * Math.min(1, t.seen / 12); }
function subjectMastery(sid) { const t = B(sid).topics; return t.reduce((a, x) => a + mastery(sid, x.id), 0) / t.length; }
function nextTopic(sid) {
  const topics = B(sid).topics;
  return topics.find(t => !st.badges['t:' + tkey(sid, t.id)] && mastery(sid, t.id) < 0.8) || topics.slice().sort((a, b) => mastery(sid, a.id) - mastery(sid, b.id))[0];
}
const dueList = () => Object.keys(st.review).filter(id => QI[id] && st.review[id].due <= today());

// Prefer questions he has seen least, then the ones seen longest ago.
function freshest(list, k, exclude) {
  const arr = list.filter(q => !exclude || !exclude.has(q.id)).map(q => { const s = st.q[q.id] || {}; return { q, s: s.s || 0, t: s.t || 0, r: Math.random() }; });
  arr.sort((a, b) => a.s - b.s || a.t - b.t || a.r - b.r);
  return arr.slice(0, k).map(x => x.q);
}
// Questions from the last few timed papers, kept out of new papers while there are others to use.
function recentTested() {
  const s = new Set();
  st.history.filter(h => h.mode === 'test' || h.mode === 'mock').slice(0, 6).forEach(h => h.items.forEach(x => s.add(x.id)));
  return s;
}
// Random choice for tests: a question used in a recent paper is very unlikely to come back,
// and questions seen many times are a little less likely, but the order is different every time.
function randomFresh(list, k, exclude, recent) {
  return list.filter(q => !exclude || !exclude.has(q.id)).map(q => {
    const s = st.q[q.id] || {};
    return { q, w: (recent && recent.has(q.id) ? 10 : 0) + Math.min(s.s || 0, 4) * 0.7 + Math.random() * 2.2 };
  }).sort((a, b) => a.w - b.w).slice(0, k).map(x => x.q);
}
const pool = (sid, tid, d) => B(sid).questions.filter(q => q.topic === tid && (!d || q.d === d) && !(st.hidden && st.hidden[q.id]));
// Reading passages: questions that share a passage are kept together in one sitting.
const passages = sid => Object.assign({}, B(sid).passages || {}, (st.aip && st.aip[sid]) || {});
const isPassageTopic = (sid, tid) => pool(sid, tid).some(q => q.p);
const bankOrder = (sid, qs) => { const all = B(sid).questions; return qs.slice().sort((a, b) => all.indexOf(a) - all.indexOf(b)); };
function pickPassage(sid, tid, level) {
  const qs = pool(sid, tid), ids = [...new Set(qs.map(q => q.p))];
  const seen = id => qs.filter(q => q.p === id).reduce((a, q) => a + ((st.q[q.id] || {}).s || 0), 0);
  const fits = ids.filter(id => qs.some(q => q.p === id && q.d === level));
  return shuffle(fits.length ? fits : ids).sort((a, b) => seen(a) - seen(b))[0];
}
const sname = e => e.mode === 'revision' || !subj(e.subject) ? 'All subjects' : subj(e.subject).name;

// ---------------------------------------------------------------- recording answers
function record(q, ok, mode) {
  const t = ts(q.subject, q.topic);
  let change = null;
  t.seen++; if (ok) t.correct++;
  t.recent.push(ok ? 1 : 0); if (t.recent.length > 20) t.recent.shift();
  if (mode === 'exercise' || mode === 'quiz') {
    // (the timed modes and Fix my mistakes do not change the level)
    // Adaptive difficulty: up after three right in a row, down after two wrong in a row.
    if (ok) { t.up++; t.down = 0; if (t.up >= 3 && t.level < 3) { t.level++; t.up = 0; change = 'up'; } }
    else { t.down++; t.up = 0; if (t.down >= 2 && t.level > 1) { t.level--; t.down = 0; change = 'down'; } }
  }
  const s = st.q[q.id] || (st.q[q.id] = { s: 0, c: 0 });
  s.s++; if (ok) s.c++; s.t = Date.now();
  if (ok) {
    st.stars++;
    const r = st.review[q.id];
    if ((mode === 'revision' || mode === 'fix') && r) { r.stage++; if (r.stage >= INTERVALS.length) delete st.review[q.id]; else r.due = plusDays(INTERVALS[r.stage]); }
  } else {
    st.review[q.id] = { stage: 0, due: plusDays(INTERVALS[0]) };
  }
  return change;
}
let awards = [];
function award(id) { if (!st.badges[id]) { st.badges[id] = today(); awards.push(id); } }
// Every badge a child can earn, in the order the trophy room shows them.
const BADGES = [
  { id: 'first', icon: '🚀', name: 'Blast off', how: 'Finish your very first activity' },
  { id: 'lesson10', icon: '📚', name: 'Bookworm', how: 'Read 10 different lessons' },
  { id: 'allfour', icon: '🌈', name: 'All-rounder', how: 'Practise all four subjects' },
  { id: 'streak3', icon: '🔥', name: '3-day streak', how: 'Practise 3 days in a row' },
  { id: 'streak7', icon: '🔥', name: '7-day streak', how: 'Practise 7 days in a row' },
  { id: 'streak14', icon: '☄️', name: '14-day streak', how: 'Practise 14 days in a row' },
  { id: 'streak30', icon: '🌋', name: '30-day streak', how: 'Practise 30 days in a row' },
  { id: 'stars100', icon: '⭐', name: '100 stars', how: 'Collect 100 stars' },
  { id: 'stars500', icon: '🌟', name: '500 stars', how: 'Collect 500 stars' },
  { id: 'stars1000', icon: '💫', name: '1,000 stars', how: 'Collect 1,000 stars' },
  { id: 'topics5', icon: '🎖️', name: 'Topic collector', how: 'Earn 5 topic stars (8 out of 10 in a topic quiz)' },
  { id: 'topics20', icon: '🏵️', name: 'Topic master', how: 'Earn 20 topic stars' },
  { id: 'test80', icon: '⚡', name: 'Speedy thinker', how: 'Score 80% or more in a 10-minute test' },
  { id: 'perfect', icon: '💯', name: 'Perfect paper', how: 'Get every question right in a timed test' },
  { id: 'tests10', icon: '⏱️', name: 'Test tackler', how: 'Finish 10 timed tests' },
  { id: 'comeback', icon: '📈', name: 'Comeback kid', how: 'Beat your last score on the same kind of test by 20% or more' },
  { id: 'fix1', icon: '🔧', name: 'Mistake fixer', how: 'Score 70% or more in Fix my mistakes' },
  { id: 'focus1', icon: '🎯', name: 'Weak-spot warrior', how: 'Score 70% or more in a weak-spot test' },
  { id: 'mock1', icon: '📝', name: 'First mock exam', how: 'Finish a whole mock paper' },
  { id: 'mock80', icon: '🏆', name: 'Mock exam star', how: 'Score 80% or more in a mock exam with several sections' }
];
const MEDALS = [{ k: 'bronze', icon: '🥉', name: 'Bronze' }, { k: 'silver', icon: '🥈', name: 'Silver' }, { k: 'gold', icon: '🥇', name: 'Gold' }];
const medalNeed = (sid, k) => { const n = B(sid).topics.length; return k === 'bronze' ? 3 : k === 'silver' ? Math.ceil(n / 2) : n; };
const topicStars = sid => Object.keys(st.badges).filter(b => b.startsWith('t:' + (sid ? sid + '/' : ''))).length;
// Explorer ranks grow with stars.
const RANKS = [[0, '🌱', 'Rookie Explorer'], [50, '🧭', 'Junior Explorer'], [150, '🥾', 'Trailblazer'], [400, '🗺️', 'Pathfinder'], [800, '⛵', 'Navigator'], [1500, '🏆', 'Champion'], [3000, '👑', 'Legend']];
function rank() { let i = 0; while (i + 1 < RANKS.length && st.stars >= RANKS[i + 1][0]) i++; return { i, r: RANKS[i], next: RANKS[i + 1] }; }
function badgeInfo(id) {
  if (id.startsWith('t:')) { const [sid, tid] = id.slice(2).split('/'); const t = ready(sid) && topicOf(sid, tid); return { icon: '⭐', name: (t ? t.name : tid) + ' star', how: 'Score 8 or more out of 10 in the ' + (t ? t.name : tid) + ' quiz' }; }
  if (id.startsWith('m:')) { const [, sid, k] = id.split(':'), m = MEDALS.find(x => x.k === k), s = subj(sid); return { icon: m.icon, name: `${s.name} ${m.name.toLowerCase()} medal`, how: `Earn ${medalNeed(sid, k)} topic stars in ${s.name}` }; }
  if (id.startsWith('rank:')) { const r = RANKS[+id.slice(5)]; return { icon: r[1], name: 'New rank: ' + r[2], how: `Collect ${r[0]} stars` }; }
  return BADGES.find(b => b.id === id) || { icon: '🏅', name: id, how: '' };
}
function badgeName(id) { return badgeInfo(id).name; }
// Checks for awards that can come from any activity.
function checkAwards() {
  [3, 7, 14, 30].forEach(n => { if (st.streak >= n) award('streak' + n); });
  [100, 500, 1000].forEach(n => { if (st.stars >= n) award('stars' + n); });
  const ts = topicStars();
  if (ts >= 5) award('topics5');
  if (ts >= 20) award('topics20');
  SUBJECTS.filter(s => ready(s.id)).forEach(s => MEDALS.forEach(m => { if (topicStars(s.id) >= medalNeed(s.id, m.k)) award(`m:${s.id}:${m.k}`); }));
  if (Object.keys(st.lessons).length >= 10) award('lesson10');
  const subs = new Set(Object.keys(st.q).map(id => QI[id] && QI[id].subject));
  if (SUBJECTS.every(s => !ready(s.id) || subs.has(s.id))) award('allfour');
  const r = rank().i;
  if (r > (st.rank || 0)) { st.rank = r; awards.push('rank:' + r); }
}

// ---- sounds, confetti and the owl buddy (kept out of timed tests so they stay calm)
let actx = null;
const soundOn = () => st.settings.sound !== false;
function sfx(kind) {
  if (!soundOn()) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = { right: [[660, 0], [880, 0.09], [1320, 0.18]], wrong: [[392, 0], [311, 0.14]], level: [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.32]], win: [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36], [784, 0.5], [1047, 0.62]], tap: [[740, 0]] }[kind] || [];
    const t0 = actx.currentTime;
    notes.forEach(([f, d]) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = kind === 'wrong' ? 'triangle' : 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + d); g.gain.exponentialRampToValueAtTime(kind === 'tap' ? 0.06 : 0.16, t0 + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.25);
      o.connect(g); g.connect(actx.destination); o.start(t0 + d); o.stop(t0 + d + 0.3);
    });
  } catch (e) { /* sound is optional */ }
}
const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
function confetti(n) {
  if (reduced()) return;
  const box = document.createElement('div'), cols = ['#ffb703', '#3b5bdb', '#2f9e44', '#e64980', '#15aabf', '#f76707', '#7950f2'];
  box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < (n || 70); i++) {
    const s = document.createElement('i');
    s.style.left = Math.random() * 100 + 'vw'; s.style.background = pick(cols);
    s.style.animationDelay = Math.random() * 0.5 + 's'; s.style.animationDuration = 1.8 + Math.random() * 1.6 + 's';
    s.style.setProperty('--r', Math.round(Math.random() * 720 - 360) + 'deg'); s.style.setProperty('--x', Math.round(Math.random() * 160 - 80) + 'px');
    if (i % 3 === 0) s.style.borderRadius = '50%';
    box.appendChild(s);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 4200);
}
// Ollie the owl, an original mascot drawn in SVG.
const OWL = `<svg viewBox="0 0 100 100" class="owl" aria-hidden="true">
  <path d="M20 34 L27 10 L41 27 Z M80 34 L73 10 L59 27 Z" fill="#5f3dc4"/>
  <ellipse cx="50" cy="58" rx="34" ry="38" fill="#7950f2"/>
  <ellipse cx="50" cy="71" rx="20" ry="21" fill="#e5dbff"/>
  <path d="M42 66 q4 3 8 0 q4 3 8 0 M40 75 q5 3 10 0 q5 3 10 0" stroke="#b197fc" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path class="wing" fill="#5f3dc4" d="M17 58 Q8 76 24 88 Q21 72 28 62Z"/><path class="wing r" fill="#5f3dc4" d="M83 58 Q92 76 76 88 Q79 72 72 62Z"/>
  <circle cx="36" cy="44" r="13" fill="#fff"/><circle cx="64" cy="44" r="13" fill="#fff"/>
  <g class="pupils"><circle cx="37" cy="45" r="6.5" fill="#1d2b3a"/><circle cx="63" cy="45" r="6.5" fill="#1d2b3a"/><circle cx="39.5" cy="42.5" r="2.2" fill="#fff"/><circle cx="65.5" cy="42.5" r="2.2" fill="#fff"/></g>
  <path d="M45 54 L55 54 L50 62 Z" fill="#ffb703"/>
  <circle cx="26" cy="56" r="4" fill="#f783ac" opacity=".55"/><circle cx="74" cy="56" r="4" fill="#f783ac" opacity=".55"/>
  <path d="M40 95 l3 -5 l3 5 M54 95 l3 -5 l3 5" stroke="#ffb703" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
const buddy = (msg, mood) => `<div class="buddy ${mood || ''}">${OWL}<div class="bubble">${msg}</div></div>`;
const FUN = [
  '<b>Tip:</b> E, J, O, T and Y are letters 5, 10, 15, 20 and 25. Remember <b>EJOTY</b> to find letter positions fast!',
  '<b>Did you know?</b> There are 11 different nets that fold into a cube.',
  '<b>Tip:</b> In a test, never leave a blank. A sensible guess can still win a mark.',
  '<b>Did you know?</b> 1/4, 0.25 and 25% are all exactly the same amount.',
  '<b>Tip:</b> Read every question twice. Little words like NOT can change everything!',
  '<b>Tip:</b> Stuck? Cross out the answers you know are wrong first.',
  '<b>Did you know?</b> An octagon has 8 sides and a decagon has 10.',
  '<b>Tip:</b> Check the units! Centimetres and metres are easy to mix up.',
  '<b>Tip:</b> Reading a story every day is the best way to grow your word power.',
  '<b>Did you know?</b> Every time you fix a mistake, your brain gets a little bit stronger.'
];
function celebrate(list) {
  if (!list.length) return;
  closePop();
  const d = document.createElement('div');
  d.className = 'modal'; d.id = 'pop'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'New award');
  const many = list.length > 1;
  d.innerHTML = `<div class="card award-pop"><div class="award-icons">${list.slice(0, 4).map(id => `<span>${badgeInfo(id).icon}</span>`).join('')}</div>
    <h2>${many ? 'Wow! ' + list.length + ' new awards!' : 'New award!'}</h2>
    ${list.map(id => `<p class="aw"><b>${esc(badgeInfo(id).name)}</b><br><span class="muted small">${esc(badgeInfo(id).how)}</span></p>`).join('')}
    <div class="row" style="justify-content:center;margin-top:1rem"><a class="btn" href="#trophies">🏆 See my trophy room</a>${list.some(id => !id.startsWith('rank:')) ? `<a class="btn alt" href="#cert/${encodeURIComponent(list.find(id => !id.startsWith('rank:')))}">📜 Certificate</a>` : ''}<button class="btn ghost" data-act="closepop">Close</button></div></div>`;
  document.body.appendChild(d);
  d.addEventListener('click', ev => { if (ev.target === d) closePop(); });
  confetti(140); sfx('win');
}
// Numbers that count up when a page opens.
function animateCounts() {
  document.querySelectorAll('.count').forEach(el => {
    const n = +el.dataset.n || 0;
    if (reduced() || n < 2) { el.textContent = n; return; }
    const t0 = performance.now(), dur = 700;
    const step = now => { const p = Math.min(1, (now - t0) / dur); el.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
let lastStars = null;
function chips() {
  const el = $('#chips'); if (!el) return;
  const bump = lastStars !== null && st.stars > lastStars;
  lastStars = st.stars;
  const r = rank().r;
  el.innerHTML = `<a class="chip who" href="#who" title="${esc(me().name || 'Switch child')}">${me().avatar}${meta.list.length > 1 ? ` <span class="whoname">${esc(me().name || '')}</span>` : ''}</a><a class="chip" href="#trophies" title="${esc(r[2])}">${r[1]}</a><span class="chip" title="Day streak">🔥 ${st.streak}</span><span class="chip star ${bump ? 'bump' : ''}" title="Stars">⭐ ${st.stars}</span>
    <button class="chip" data-act="sound" aria-label="${soundOn() ? 'Turn sound off' : 'Turn sound on'}">${soundOn() ? '🔊' : '🔇'}</button>`;
}
const starsOf = (sid, tid) => { const m = mastery(sid, tid); return m >= 0.85 ? 3 : m >= 0.6 ? 2 : m >= 0.3 ? 1 : 0; };
const starRow = n => `<span class="tstars" aria-label="${n} of 3 stars">${'<i class="on">★</i>'.repeat(n)}${'<i>★</i>'.repeat(3 - n)}</span>`;

// ---------------------------------------------------------------- sessions
let S = null;       // the session in progress
let timer = null;
function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

function begin(mode, sid, tid, questions, extra) {
  if (S) finish(false);   // a different activity was left unfinished: keep what was answered, then start the new one
  S = Object.assign({ mode, subject: sid, topic: tid || null, items: questions.map(q => ({ q: prep(q), chosen: null })), idx: 0, start: Date.now(), hint: false, msg: null, stars: 0, used: new Set(questions.map(q => q.id)), flags: new Set(), qIdx: null }, extra || {});
  if (S.parts) (S.mode === 'mock' ? startWarm : startPart)(0);
  if (location.hash === '#session') renderSession(); else location.hash = '#session';
}
// ---- keeping the place: the activity in progress is saved, so leaving the page or closing the app never loses it
function persist() {
  if (!S) { if (st.active) { delete st.active; save(); } return; }
  const keep = ['mode', 'subject', 'topic', 'idx', 'start', 'stars', 'target', 'pid', 'parts', 'part', 'partStart', 'deadline', 'elapsed', 'between', 'label', 'cfg', 'tags', 'from', 'warned', 'hard', 'ai', 'warm'];
  const a = {}; keep.forEach(k => { if (S[k] !== undefined) a[k] = S[k]; });
  a.flags = [...S.flags];
  a.items = S.items.map(i => ({ id: i.q.id, perm: i.q.perm || null, c: i.chosen, s: i.secs || 0, say: i.say || null }));
  st.active = a; save();
}
function restore() {
  const a = st.active; if (!a) return;
  try {
    const items = a.items.map(x => {
      const q = QI[x.id]; if (!q) throw new Error('missing question');
      const qq = x.perm ? Object.assign({}, q, { opts: x.perm.map(i => q.opts[i]), a: x.perm.indexOf(q.a), perm: x.perm }) : q;
      return { q: qq, chosen: x.c, secs: x.s, say: x.say };
    });
    S = Object.assign({}, a, { items, used: new Set(items.map(i => i.q.id)), flags: new Set(a.flags || []), hint: false, msg: null, qIdx: null, confirm: false });
  } catch (e) { delete st.active; S = null; save(); }
}
// Where the child is in the activity, for the Continue buttons.
function sessionWhere() {
  if (!S) return null;
  const part = S.parts && S.parts[S.part], lo = part ? part.from : 0, hi = part ? part.to : S.items.length;
  const total = S.mode === 'exercise' ? S.target : hi - lo;
  const name = S.label || (S.topic && topicOf(S.subject, S.topic) ? topicOf(S.subject, S.topic).name : MODE[S.mode]);
  const left = S.parts && !S.between ? Math.max(0, Math.ceil((S.deadline - Date.now()) / 60000)) : null;
  return { name, num: Math.min(total, S.idx - lo + 1), total, left };
}
function resumeBar() {
  if (!S || location.hash === '#session') return '';
  const w = sessionWhere();
  return `<div class="card resume"><div><b>▶ Carry on where you stopped</b><br><span class="small">${esc(MODE[S.mode])}: ${esc(w.name)} · question ${w.num} of ${w.total}${w.left !== null ? ` · ${w.left} min left on the clock (it keeps running)` : ''}</span></div>
    <div class="row"><a class="btn" href="#session">Continue →</a><button class="btn ghost" data-act="endsession">Finish now</button></div></div>`;
}
// Time spent on each question, so the results can show where the minutes went.
function stamp() {
  if (!S || S.qIdx === null || S.qIdx === undefined) return;
  const it = S.items[S.qIdx];
  if (it) it.secs = (it.secs || 0) + (Date.now() - S.qShown);
  S.qIdx = null;
}
function startExercise(sid, tid) {
  const lvl = ts(sid, tid).level, pid = isPassageTopic(sid, tid) ? pickPassage(sid, tid, lvl) : null;
  const from = d => pool(sid, tid, d).filter(q => !pid || q.p === pid);
  const q = freshest(from(lvl), 1)[0] || freshest(from(), 1)[0];
  begin('exercise', sid, tid, [q], { target: 10, pid });
}
function startQuiz(sid, tid) {
  if (isPassageTopic(sid, tid)) {
    const pid = pickPassage(sid, tid, ts(sid, tid).level);
    return begin('quiz', sid, tid, bankOrder(sid, freshest(pool(sid, tid).filter(q => q.p === pid), 10)));
  }
  const qs = [].concat(freshest(pool(sid, tid, 1), 3), freshest(pool(sid, tid, 2), 4), freshest(pool(sid, tid, 3), 3));
  begin('quiz', sid, tid, qs);
}
// ---- timed papers: 10-minute tests and mock exams are made of one or more timed sections
function startPart(i) {
  S.part = i; S.idx = S.parts[i].from; S.between = false; S.confirm = false; S.warned = {};
  S.partStart = Date.now(); S.deadline = Date.now() + S.parts[i].mins * 60000;
  stopTimer(); timer = setInterval(tick, 500);
}
// ---- mock exams: a short untimed warm-up before each section, like the practice exercise in the real test.
// The practice questions are kept apart from the paper: they are never scored, recorded or added to history.
function startWarm(i) {
  const p = S.parts[i], tops = [], seen = new Set(), picks = [];
  S.items.slice(p.from, p.to).forEach(it => { const k = tkey(it.q.subject, it.q.topic); if (!it.q.p && !seen.has(k) && ready(it.q.subject) && topicOf(it.q.subject, it.q.topic)) { seen.add(k); tops.push(it.q); } });
  const avoid = new Set([...S.used]), recent = recentTested(), order = shuffle(tops);
  for (let k = 0; picks.length < Math.min(3, Math.max(2, order.length)) && k < 9 && order.length; k++) {
    const t = order[k % order.length], q = randomFresh(pool(t.subject, t.topic, 1).filter(x => !x.p), 1, avoid, recent)[0];
    if (q) { picks.push(q.id); avoid.add(q.id); }
  }
  if (!picks.length) return startPart(i);
  stopTimer();
  S.part = i; S.idx = p.from; S.between = true; S.confirm = false;
  S.warm = { part: i, ids: picks, c: picks.map(() => null), n: 0 };
}
function endWarm() { if (!S || !S.warm) return; const i = S.warm.part; S.warm = null; startPart(i); renderSession(); window.scrollTo(0, 0); }
function renderWarm() {
  const w = S.warm, part = S.parts[w.part], q = QI[w.ids[w.n]];
  if (!q) return endWarm();
  const it = { chosen: w.c[w.n] }, last = w.n + 1 >= w.ids.length, ok = it.chosen === q.a;
  const startBtn = `<button class="btn" data-act="warmdone">Start the timed section →</button>`;
  view().classList.remove('wide');
  page(`<div class="sess-head"><div><span class="pill">✏️ Practice first</span> <span class="muted">${esc(part.name)}${S.parts.length > 1 ? ` · section ${w.part + 1} of ${S.parts.length}` : ''}</span></div>
    <div class="row"><button class="btn ghost" data-act="warmdone">Skip practice</button></div></div>
    <div class="box eg small">A few easy practice questions to warm up, like in the real test. <b>No clock, and they do not count.</b> Next: ${part.to - part.from} questions in ${part.mins} minutes.</div>
    <div class="card" id="qcard" data-qid="${esc(q.id)}"><div class="qnum">Practice question ${w.n + 1} of ${w.ids.length}</div>
    <div class="qtext">${rich(q.q)}</div>${q.svg ? `<div class="fig">${q.svg}</div>` : ''}
    <div class="opts ${q.of ? 'pics' : ''}">${optionHTML(q, it, true)}</div>
    ${it.chosen === null ? '' : `<div class="fb ${ok ? 'ok' : 'try'}" id="fbbox" aria-live="polite"><h3>${ok ? 'Spot on!' : 'Good try!'}</h3>
      ${ok ? '' : `<p>You chose <b>${showOpt(q, it.chosen)}</b>. The answer is <b>${showOpt(q, q.a)}</b>.</p>`}
      <p><b>The method:</b></p><ol class="steps">${q.steps.map(x => `<li>${rich(x)}</li>`).join('')}</ol>
      <div class="row">${last ? startBtn : '<button class="btn" id="next" data-act="warmnext">Next practice question →</button>'}</div></div>`}</div>
    ${it.chosen === null || !last ? `<p class="row"><button class="btn alt" data-act="warmdone">Skip practice and start the timed section</button></p>` : ''}`);
  persist();
  const nx = $('#next') || $('#fbbox .btn'); if (nx) nx.focus({ preventScroll: true });
}
function partTime() { return Math.min(S.parts[S.part].mins * 60, Math.round((Date.now() - S.partStart) / 1000)); }
function endPart() {
  stopTimer(); stamp();
  S.elapsed = (S.elapsed || 0) + partTime();
  if (S.part + 1 < S.parts.length) { S.between = true; renderSession(); window.scrollTo(0, 0); } else finish(true);
}
function timedSession(mode, sid, label, sections, cfg) {
  const parts = []; let all = [];
  sections.forEach(sec => { if (sec.qs.length) { parts.push({ name: sec.name, mins: sec.mins, from: all.length, to: all.length + sec.qs.length, rest: sec.rest }); all = all.concat(sec.qs); } });
  if (all.length) begin(mode, sid, null, all, { parts, label, cfg });
}
const plainTopics = sid => B(sid).topics.filter(t => !isPassageTopic(sid, t.id)).map(t => t.id);
const textTopics = sid => B(sid).topics.filter(t => isPassageTopic(sid, t.id)).map(t => t.id);
// A fresh random paper: topics shared out evenly, a fixed mix of difficulty
// (about 30% warm-up, 45% stretch, 25% challenge), questions from recent papers avoided, easier ones first.
function pickSpread(sid, topicIds, count, used, recent, only) {
  const topics = shuffle(topicIds.filter(t => pool(sid, t).length)), qs = [];
  if (!topics.length || count <= 0) return qs;
  recent = recent || recentTested();
  const easy = Math.round(count * 0.3), hard = Math.round(count * 0.25);
  const ds = only ? Array(count).fill(only) : shuffle(Array.from({ length: count }, (_, i) => i < easy ? 1 : i < count - hard ? 2 : 3));
  for (let i = 0; qs.length < count && i < count * 6; i++) {
    const t = topics[i % topics.length], d = ds[qs.length];
    const q = randomFresh(pool(sid, t, d), 1, used, recent)[0] || (only ? randomFresh(pool(sid, t, Math.max(1, only - 1)), 1, used, recent)[0] : randomFresh(pool(sid, t), 1, used, recent)[0]);
    if (q) { qs.push(q); used.add(q.id); }
  }
  return qs.sort((a, b) => a.d - b.d);
}
function passageBlock(sid, tids, n) {
  tids = tids.filter(t => pool(sid, t).length);
  if (!tids.length) return [];
  const recent = recentTested();
  // prefer a passage that was not in a recent paper
  const ranked = shuffle(tids).map(tid => ({ tid, pid: pickPassage(sid, tid, 2) }));
  const notRecent = ranked.find(r => !pool(sid, r.tid).some(q => q.p === r.pid && recent.has(q.id)));
  const { tid, pid } = notRecent || ranked[0];
  return bankOrder(sid, randomFresh(pool(sid, tid).filter(q => q.p === pid), n));
}
const paceCount = () => Math.round(600 / BOARDS[st.settings.board].pace);
const scaled = m => Math.max(1, Math.round(m * BOARDS[st.settings.board].pace / 60));
function startTest(sid) {
  const count = paceCount(), used = new Set();
  const block = passageBlock(sid, textTopics(sid), 4);   // one short passage with four questions, placed at the end
  timedSession('test', sid, B(sid).name + ' test', [{ name: B(sid).name, mins: 10, qs: pickSpread(sid, plainTopics(sid), count - block.length, used).concat(block) }], { k: 'test', sid });
}
const MIXES = {
  all: { name: 'All four subjects', sids: ['maths', 'english', 'vr', 'nvr'] },
  core: { name: 'Maths and English', sids: ['maths', 'english'] },
  reasoning: { name: 'Verbal and Non-Verbal Reasoning', sids: ['vr', 'nvr'] }
};
function startMix(kind) {
  const m = MIXES[kind], sids = m.sids.filter(ready), count = paceCount(), used = new Set(), recent = recentTested();
  let qs = [];
  sids.forEach((sid, i) => { qs = qs.concat(pickSpread(sid, plainTopics(sid), Math.floor(count / sids.length) + (i < count % sids.length ? 1 : 0), used, recent)); });
  timedSession('test', 'mix', m.name + ' mix', [{ name: m.name, mins: 10, qs: qs.sort((a, b) => a.d - b.d) }], { k: 'mix', kind });
}
// Weak-spot test: the four topics with the lowest recent scores (topics not tried yet count as middling).
function weakTopics(sids, n) {
  const list = [];
  sids.filter(ready).forEach(sid => B(sid).topics.forEach((t, i) => {
    if (t.extra || isPassageTopic(sid, t.id) || !pool(sid, t.id).length) return;
    const p = peek(sid, t.id);
    list.push({ sid, tid: t.id, name: t.name, score: p && p.seen >= 3 ? accuracy(sid, t.id) : 0.72, seen: p ? p.seen : 0, i });
  }));
  return list.sort((a, b) => a.score - b.score || b.seen - a.seen || a.i - b.i).slice(0, n);
}
function startFocus(scope) {
  const sids = scope === 'all' ? SUBJECTS.map(s => s.id) : [scope];
  const tops = weakTopics(sids, 4), count = paceCount(), used = new Set(), recent = recentTested();
  if (!tops.length) return;
  let qs = [];
  tops.forEach((t, i) => { qs = qs.concat(pickSpread(t.sid, [t.tid], Math.floor(count / tops.length) + (i < count % tops.length ? 1 : 0), used, recent)); });
  const one = new Set(tops.map(t => t.sid)).size === 1;
  timedSession('test', one ? tops[0].sid : 'mix', 'Weak-spot test', [{ name: 'Weak spots', mins: 10, qs: qs.sort((a, b) => a.d - b.d) }], { k: 'focus', scope });
}
// Mock papers follow the Kent Test layout. Paper 1: English and Maths (25 minutes each).
// Paper 2, Reasoning: one verbal reasoning section, then four short non-verbal sections, each on a group of puzzle types.
const NVR_SECTIONS = {
  nvr1: { name: 'Non-verbal 1: odd one out, groups and analogies', tids: ['odd_one_out', 'belongs_group', 'analogies'] },
  nvr2: { name: 'Non-verbal 2: sequences, grids and codes', tids: ['nvr_sequences', 'matrices', 'nvr_codes'] },
  nvr3: { name: 'Non-verbal 3: reflections, rotations, symmetry and hidden shapes', tids: ['reflections', 'rotations', 'symmetry_complete', 'hidden_shapes'] },
  nvr4: { name: 'Non-verbal 4: nets, 3D views, fold and punch, joining shapes', tids: ['nets', 'views_3d', 'paper_folding', 'combine_shapes'] }
};
function mockSection(key, recent) {
  const used = new Set();
  if (NVR_SECTIONS[key]) return { name: NVR_SECTIONS[key].name, mins: scaled(MOCK_MINS[key]), qs: pickSpread('nvr', NVR_SECTIONS[key].tids, MOCK_SIZE[key], used, recent) };
  switch (key) {
    case 'english': { const text = passageBlock('english', ['comp_fiction', 'comp_nonfiction', 'comp_poetry'], 10); return { name: 'English', mins: scaled(25), qs: text.concat(pickSpread('english', ['spelling', 'punctuation', 'grammar', 'vocabulary', 'synonyms_antonyms', 'sentence_completion'], 24 - text.length, used, recent)) }; }   // shorter passages are topped up so the section always has 24
    case 'maths': return { name: 'Maths', mins: scaled(25), qs: pickSpread('maths', plainTopics('maths'), 25, used, recent) };
    case 'vr': return { name: 'Verbal reasoning', mins: scaled(20), qs: pickSpread('vr', plainTopics('vr'), 24, used, recent) };
    case 'nvr': return { name: 'Non-verbal reasoning', mins: scaled(12), qs: pickSpread('nvr', ['odd_one_out', 'nvr_sequences', 'analogies', 'matrices', 'nvr_codes', 'belongs_group'], 16, used, recent) };
    default: return { name: 'Spatial reasoning', mins: scaled(12), qs: pickSpread('nvr', ['reflections', 'rotations', 'hidden_shapes', 'nets', 'views_3d', 'paper_folding', 'symmetry_complete', 'combine_shapes'], 16, used, recent) };
  }
}
const REASONING_KEYS = ['vr', 'nvr1', 'nvr2', 'nvr3', 'nvr4'];
const MOCKS = {
  english: { name: 'English paper', keys: ['english'], sid: 'english' },
  maths: { name: 'Maths paper', keys: ['maths'], sid: 'maths' },
  reasoning: { name: 'Reasoning paper', keys: REASONING_KEYS, sid: 'mix' },
  full: { name: 'Complete mock exam', keys: ['english', 'maths'].concat(REASONING_KEYS), sid: 'mix' }
};
// Paper 2 comes to about an hour: 20 minutes of verbal reasoning, four 8-minute non-verbal sections, and the practice questions.
const MOCK_SIZE = { english: 24, maths: 25, vr: 24, nvr: 16, spatial: 16, nvr1: 10, nvr2: 10, nvr3: 10, nvr4: 10 };
const MOCK_MINS = { english: 25, maths: 25, vr: 20, nvr: 12, spatial: 12, nvr1: 8, nvr2: 8, nvr3: 8, nvr4: 8 };
const mockReady = kind => MOCKS[kind].keys.every(k => ready(k === 'spatial' || NVR_SECTIONS[k] ? 'nvr' : k));
function startMock(kind) {
  const m = MOCKS[kind];
  if (!mockReady(kind)) return;
  const recent = recentTested();
  const secs = m.keys.map(k => mockSection(k, recent));
  if (kind === 'full') secs[2].rest = true;   // the real test has a break between the two papers
  timedSession('mock', m.sid, m.name, secs, { k: 'mock', kind });
}
// Fix my mistakes: each question that was wrong comes back (no timer, hints allowed),
// followed by a similar question from the same topic and level to check the method has stuck.
function startFix(eid) {
  const e = st.history.find(h => h.id === eid);
  if (!e) return;
  const wrong = e.items.map(x => QI[x.id] && { q: QI[x.id], c: x.c }).filter(x => x && x.c !== x.q.a).slice(0, 12).map(x => x.q);
  if (!wrong.length) return;
  const used = new Set(wrong.map(q => q.id)), qs = [], tags = {};
  wrong.forEach(q => {
    qs.push(q); tags[q.id] = 'again';
    if (q.p) return;   // passage questions come back on their own
    const twin = randomFresh(pool(q.subject, q.topic, q.d), 1, used, recentTested())[0] || randomFresh(pool(q.subject, q.topic), 1, used)[0];
    if (twin) { qs.push(twin); used.add(twin.id); tags[twin.id] = 'twin'; }
  });
  begin('fix', e.subject, null, qs, { tags, from: eid });
}
// ---------------------------------------------------------------- Challenge practice (hard questions only)
function startChallenge(sid, tid) {
  let qs;
  if (isPassageTopic(sid, tid)) { const pid = pickPassage(sid, tid, 3); qs = bankOrder(sid, pool(sid, tid).filter(q => q.p === pid && q.d >= 2)).slice(0, 10); }
  else qs = randomFresh(pool(sid, tid, 3), 10);
  if (!qs.length) return toast('No challenge questions for this topic yet.');
  begin('exercise', sid, tid, qs, { target: qs.length, hard: true, label: 'Challenge', cfg: { k: 'challenge', sid, tid } });
}
function startHardTest(sid) {
  const used = new Set(), qs = pickSpread(sid, plainTopics(sid), paceCount(), used, recentTested(), 3);
  timedSession('test', sid, B(sid).name + ' challenge test', [{ name: B(sid).name + ' (hard)', mins: 10, qs }], { k: 'hard', sid });
}

// ---------------------------------------------------------------- AI-made questions (optional, uses the family's own API key)
// The key is kept only in this browser (separately from progress, so it is never in a backup file) and is sent only to the AI company chosen.
const AIKEY = 'elevenplus.ai';
function aiConf() { try { return JSON.parse(localStorage.getItem(AIKEY)) || null; } catch (e) { return null; } }
function aiStore(c) { try { if (c) localStorage.setItem(AIKEY, JSON.stringify(c)); else localStorage.removeItem(AIKEY); } catch (e) { /* storage blocked */ } }
const aiReady = () => { const c = aiConf(); return !!(c && c.key && c.model); };
const AI_MODELS = [['claude-sonnet-5-5', 'Claude Sonnet 5.5 (recommended)'], ['claude-haiku-5-5', 'Claude Haiku 5.5 (faster, lower cost)'], ['claude-opus-5-5', 'Claude Opus 5.5 (most careful, higher cost)']];
const AI_SCHEMA = { type: 'object', properties: {
  passage: { type: 'object', properties: { title: { type: 'string' }, kind: { type: 'string', enum: ['story', 'nonfiction', 'poem'] }, text: { type: 'string' } } },
  questions: { type: 'array', items: { type: 'object', properties: { q: { type: 'string' }, opts: { type: 'array', items: { type: 'string' } }, a: { type: 'integer' }, hint: { type: 'string' }, steps: { type: 'array', items: { type: 'string' } }, d: { type: 'integer' }, topic: { type: 'string' } }, required: ['q', 'opts', 'a', 'hint', 'steps'] } } },
  required: ['questions'] };
// The AI company's own error text, so a parent can see exactly what went wrong.
function apiMsg(body) { try { const j = JSON.parse(body); return String((j.error && (j.error.message || j.error.type)) || j.message || ''); } catch (e) { return ''; } }
function aiError(status, body) {
  const m = apiMsg(body), why = m ? ` The AI service said: "${m.slice(0, 200)}"` : '';
  const err = t => { const e = new Error(t); e.status = status; return e; };
  if (status === 401) return err('The API key was not accepted. Check it in the parent view (copy the whole key, with no spaces).' + why);
  if (/credit balance|insufficient_quota|billing|exceeded your current quota/i.test(body || '')) return err('The AI account has no credit left. Add credit in your AI account (console.anthropic.com or platform.openai.com), then try again.');
  if (status === 404 || /not_found_error|model_not_found|does not exist|unknown model/i.test(body || '')) { const e = err('That AI model is not available for this key.' + why); e.notFound = true; return e; }
  if (status === 403) return err('This key is not allowed to use the AI service.' + why);
  if (status === 429) return err('The AI service is busy. Wait a minute and try again.' + why);
  if (status >= 500) return err('The AI service had a problem. Please try again shortly.');
  return err('The AI request did not work' + (status ? ` (error ${status})` : '') + '.' + why);
}
// Asks the AI company which models this key can use (used to pick a working model automatically).
async function aiListModels(c) {
  let res;
  try {
    res = c.provider === 'openai'
      ? await fetch('https://api.openai.com/v1/models', { headers: { Authorization: 'Bearer ' + c.key } })
      : await fetch('https://api.anthropic.com/v1/models?limit=100', { headers: { 'x-api-key': c.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' } });
  } catch (e) { throw new Error('Could not reach the AI service. Check the internet connection and try again.'); }
  const text = await res.text();
  if (!res.ok) throw aiError(res.status, text);
  let list = []; try { list = JSON.parse(text).data || []; } catch (e) { /* fall through */ }
  if (c.provider === 'openai') return list.map(m => ({ id: m.id })).filter(m => /^(gpt-|o\d|chatgpt)/.test(m.id) && !/audio|realtime|tts|transcribe|search|image|embedding|instruct|vision|preview/.test(m.id));
  return list.map(m => ({ id: m.id, name: m.display_name || m.id, max: m.max_tokens || 0 })).filter(m => /^claude/.test(m.id));
}
// The best model from the list: Sonnet first for Claude (good and fair-priced), a "mini" model first for OpenAI.
function bestModel(list, provider) {
  const ids = list.map(m => m.id);
  const order = provider === 'openai' ? [/^gpt-.*mini/, /^gpt-/, /^o\d.*mini/, /./] : [/sonnet/, /haiku/, /opus/, /fable/, /./];
  for (const r of order) { const hit = ids.find(id => r.test(id)); if (hit) return hit; }
  return null;
}
// Saves the list on this device and moves to a working model if the chosen one is not on it.
async function aiRefreshModels() {
  const c = aiConf(); if (!c || !c.key) return null;
  const list = await aiListModels(c);
  if (!list.length) throw new Error('This key cannot use any suitable models. Check the account at the AI company.');
  const keep = list.some(m => m.id === c.model), model = keep ? c.model : bestModel(list, c.provider);
  const m = list.find(x => x.id === model) || {};
  aiStore(Object.assign({}, c, { models: list.slice(0, 40), model, maxOut: m.max || 0 }));
  return { model, changed: !keep, was: c.model };
}
async function aiRequestOnce(prompt, maxTokens) {
  const c = aiConf(); if (!c || !c.key) throw new Error('No AI key has been added yet. A grown-up can add one in the parent view.');
  let res;
  try {
    if (c.provider === 'openai') {
      res = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + c.key },
        body: JSON.stringify({ model: c.model, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: 'You write 11+ practice questions. Reply with one JSON object only.' }, { role: 'user', content: prompt + '\n\nReply with JSON in this shape: {"passage": {"title": "", "kind": "story", "text": ""} (only when asked for a passage), "questions": [{"q": "", "opts": ["", "", "", "", ""], "a": 0, "hint": "", "steps": [""], "d": 2, "topic": ""}]}' }] }) });
    } else {
      res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': c.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: c.model, max_tokens: Math.min(maxTokens || 12000, c.maxOut || 64000), tools: [{ name: 'save_questions', description: 'Save the finished, checked questions.', input_schema: AI_SCHEMA }], tool_choice: { type: 'tool', name: 'save_questions' }, messages: [{ role: 'user', content: prompt }] }) });
    }
  } catch (e) { throw new Error('Could not reach the AI service. Check the internet connection and try again.'); }
  const text = await res.text();
  if (!res.ok) throw aiError(res.status, text);
  let data; try { data = JSON.parse(text); } catch (e) { throw new Error('The AI sent back something unexpected. Please try again.'); }
  if (c.provider === 'openai') { try { return JSON.parse(data.choices[0].message.content); } catch (e) { throw new Error('The AI answer could not be read. Please try again.'); } }
  const block = (data.content || []).find(b => b.type === 'tool_use');
  if (!block) throw new Error('The AI answer could not be read. Please try again.');
  return block.input;
}
// AI difficulty levels. 'mixed' is a real-exam spread; 'hardmix' and 4 go beyond the usual Kent Test for children aiming high.
const AI_LEVELS = {
  1: { name: 'Easy', words: 'easy (gentle warm-up, one step, familiar wording)' },
  2: { name: 'Medium', words: 'medium (standard Kent Test / GL level, often two steps)' },
  3: { name: 'Hard', words: 'hard (the hardest questions in a real Kent Test: several steps, tricky wording or a trap to avoid)' },
  4: { name: 'Very hard', words: 'very hard (harder than the real Kent Test, like super-selective grammar and independent school papers: multi-step, unfamiliar contexts, careful reading, larger numbers; still solvable without a calculator by a strong 10-year-old)' },
  mixed: { name: 'Exam mix', words: 'a real-exam mix: about 30% easy, 45% medium and 25% hard, in order from easiest to hardest' },
  hardmix: { name: 'Hard mix', words: 'a demanding mix: about 20% medium, 50% hard and 30% very hard, in order from easiest to hardest' }
};
// If the chosen model is not available for this key, find one that is, switch to it, and try once more.
async function aiRequest(prompt, maxTokens) {
  try { return await aiRequestOnce(prompt, maxTokens); }
  catch (e) {
    if (!e.notFound) throw e;
    let r; try { r = await aiRefreshModels(); } catch (e2) { throw e; }
    if (!r || !r.changed) throw e;
    toast(`✨ Switched the AI model to ${r.model}, which works with this key.`);
    return aiRequestOnce(prompt, maxTokens);
  }
}
const LEVEL_WORDS = Object.fromEntries(Object.entries(AI_LEVELS).map(([k, v]) => [k, v.words]));
const aiLevelName = l => (AI_LEVELS[l] || AI_LEVELS.mixed).name;
const aiLv = () => aiLevelOK(st.settings.aiLevel || 'mixed');
const AI_LEVEL_HELP = { 1: 'Easy: gentle questions to build confidence.', 2: 'Medium: the standard level of most Kent Test questions.', mixed: 'Exam mix: easy, medium and hard, like the real test. Best for mocks.', 3: 'Hard: the hardest kind of question in a real Kent Test.', hardmix: 'Hard mix: mostly hard and very hard. For children scoring well in normal mocks.', 4: 'Very hard: beyond the Kent Test, like super-selective papers. Expect lower scores, and that is fine.' };
const aiLevelOK = l => (AI_LEVELS[l] ? (isNaN(+l) ? l : +l) : 'mixed');
function aiPrompt(o) {
  const subjectName = B(o.sid).name, tops = o.tids.map(id => topicOf(o.sid, id)).filter(Boolean);
  return `You are writing practice questions for a child in Year 5 or 6 (age 9 to 11) in England who is preparing for the 11+ exam (the Kent Test, GL Assessment style). Use UK English spelling, pounds and pence, and metric units.

Subject: ${subjectName}.
Topic${tops.length > 1 ? 's (spread the questions across them and set "topic" to the topic id)' : ''}:
${tops.map(t => `- ${t.id}: ${t.name}. ${t.lesson.text.split('\n')[0]}`).join('\n')}
${o.passage ? `\nFirst write an original ${o.passage} of about 250 to 350 words for this age group, with a short title. Number nothing. Then write the questions about it (inference, vocabulary in context, the writer's choices, and finding information).` : ''}
Write ${o.n} multiple-choice questions. Difficulty: ${LEVEL_WORDS[o.level]}.

Rules for every question:
- Exactly 5 options and exactly one correct answer. "a" is the index (0 to 4) of the correct option.
- Wrong options are believable mistakes a child might make, never silly.
- Never refer to options by letter (A, B, C), because the options are shuffled.
- Put any puzzle (letters, numbers, a sum, a word group) on its own line inside "q".
- Write fractions like 3/4. Use the × and ÷ signs.
- "hint": one short sentence that nudges without giving the answer away.
- "steps": 2 to 4 short, friendly steps showing a method a 10-year-old can follow. The last step must be exactly "The answer is X." where X is the correct option, word for word.
- "d": 1 for easy, 2 for medium, 3 for hard, 4 for very hard.
- Every question must be different, original, and suitable for children. Use kind, varied names and everyday situations.
- Work every answer out a second time before you finish. If you are not completely sure a question has exactly one right answer, replace it.`;
}
// Keeps only well-formed questions whose last step matches the marked answer (a check that the AI did not mix itself up).
function aiClean(raw, o) {
  const out = [], stamp = Date.now().toString(36);
  (raw && Array.isArray(raw.questions) ? raw.questions : []).forEach((x, i) => {
    if (!x || typeof x.q !== 'string' || !Array.isArray(x.opts) || x.opts.length !== 5) return;
    const opts = x.opts.map(v => String(v).trim()), a = Number(x.a);
    if (new Set(opts).size !== 5 || !(a >= 0 && a <= 4) || opts.some(v => !v)) return;
    let steps = (Array.isArray(x.steps) ? x.steps : []).map(v => String(v).trim()).filter(Boolean);
    if (!steps.length) return;
    const last = steps[steps.length - 1];
    if (/answer is/i.test(last)) { if (!last.toLowerCase().includes(opts[a].toLowerCase().replace(/\.$/, ''))) return; }
    else steps.push(`The answer is ${opts[a]}.`);
    const tid = o.tids.includes(x.topic) ? x.topic : o.tids[0];
    out.push({ id: `ai-${o.sid}-${stamp}-${i}-${Math.floor(Math.random() * 1e5)}`, subject: o.sid, topic: tid, d: Math.min(3, [1, 2, 3, 4].includes(+x.d) ? +x.d : (isNaN(+o.level) ? 2 : +o.level)), vh: +x.d === 4 || o.level === 4 || undefined, q: x.q.trim(), opts, a, hint: String(x.hint || 'Read the question carefully.'), steps, ai: true });
  });
  return out;
}
// Saves AI questions (and any passage) so they can be reviewed, revised and resumed later. Only the newest 400 are kept.
function aiKeep(qs, passage, sid) {
  st.aiq = st.aiq || {};
  let pid = null;
  if (passage && passage.text) {
    pid = 'aip-' + Date.now().toString(36);
    st.aip = st.aip || {}; st.aip[sid] = st.aip[sid] || {};
    st.aip[sid][pid] = { title: String(passage.title || 'Passage'), kind: passage.kind === 'poem' ? 'poem' : 'prose', text: String(passage.text) };
    const ids = Object.keys(st.aip[sid]); if (ids.length > 20) delete st.aip[sid][ids[0]];
  }
  qs.forEach(q => { if (pid) q.p = pid; st.aiq[q.id] = q; QI[q.id] = q; });
  const ids = Object.keys(st.aiq); if (ids.length > 400) ids.slice(0, ids.length - 400).forEach(id => delete st.aiq[id]);
  save();
  return qs;
}
async function aiMake(o) {
  const raw = await aiRequest(aiPrompt(o), o.n > 15 ? 16000 : 9000);
  const qs = aiClean(raw, o);
  if (qs.length < Math.max(3, Math.floor(o.n * 0.6))) throw new Error('The AI did not write enough good questions this time. Please try again.');
  if (o.passage && !(raw.passage && raw.passage.text)) throw new Error('The AI forgot to write the passage. Please try again.');
  return aiKeep(qs.slice(0, o.n), o.passage ? raw.passage : null, o.sid);
}
let aiBusy = false;
function aiWaiting(what) {
  page(`<div class="card" style="text-align:center;padding:2rem 1rem">${buddy(`<b>Ollie is writing ${esc(what)} for you…</b><br>This can take up to a minute. Please keep this page open.`, 'happy')}<div class="spinner" aria-hidden="true"></div></div>`);
}
async function aiRun(what, job) {
  if (aiBusy) return; aiBusy = true;
  aiWaiting(what);
  try { await job(); }
  catch (e) { page(`<div class="card">${buddy(`<b>Oops, that did not work.</b><br>${esc(e.message || 'Something went wrong.')}`)}<div class="row" style="margin-top:1rem"><button class="btn" onclick="history.back()">Go back</button>${location.hash === '#parent' ? '' : '<a class="btn alt" href="#parent">Check AI settings</a>'}</div></div>`); }
  finally { aiBusy = false; }
}
function aiExercise(sid, tid, level) {
  const t = topicOf(sid, tid), passage = isPassageTopic(sid, tid);
  const kind = tid === 'comp_poetry' ? 'poem' : tid === 'comp_nonfiction' ? 'non-fiction article' : tid === 'cloze' ? 'story with numbered gaps written like (1), (2) where a word is missing; each question asks which word fills one gap' : 'story';
  level = aiLevelOK(level || 2);
  aiRun(`10 new ${aiLevelName(level).toLowerCase()} ${t.name} questions`, async () => {
    const qs = await aiMake({ sid, tids: [tid], n: passage ? 8 : 10, level, passage: passage ? kind : null });
    if (S) finish(false);
    begin('exercise', sid, tid, qs, { target: qs.length, ai: true, hard: level === 3 || level === 4, label: `AI practice · ${aiLevelName(level)}`, cfg: { k: 'aiex', sid, tid, level } });
  });
}
// A practice set across a whole subject (or the child's weak topics), at the chosen level. Hints and explanations, no timer.
function aiPractice(sid, level, weakOnly) {
  level = aiLevelOK(level);
  let tids = plainTopics(sid);
  if (weakOnly) { const w = weakTopics([sid], 4).map(x => x.tid).filter(id => tids.includes(id)); if (w.length) tids = w; }
  aiRun(`15 new ${aiLevelName(level).toLowerCase()} ${B(sid).name} questions`, async () => {
    const qs = await aiMake({ sid, tids, n: 15, level });
    if (S) finish(false);
    begin('exercise', sid, tids.length === 1 ? tids[0] : null, qs, { target: qs.length, ai: true, hard: level === 3 || level === 4, label: `AI practice set · ${aiLevelName(level)}`, cfg: { k: 'aiset', sid, level, weakOnly: !!weakOnly } });
  });
}
const AIMOCK = {
  maths: { name: 'AI Maths paper', parts: ['maths'] },
  english: { name: 'AI English paper', parts: ['english'] },
  vr: { name: 'AI Verbal reasoning paper', parts: ['vr'] },
  full: { name: 'AI complete mock exam', parts: ['english', 'maths'].concat(REASONING_KEYS) }
};
function aiMock(kind, level) {
  const m = AIMOCK[kind]; if (!m) return;
  level = aiLevelOK(level || 'mixed');
  const lv = level, title = `${m.name}${lv === 'mixed' ? '' : ' · ' + aiLevelName(lv)}`;
  aiRun(`a brand new ${m.name.replace('AI ', '')}${lv === 'mixed' ? '' : ' (' + aiLevelName(lv).toLowerCase() + ')'}`, async () => {
    const recent = recentTested();
    const jobs = m.parts.map(async p => {
      if (p === 'maths') return { name: 'Maths', mins: scaled(25), qs: (await aiMake({ sid: 'maths', tids: plainTopics('maths'), n: 25, level: lv })).sort((a, b) => a.d - b.d) };
      if (p === 'vr') return { name: 'Verbal reasoning', mins: scaled(20), qs: (await aiMake({ sid: 'vr', tids: plainTopics('vr'), n: 24, level: lv })).sort((a, b) => a.d - b.d) };
      if (p === 'english') {
        const [text, rest] = await Promise.all([aiMake({ sid: 'english', tids: ['comp_fiction'], n: 10, level: lv, passage: 'story' }), aiMake({ sid: 'english', tids: ['spelling', 'punctuation', 'grammar', 'vocabulary', 'synonyms_antonyms', 'sentence_completion'], n: 14, level: lv })]);
        return { name: 'English', mins: scaled(25), qs: text.concat(rest.sort((a, b) => a.d - b.d)) };
      }
      return mockSection(p, recent);   // non-verbal and spatial reasoning come from the puzzle engine
    });
    const secs = await Promise.all(jobs);
    if (kind === 'full') secs[2].rest = true;
    if (S) finish(false);
    timedSession('mock', kind === 'full' ? 'mix' : m.parts[0], title, secs, { k: 'aimock', kind, level: lv });
  });
}

// "Generate a new test" on the results page: the same kind of paper, freshly picked.
function regenerate(cfg) {
  if (!cfg) return;
  if (cfg.k === 'test') startTest(cfg.sid);
  else if (cfg.k === 'mix') startMix(cfg.kind);
  else if (cfg.k === 'mock') startMock(cfg.kind);
  else if (cfg.k === 'focus') startFocus(cfg.scope);
  else if (cfg.k === 'challenge') startChallenge(cfg.sid, cfg.tid);
  else if (cfg.k === 'hard') startHardTest(cfg.sid);
  else if (cfg.k === 'aiex') aiExercise(cfg.sid, cfg.tid, cfg.level);
  else if (cfg.k === 'aimock') aiMock(cfg.kind, cfg.level);
  else if (cfg.k === 'aiset') aiPractice(cfg.sid, cfg.level, cfg.weakOnly);
}
function startRevision() {
  const ids = shuffle(dueList()).slice(0, 15);
  if (!ids.length) return;
  begin('revision', QI[ids[0]].subject, null, ids.map(id => QI[id]));
}
function tick() {
  if (!S || !S.parts || S.between) return stopTimer();
  const left = Math.max(0, Math.round((S.deadline - Date.now()) / 1000));
  const el = $('#clock');
  if (el) { el.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); el.classList.toggle('low', left <= 60); }
  const part = S.parts[S.part], mins = part.mins;
  if (mins >= 8 && left <= 300 && left > 60 && !S.warned[5]) { S.warned[5] = 1; toast('5 minutes left. Keep going, and leave time to guess any you skip.'); }
  if (left <= 60 && left > 0 && !S.warned[1]) { S.warned[1] = 1; toast('1 minute left! Fill in an answer for every blank question. A guess can still score.'); }
  const pe = $('#pace');
  if (pe) {
    const n = part.to - part.from, used = mins * 60 - left;
    const done = S.items.slice(part.from, part.to).filter(i => i.chosen !== null).length;
    const expect = used / (mins * 60 / n), gap = done - expect;
    pe.textContent = done >= n ? 'All answered. Use the spare time to check.' : gap >= -1 ? `On track · ${done} of ${n} answered` : `Speed up a little · ${done} of ${n} answered`;
    pe.className = 'pace ' + (done >= n || gap >= -1 ? 'good' : 'slow');
  }
  if (left <= 0) endPart();
}

function finish(redirect) {
  stopTimer(); stamp();
  if (!S) return;
  const s = S; S = null; delete st.active;
  if (s.warm) { s.part = s.warm.part - 1; s.warm = null; }   // leaving during the practice: only the sections already done count
  const isTimed = !!s.parts;
  if (isTimed && !redirect && !s.between) s.elapsed = (s.elapsed || 0) + Math.min(s.parts[s.part].mins * 60, Math.round((Date.now() - s.partStart) / 1000));
  // a timed paper counts blanks as not yet right; anything else only counts what was answered
  // (if he leaves a timed paper part-way, only the questions he answered are kept)
  let items = isTimed && redirect ? s.items.slice(0, s.part >= 0 ? s.parts[s.part].to : 0) : s.items.filter(i => i.chosen !== null);
  if (isTimed && !items.some(i => i.chosen !== null)) items = [];
  if (!items.length) { save(); if (redirect) location.hash = '#home'; return; }
  if (isTimed) items.forEach(i => { if (i.chosen === i.q.a) s.stars++; record(i.q, i.chosen === i.q.a, 'test'); });
  const score = items.filter(i => i.chosen === i.q.a).length;
  const secs = isTimed ? (s.elapsed || 0) : Math.min(3600, Math.round((Date.now() - s.start) / 1000));
  const e = { id: 'h' + Date.now(), ts: Date.now(), day: today(), mode: s.mode, subject: s.subject, topic: s.topic, score, total: items.length, secs, stars: s.stars, items: items.map(i => ({ id: i.q.id, c: orig(i.q, i.chosen), t: Math.round((i.secs || 0) / 1000) })) };
  if (s.label) e.label = s.label;
  if (s.cfg && redirect) e.cfg = s.cfg;
  if (s.from) e.from = s.from;
  if (isTimed) e.mins = s.parts.slice(0, s.part + 1).reduce((a, p) => a + p.mins, 0);
  if (isTimed && redirect && s.parts.length > 1) e.parts = s.parts.slice(0, s.part + 1).map(p => ({ name: p.name, from: p.from, to: p.to }));
  st.history.unshift(e);
  if (st.history.length > 400) st.history.length = 400;
  if (st.lastDay !== today()) { st.streak = st.lastDay === plusDays(-1) ? st.streak + 1 : 1; st.lastDay = today(); }
  st.time[today()] = (st.time[today()] || 0) + secs;
  if (s.topic) st.last = { subject: s.subject, topic: s.topic };
  awards = [];
  const pct = score / items.length;
  award('first');
  const prev = e.label && st.history.find(h => h.id !== e.id && h.label === e.label && h.mode === e.mode);
  if (prev && redirect && pct - prev.score / prev.total >= 0.2) award('comeback');
  if (s.mode === 'quiz' && items.length >= 8 && pct >= 0.8) award('t:' + tkey(s.subject, s.topic));
  if (s.mode === 'test' && pct >= 0.8) award('test80');
  if ((s.mode === 'test' || s.mode === 'mock') && redirect && pct === 1 && items.length >= 8) award('perfect');
  if (st.history.filter(h => h.mode === 'test' || h.mode === 'mock').length >= 10) award('tests10');
  if (s.mode === 'fix' && items.length >= 2 && pct >= 0.7) award('fix1');
  if (s.cfg && s.cfg.k === 'focus' && redirect && pct >= 0.7) award('focus1');
  if (s.mode === 'mock' && redirect && s.part + 1 === s.parts.length) award('mock1');
  if (s.mode === 'mock' && s.parts.length > 1 && s.part + 1 === s.parts.length && pct >= 0.8) award('mock80');
  checkAwards();
  save();
  if (redirect) location.hash = '#history/' + e.id + '/done';
}

// ---------------------------------------------------------------- views
const view = () => $('#view');
function page(html) { view().innerHTML = resumeBar() + html; chips(); animateCounts(); }
const bar = (v, cls) => `<div class="bar ${cls || ''}"><i style="width:${Math.round(v * 100)}%"></i></div>`;
// A section that opens and closes. It remembers whether it was left open or closed.
const fold = (id, title, body, open, cls) => { const f = (st.settings.folds || {})[id], isOpen = f === undefined ? open : f; return `<details class="fold ${cls || ''}" data-fold="${id}" ${isOpen ? 'open' : ''}><summary>${title}</summary><div class="fold-body">${body}</div></details>`; };

function plan() {
  if (!st.plan || st.plan.day !== today() || !ready(st.plan.sid) || !topicOf(st.plan.sid, st.plan.tid)) {
    const w = WEEK[new Date().getDay()];
    const sid = w.sid && ready(w.sid) ? w.sid : firstReady();
    st.plan = { day: today(), sid, tid: nextTopic(sid).id, kind: w.kind, swapped: !!(w.sid && !ready(w.sid)) && w.sid };
    save();
  }
  return st.plan;
}
function planSteps() {
  const p = plan(), t = topicOf(p.sid, p.tid), done = st.history.filter(h => h.day === today());
  const due = dueList().length, steps = [];
  if (due || done.some(h => h.mode === 'revision')) steps.push({ label: due ? `Revision: ${due} question${due > 1 ? 's' : ''} ready to try again` : 'Revision done', href: '#revise', done: !due });
  if (p.kind === 'light') {
    steps.push({ label: 'Flashcards: flip through ten cards', href: '#revise', done: st.flashDay === today() });
  } else {
    steps.push({ label: `Learn: ${t.name}`, href: `#lesson/${p.sid}/${p.tid}`, done: st.lessons[tkey(p.sid, p.tid)] === today() });
    steps.push({ label: `Practise: ${t.name} exercise`, act: 'exercise', sid: p.sid, tid: p.tid, done: done.some(h => h.mode === 'exercise' && h.topic === p.tid) });
    if (p.kind === 'test') steps.push({ label: '10-minute test', act: 'test', sid: p.sid, done: done.some(h => h.mode === 'test') });
    else steps.push({ label: `Quiz: ${t.name}`, act: 'quiz', sid: p.sid, tid: p.tid, done: done.some(h => h.mode === 'quiz' && h.topic === p.tid) });
  }
  return steps;
}

function vHome() {
  const p = plan(), steps = planSteps(), mins = Math.round((st.time[today()] || 0) / 60), wd = new Date().getDay();
  const last = st.last && ready(st.last.subject) && topicOf(st.last.subject, st.last.topic);
  const first = B(p.sid).topics[0];
  const cont = last ? `<a class="btn big" href="#topic/${st.last.subject}/${st.last.topic}">Continue where you left off: ${esc(last.name)} →</a>`
    : `<a class="btn big" href="#lesson/${p.sid}/${first.id}">Start your first lesson: ${esc(first.name)} →</a>`;
  const hour = new Date().getHours(), nm = st.settings.name ? ', ' + esc(st.settings.name) : '';
  const done = steps.filter(s => s.done).length, allDone = done === steps.length;
  const rk = rank(), toNext = rk.next ? rk.next[0] - st.stars : 0;
  const say = allDone ? `<b>You finished today's plan. Amazing!</b> Anything extra is a bonus. Maybe try a new test?`
    : mins >= 20 ? `<b>${mins} minutes today. Super effort!</b> Time for a break and a snack.`
    : !st.history.length ? `<b>Hello! I'm Ollie the owl.</b> I'll cheer you on. Let's start with your first lesson!`
    : pick(FUN);
  page(`
    <h1>${hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}${nm}! Ready to explore?</h1>
    ${countdownHTML() ? `<p>${countdownHTML()}</p>` : ''}
    <div class="hero">${buddy(say, allDone ? 'happy' : '')}</div>
    ${st.settings.name ? '' : `<div class="card namecard"><form data-submit="hello" class="row"><label for="hello" style="margin:0">👋 What's your first name?</label>
      <input id="hello" class="inp" type="text" maxlength="20" autocomplete="off" placeholder="Type your name"><button class="btn" type="submit">Save</button></form>
      <p class="small muted">Ollie will use it to say hello, and it goes on your certificates. It stays on this device.</p></div>`}
    <div class="tiles four">
      <a class="tile" href="#trophies"><b>${rk.r[1]}</b><span>${esc(rk.r[2])}${rk.next ? `<br><small>${toNext} ⭐ to ${esc(rk.next[2])}</small>` : ''}</span></a>
      <div class="tile"><b><span class="flame">🔥</span> <span class="count" data-n="${st.streak}">${st.streak}</span></b><span>day streak</span></div>
      <div class="tile"><b>⭐ <span class="count" data-n="${st.stars}">${st.stars}</span></b><span>stars</span></div>
      <div class="tile"><div class="mini-ring" style="--p:${Math.round(Math.min(1, mins / 15) * 100)}"><span>${mins}</span></div><span>of 15 minutes today</span></div>
    </div>
    <div style="margin:1rem 0">${cont}</div>
    <div class="card">
      <div class="row spread"><h2 style="margin:0">Today's plan</h2><span class="pill ${allDone ? 'gold' : ''}">${allDone ? '🎉 All done!' : `${done} of ${steps.length} done`}</span></div>
      ${p.swapped ? `<p class="small muted">${esc(subj(p.swapped).name)} joins the app in the next stage, so today is ${esc(subj(p.sid).name)}.</p>` : ''}
      <ul class="plan">${steps.map(s => `<li><span class="tick ${s.done ? 'done' : ''}">${s.done ? '✓' : ''}</span><span class="grow">${esc(s.label)}</span>
        ${s.href ? `<a class="btn alt" href="${s.href}">${s.done ? 'Again' : 'Go'}</a>` : `<button class="btn alt" data-act="${s.act}" data-sid="${s.sid}" data-tid="${s.tid || ''}">${s.done ? 'Again' : 'Go'}</button>`}</li>`).join('')}</ul>
    </div>
    <div class="grid">
      <a class="card subject" href="#tests" style="--c:#e8590c"><span class="ico">🎲</span><span><h3>Take a new test</h3><span class="muted small">Every test is freshly picked. Try a weak-spot test!</span></span></a>
      <a class="card subject" href="#trophies" style="--c:#f08c00"><span class="ico">🏆</span><span><h3>Trophy room</h3><span class="muted small">${Object.keys(st.badges).length} awards so far. What's next?</span></span></a>
      <a class="card subject" href="#tips" style="--c:#2f9e44"><span class="ico">💡</span><span><h3>Exam tips</h3><span class="muted small">Tricks that add marks in every paper.</span></span></a>
    </div>
    <div class="card">
      <h2 style="margin-top:0">This week</h2>
      <div class="week">${WEEK.map((w, i) => `<div class="${i === wd ? 'today' : ''}"><b>${DAYS[i]}</b>${esc(w.label)}</div>`).join('')}</div>
    </div>`);
}

// "Who's learning today?" screen
function peekChild(id) { try { const o = JSON.parse(localStorage.getItem(keyFor(id))) || {}; return { stars: o.stars || 0, streak: o.streak || 0, badges: Object.keys(o.badges || {}).length }; } catch (e) { return { stars: 0, streak: 0, badges: 0 }; } }
function vWho(note) {
  page(`<h1>Who's learning today?</h1>${note ? `<div class="box eg">${esc(note)}</div>` : ''}
    <div class="whogrid">${meta.list.map(p => { const k = peekChild(p.id); return `<button class="card whocard ${p.id === meta.current ? 'on' : ''}" data-act="switchchild" data-id="${p.id}"><span class="wa">${p.avatar}</span><b>${esc(p.name || 'Explorer')}</b><span class="small muted">⭐ ${k.stars} · 🔥 ${k.streak} · 🏅 ${k.badges}</span>${p.id === meta.current ? '<span class="pill">Playing now</span>' : ''}</button>`; }).join('')}</div>
    ${meta.list.length < 6 ? `<div class="card"><h3>➕ Add a child</h3><p class="small muted">Each child gets their own stars, history, revision and parent report on this device.</p>
      <form data-submit="addchild"><label for="newname">First name</label><input id="newname" class="inp" type="text" maxlength="20" autocomplete="off" placeholder="Name">
      <p class="small" style="margin:.7rem 0 .3rem"><b>Pick an animal</b></p><div class="avpick">${AVATARS.map((a, i) => `<label><input type="radio" name="av" value="${a}" ${i === meta.list.length % AVATARS.length ? 'checked' : ''}><span>${a}</span></label>`).join('')}</div>
      <button class="btn" type="submit" style="margin-top:.8rem">Add</button></form></div>` : ''}`);
}
function switchChild(id) {
  if (!meta.list.some(p => p.id === id)) return;
  if (S) { stamp(); stopTimer(); persist(); }
  meta.current = id; saveMeta();
  KEY = keyFor(id); st = load(); S = null; restore();
  if (!st.settings.name && me().name) { st.settings.name = me().name; save(); }
  F = null; TRY = null; lastStars = null; try { sessionStorage.setItem('elevenplus.chosen', '1'); } catch (e) { /* ok */ }
  if (location.hash === '#home') route(); else location.hash = '#home';
}
function vMore() {
  const items = [['#progress', '📈', 'Progress', 'Strong and weak topics, score trend'], ['#history', '🕘', 'History', 'Every activity you have finished'], ['#tips', '💡', 'Exam tips', 'Tricks that add marks'], ['#parent', '🔒', 'Parent view', 'PIN protected summary for grown-ups'], ['#settings', '⚙️', 'Settings', 'Your name, sound, exam date, backup']];
  page(`<h1>More</h1>${items.map(i => `<a class="card subject" href="${i[0]}"><span class="ico">${i[1]}</span><span style="flex:1"><h3>${i[2]}</h3><span class="muted small">${i[3]}</span></span><span class="go">→</span></a>`).join('')}`);
}
// ---- trophy room and certificates
function vTrophies() {
  const rk = rank(), earned = id => st.badges[id];
  const card = (id, info) => { const e = earned(id); return `<div class="trophy ${e ? 'got' : 'locked'}"><span class="ti">${e ? info.icon : '🔒'}</span><b>${esc(info.name)}</b><span class="small muted">${e ? 'Earned ' + e.split('-').reverse().join('/') : esc(info.how)}</span>
    ${e ? `<a class="small" href="#cert/${encodeURIComponent(id)}">📜 Certificate</a>` : ''}</div>`; };
  const tstars = Object.keys(st.badges).filter(b => b.startsWith('t:'));
  const got = BADGES.filter(b => earned(b.id)).length;
  page(`<h1>🏆 Trophy room</h1><p class="muted">Every award here was earned by hard work. Keep exploring to fill every shelf!</p>
    <div class="card rankcard"><span class="bigicon">${rk.r[1]}</span><div style="flex:1"><p class="small muted" style="margin:0">Your explorer rank</p><h2 style="margin:.1rem 0">${esc(rk.r[2])}</h2>
      ${rk.next ? `${bar((st.stars - rk.r[0]) / (rk.next[0] - rk.r[0]), 'gold')}<p class="small">⭐ ${st.stars} stars · <b>${rk.next[0] - st.stars} more</b> to become ${rk.next[1]} ${esc(rk.next[2])}</p>` : '<p><b>The highest rank of all. Legendary!</b></p>'}
      <div class="ranks">${RANKS.map((r, i) => `<span class="${i <= rk.i ? 'on' : ''}" title="${esc(r[2])}: ${r[0]} stars">${r[1]}</span>`).join('')}</div></div></div>
    ${fold('tr-medals', '<span class="ft">🥇 Subject medals</span>', `<div class="shelf">${SUBJECTS.filter(s => ready(s.id)).map(s => `<div class="card medalcard" style="--c:${s.c}"><h3>${s.icon} ${esc(s.name)}</h3><p class="small muted">${topicStars(s.id)} of ${B(s.id).topics.length} topic stars</p>
      <div class="medals">${MEDALS.map(m => { const id = `m:${s.id}:${m.k}`; return `<a class="medal ${earned(id) ? 'got' : ''}" ${earned(id) ? `href="#cert/${encodeURIComponent(id)}"` : ''} title="${esc(badgeInfo(id).how)}"><span>${m.icon}</span><small>${earned(id) ? m.name : medalNeed(s.id, m.k) + ' ⭐'}</small></a>`; }).join('')}</div></div>`).join('')}</div>`, true)}
    ${fold('tr-badges', `<span class="ft">🏅 Badges</span><span class="pill">${got} of ${BADGES.length}</span>`, `<div class="trophies">${BADGES.map(b => card(b.id, b)).join('')}</div>`, true)}
    <h2>Topic stars <span class="pill">${tstars.length}</span></h2>
    <p class="muted small">Score 8 or more out of 10 in a topic quiz to win its star. Tap a subject to see its stars.</p>
    ${SUBJECTS.filter(s => ready(s.id)).map(s => { const mine = tstars.filter(id => id.startsWith('t:' + s.id + '/')); return fold('tr-ts-' + s.id, `<span class="ft" style="--c:${s.c}">${s.icon} ${esc(s.name)}</span><span class="pill">${mine.length} of ${B(s.id).topics.length}</span>`,
      mine.length ? `<div class="trophies">${mine.map(id => card(id, badgeInfo(id))).join('')}</div>` : buddy(`No ${esc(s.name)} stars yet. Pick a topic, read the lesson, then take its quiz. You can do it!`), false, 'card'); }).join('')}`);
}
function vCert(id) {
  const info = badgeInfo(id), when = st.badges[id];
  if (!when) return vTrophies();
  const name = st.settings.name;
  page(`<p class="noprint"><a href="#trophies">← Trophy room</a></p>
    ${name ? '' : `<div class="card noprint"><label for="certname">Whose certificate is this?</label><input id="certname" class="inp" type="text" maxlength="20" data-change="name" placeholder="Type your first name"></div>`}
    <div class="cert"><div class="cert-in">
      <div class="cert-owl">${OWL}</div>
      <p class="cert-k">Certificate of Achievement</p>
      <p>This certificate is proudly presented to</p>
      <p class="cert-name">${esc(name || 'a brilliant 11+ Explorer')}</p>
      <p>for earning the award</p>
      <p class="cert-award">${info.icon} ${esc(info.name)}</p>
      <p class="muted">${esc(info.how)}</p>
      <div class="cert-foot"><span>${new Date(when + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span><span><b>11+ Explorer</b></span></div>
    </div></div>
    <div class="row noprint" style="justify-content:center;margin-top:1rem">${canPrint() ? '<button class="btn" data-act="print">🖨 Print certificate</button>' : '<p class="muted small">Take a screenshot to save or share your certificate.</p>'}</div>`);
  if (!reduced()) confetti(50);
}

function vLearn() {
  page(`<h1>Learn</h1><p class="muted">Pick a subject. Each topic has a short lesson, an exercise and a quiz. Fill up the stars as you master each one!</p><div class="subjects">` +
    SUBJECTS.map(s => {
      if (!ready(s.id)) return `<div class="card subject locked" style="--c:${s.c}"><span class="ico">${s.icon}</span><span><h3>${esc(s.name)}</h3><span class="muted small">Coming soon</span></span></div>`;
      const tops = B(s.id).topics, got = tops.reduce((a, t) => a + starsOf(s.id, t.id), 0), medal = [...MEDALS].reverse().find(m => st.badges[`m:${s.id}:${m.k}`]);
      return `<a class="card subject" href="#learn/${s.id}" style="--c:${s.c}"><span class="ico">${s.icon}</span><span style="flex:1"><h3>${esc(s.name)} ${medal ? medal.icon : ''}</h3>
        <span class="muted small">${tops.length} topics · ⭐ ${got} of ${tops.length * 3} stars</span>${bar(got / (tops.length * 3), 'c')}</span><span class="go">→</span></a>`;
    }).join('') + '</div>');
}

function vSubject(sid) {
  if (!ready(sid)) return vLearn();
  const s0 = subj(sid);
  page(`<div style="--c:${s0.c}"><p><a href="#learn">← Subjects</a></p><h1>${s0.icon} ${esc(B(sid).name)}</h1><p class="muted">Topics run from easier to harder. Work down the path and collect three stars on each one.</p>
    <div class="path">` +
    B(sid).topics.map((t, i) => {
      const s = peek(sid, t.id), star = st.badges['t:' + tkey(sid, t.id)], n = starsOf(sid, t.id);
      return `<a class="card topic ${n === 3 ? 'done' : ''}" href="#topic/${sid}/${t.id}"><span class="num">${n === 3 ? '✓' : i + 1}</span><span><b>${esc(t.name)}</b> ${starRow(n)}${bar(mastery(sid, t.id), 'c')}</span>
        <span class="side">${star ? '<span class="pill gold">🏅 Quiz star</span> ' : ''}<span class="pill ${s ? '' : 'grey'}">${s ? LEVEL[s.level] : 'New'}</span></span></a>`;
    }).join('') + '</div></div>');
}

function vTopic(sid, tid) {
  const t = ready(sid) && topicOf(sid, tid);
  if (!t) return vLearn();
  const here = mode => S && S.mode === mode && S.subject === sid && S.topic === tid;
  const s = peek(sid, tid);
  page(`<p><a href="#learn/${sid}">← ${esc(B(sid).name)}</a></p><h1>${esc(t.name)}</h1>
    <p class="muted">${s ? `${s.correct} right out of ${s.seen} so far · Level: ${LEVEL[s.level]}` : 'New topic. Start with the lesson.'}</p>${bar(mastery(sid, tid), 'g')}
    <div class="grid" style="margin-top:1rem">
      <div class="card"><h3>1. Lesson</h3><p class="muted small">${t.extra ? 'Planning tips, writing prompts and a checklist.' : 'A short explanation with a worked example.'}</p><a class="btn alt" href="#lesson/${sid}/${tid}">Read the lesson</a></div>
      <div class="card"><h3>2. Exercise</h3><p class="muted small">No timer. Hints and full explanations.</p>${here('exercise') ? `<button class="btn" data-act="exercise" data-sid="${sid}" data-tid="${tid}">Continue: question ${sessionWhere().num} of ${sessionWhere().total} →</button><button class="btn ghost" style="margin-top:.5rem" data-act="restartex" data-sid="${sid}" data-tid="${tid}">Start a new set</button>` : `<button class="btn" data-act="exercise" data-sid="${sid}" data-tid="${tid}">Start practising</button>`}</div>
      <div class="card"><h3>3. Quiz</h3><p class="muted small">10 questions. Score 8 or more to earn the topic star.</p><button class="btn alt" data-act="quiz" data-sid="${sid}" data-tid="${tid}">${here('quiz') ? `Continue quiz: question ${sessionWhere().num} of ${sessionWhere().total} →` : 'Take the quiz'}</button></div>
      <div class="card hardcard"><h3>4. 🔥 Challenge</h3><p class="muted small">Only the hardest questions, for when you feel ready. No timer, hints allowed.</p><button class="btn alt" data-act="challenge" data-sid="${sid}" data-tid="${tid}">${S && S.hard && S.subject === sid && S.topic === tid ? `Continue: question ${sessionWhere().num} of ${sessionWhere().total} →` : 'Take the challenge'}</button></div>
    </div>
    ${sid !== 'nvr' && !t.extra ? (aiReady() ? `<div class="card aicard"><h3>✨ AI practice</h3><p class="muted small">Ten brand-new questions on ${esc(t.name)}, written by AI just for you. Choose how hard:</p>
      <div class="row">${[1, 2, 3, 4].map(l => `<button class="btn ${l === Math.min(3, (s ? s.level : 1) + 1) ? '' : 'alt'} ${l >= 3 ? 'hotbtn' : ''}" data-act="aiex" data-sid="${sid}" data-tid="${tid}" data-l="${l}">${l === 3 ? '🔥 ' : l === 4 ? '🔥🔥 ' : ''}${AI_LEVELS[l].name}</button>`).join('')}</div>
      <p class="small muted" style="margin-top:.4rem">Very hard goes beyond the real Kent Test, for children aiming at the top grammar schools.</p></div>`
      : `<p class="small muted">✨ Want endless new questions written by AI? A grown-up can add an AI key in the <a href="#parent">parent view</a>.</p>`) : ''}`);
}

function vLesson(sid, tid) {
  const t = ready(sid) && topicOf(sid, tid);
  if (!t) return vLearn();
  if (!TRY || TRY.sid !== sid || TRY.tid !== tid) tryNew(sid, tid, 1);
  st.lessons[tkey(sid, tid)] = today(); st.last = { subject: sid, topic: tid };
  awards = []; checkAwards(); save();
  if (awards.length) setTimeout(() => celebrate(awards), 300);
  page(`<p><a href="#topic/${sid}/${tid}">← ${esc(t.name)}</a></p><h1>${esc(t.name)}</h1>
    ${canSpeak() ? '<p><button class="btn ghost" data-act="speak" data-sel="#view .lesson">🔊 Read this lesson to me</button></p>' : ''}
    <div class="card lesson">${lessonBody(t)}</div>
    ${tryHTML()}
    ${t.extra ? `<div class="card"><h3>✏️ Writing practice</h3><p class="muted small">Pick a prompt, plan for 5 minutes, write for 20, then check for 5. Write on paper.</p>
      <div class="box eg"><p style="font-size:1.1rem"><b>${esc(t.extra.prompts[promptIdx % t.extra.prompts.length])}</b></p></div>
      <button class="btn alt" data-act="prompt" data-sid="${sid}" data-tid="${tid}">Give me another prompt</button>
      <h3 style="margin-top:1.2rem">Plan in five boxes</h3><div class="week" style="grid-template-columns:repeat(5,1fr)">${['Opening', 'Build-up', 'Problem', 'Resolution', 'Ending'].map((b, i) => `<div><b>${i + 1}</b>${b}</div>`).join('')}</div>
      <h3 style="margin-top:1.2rem">Check your writing</h3><ul>${t.extra.checklist.map(c => `<li>${esc(c)}</li>`).join('')}</ul></div>` : ''}
    <button class="btn big" data-act="exercise" data-sid="${sid}" data-tid="${tid}">Try the ${t.extra ? 'technique questions' : 'exercise'} →</button>`);
}

function vTests() {
  const b = BOARDS[st.settings.board], count = paceCount();
  const card = (title, text, act, data, label) => `<div class="card"><div class="row spread"><div style="flex:1;min-width:220px"><h3>${title}</h3><p class="muted small">${text}</p></div>
    <button class="btn" data-act="${act}" ${data}>${label}</button></div></div>`;
  const info = k => { const ks = MOCKS[k].keys; return `${ks.reduce((a, x) => a + MOCK_SIZE[x], 0)} questions · ${ks.reduce((a, x) => a + scaled(MOCK_MINS[x]), 0)} minutes`; };
  const weak = weakTopics(SUBJECTS.map(s => s.id), 4);
  const tried = weak.filter(w => w.seen >= 3).length;
  page(`<h1>Tests</h1><p class="muted">Exam setting: ${esc(b.name)}. No hints in a test. Answers and methods are shown at the end.</p>
    <div class="box eg small">🎲 <b>Every test is new.</b> Questions are picked at random and answers are shuffled, and questions from your recent tests are kept out. When you finish you can generate another one straight away. <a href="#tips">Read the exam tips →</a></div>
    ` + fold('t-weak', '<span class="ft">🎯 Weak-spot test</span>', weak.length ? card('🎯 My weak spots', `${count} questions on ${tried ? 'the topics you find hardest right now' : 'four topics to get you started'}: ${weak.map(w => esc(w.name)).join(', ')}.`, 'focus', 'data-scope="all"', 'Start') : '', true) +
    fold('t-one', '<span class="ft">⏱️ 10-minute tests: one subject</span>', SUBJECTS.filter(s => ready(s.id)).map(s => card(`${s.icon} ${esc(s.name)}`, `${count} questions from across the subject.`, 'test', `data-sid="${s.id}"`, 'Start')).join(''), true) +
    fold('t-hard', '<span class="ft">🔥 Challenge tests: hard questions only</span>', SUBJECTS.filter(s => ready(s.id)).map(s => card(`${s.icon} ${esc(s.name)} challenge`, `${count} of the hardest questions, 10 minutes. For when you are flying!`, 'hardtest', `data-sid="${s.id}"`, 'Start')).join(''), false) +
    fold('t-ai', '<span class="ft">✨ AI practice and AI mock exams</span>', aiReady() ? `<p class="muted small">Brand-new questions written by AI every time. Choose how hard first. Writing a paper takes up to a minute.</p>
      <div class="card"><h3>How hard?</h3><div class="row lvpick" role="radiogroup" aria-label="AI difficulty">${['1', '2', 'mixed', '3', 'hardmix', '4'].map(l => `<button class="btn small-btn ${String(aiLv()) === l ? '' : 'alt'}" role="radio" aria-checked="${String(aiLv()) === l}" data-act="ailevel" data-l="${l}">${+l >= 3 || l === 'hardmix' ? '🔥 ' : ''}${AI_LEVELS[l].name}</button>`).join('')}</div>
      <p class="small muted" style="margin-top:.4rem">${esc(AI_LEVEL_HELP[aiLv()])}</p></div>
      <h3 class="subh">✏️ AI practice sets <span class="small muted">(hints and explanations, no timer)</span></h3>` +
      ['maths', 'english', 'vr'].filter(ready).map(sid => card(`${(SUBJECTS.find(x => x.id === sid) || {}).icon || ''} ${esc(B(sid).name)}: 15 new questions`, `Across the whole subject, ${esc(aiLevelName(aiLv()).toLowerCase())}.`, 'aiset', `data-sid="${sid}"`, 'Write them')).join('') +
      card('🎯 AI practice on my weak spots', `15 new questions on the topics you find hardest, ${esc(aiLevelName(aiLv()).toLowerCase())}.`, 'aiweak', '', 'Write them') +
      `<h3 class="subh">📝 AI mock exams <span class="small muted">(timed, like the real test)</span></h3>` +
      Object.keys(AIMOCK).map(k => card(`✨ ${esc(AIMOCK[k].name)}`, k === 'full' ? 'The complete exam: English, Maths and Verbal reasoning written by AI, plus Non-verbal reasoning puzzles drawn fresh by the puzzle engine (AI cannot draw the shapes reliably). Allow about two hours.' : 'A full-length timed paper, freshly written.', 'aimock', `data-kind="${k}"`, 'Write it')).join('')
      : `<div class="card"><p class="small">A grown-up can add an AI key in the <a href="#parent">parent view</a> to unlock brand-new AI-written exercises and mock papers.</p></div>`, false) +
    fold('t-mix', '<span class="ft">🔀 10-minute tests: mixed</span>', Object.keys(MIXES).filter(k => MIXES[k].sids.filter(ready).length > 1).map(k => card(`🔀 ${esc(MIXES[k].name)}`, `${count} questions, shared between the subjects.`, 'mix', `data-kind="${k}"`, 'Start')).join(''), false) +
    fold('t-mock', '<span class="ft">📝 Mock exams</span>', `<p class="muted small">Full-length papers laid out like the real test. Each section has its own clock, and you cannot go back to a section once it is finished. Before each section there are a few untimed practice questions, like in the real test (you can skip them). Find a quiet table before you start.</p>` +
      ['english', 'maths', 'reasoning'].filter(mockReady).map(k => card(`📝 ${esc(MOCKS[k].name)}`, info(k) + (k === 'reasoning' ? ' · five sections: verbal reasoning, then four non-verbal sections' : ''), 'mock', `data-kind="${k}"`, 'Start paper')).join('') +
      (mockReady('full') ? card('🏁 Complete mock exam', `${info('full')} · Paper 1 (English and Maths), a break, then Paper 2 (verbal reasoning and four non-verbal sections). Allow about two and a half hours.`, 'mock', 'data-kind="full"', 'Start mock') : ''), false) +
    (canPrint() ? fold('t-print', '<span class="ft">🖨 Print a paper</span>', `<p class="muted small">A fresh paper to do on paper, like the real test: a cover page, the questions, a separate answer sheet to shade in, and an answer key for a grown-up on the last page.</p>` +
      PRINTS.filter(mockReady).map(k => card(`🖨 ${esc(MOCKS[k].name)}`, info(k), 'printpaper', `data-kind="${k}"`, 'Make the paper')).join(''), false) : '') +
    (ready('english') ? `<div class="card"><div class="row spread"><div style="flex:1;min-width:220px"><h3>✏️ Writing task · 40 minutes</h3><p class="muted small">Like the Kent writing task: 10 minutes to plan, then 30 minutes to write. Your writing is saved for a grown-up to read. It is not marked.</p></div>
      <div class="row"><a class="btn" href="#writing">${st.wtask ? 'Carry on writing' : 'Start'}</a><a class="btn alt" href="#lesson/english/creative_writing">Writing tips</a></div></div></div>` : ''));
}

// ---------------------------------------------------------------- writing task (40 minutes: 10 to plan, 30 to write)
// The words are saved as they are typed, so nothing is lost on a reload. Finished pieces go into st.writing for a grown-up to read. Nothing is marked.
const WT = { plan: 10, write: 30 };
const cwTopic = () => ready('english') && topicOf('english', 'creative_writing');
const wPrompts = () => { const t = cwTopic(); return (t && t.extra && t.extra.prompts) || ['Write a story with the title "The Door in the Wall".']; };
const wChecklist = () => { const t = cwTopic(); return (t && t.extra && t.extra.checklist) || (t && t.lesson && t.lesson.checklist) || ['A plan', 'A strong opening', 'The five senses', 'Paragraphs', 'Spelling and punctuation checked']; };
const wWords = s => (String(s || '').trim().match(/\S+/g) || []).length;
let wTimer = null, wSaveT = null;
function wStop() { if (wTimer) { clearInterval(wTimer); wTimer = null; } if (wSaveT) { clearTimeout(wSaveT); wSaveT = null; save(); } }
function wTick() {
  const w = st.wtask; if (!w || location.hash !== '#writing') return wStop();
  const gone = Math.floor((Date.now() - w.start) / 1000), left = WT.plan * 60 + WT.write * 60 - gone;
  if (left <= 0) return wFinish();
  const planning = gone < WT.plan * 60, l = planning ? WT.plan * 60 - gone : left;
  const el = $('#clock'); if (el) { el.textContent = Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); el.classList.toggle('low', left <= 120); }
  const ph = $('#wphase');
  if (ph) { const txt = planning ? `Planning time: ${Math.ceil(l / 60)} min left. Jot ideas in the plan box.` : `Writing time: ${Math.ceil(l / 60)} min left.`; if (ph.dataset.t !== txt) { ph.dataset.t = txt; ph.textContent = txt; } }
  if (!planning && !w.planned) {
    w.planned = true; save();
    toast('⏰ Planning time is up. Start writing your story now!');
    const say = $('#wsay'); if (say) say.textContent = 'Planning time is up. Start writing now.';
    const box = $('#wtext'); if (box) box.focus({ preventScroll: true });
  }
}
function wFinish() {
  const w = st.wtask; if (!w) return;
  wStop();
  const secs = Math.min((WT.plan + WT.write) * 60, Math.round((Date.now() - w.start) / 1000));
  const piece = { id: 'w' + Date.now(), ts: Date.now(), day: today(), prompt: w.prompt, plan: w.plan || '', text: w.text || '', words: wWords(w.text), secs, checks: [] };
  st.writing = [piece].concat(st.writing || []).slice(0, 60);
  st.time[today()] = (st.time[today()] || 0) + secs;
  delete st.wtask; save();
  location.hash = '#writing/' + piece.id;
}
function vWriting(id) {
  if (id) {
    const p = (st.writing || []).find(x => x.id === id);
    if (!p) return vHistory();
    const list = wChecklist();
    return page(`<p><a href="#history">← History</a></p><h1>✏️ Writing task</h1>
      <p class="muted">${fmtWhen(p.ts)} · ${p.words} words · ${fmtSecs(p.secs)}</p>
      <div class="box eg"><b>Prompt:</b> ${esc(p.prompt)}</div>
      <div class="card"><h3>Check your writing</h3><p class="small muted">Read your piece again and tick each one you managed.</p>
        ${list.map((c, i) => `<label class="check"><input type="checkbox" data-change="wcheck" data-id="${esc(p.id)}" data-i="${i}" ${p.checks && p.checks[i] ? 'checked' : ''}> ${esc(c)}</label>`).join('')}</div>
      ${p.plan.trim() ? `<div class="card"><h3>Plan</h3><div class="wpiece">${esc(p.plan)}</div></div>` : ''}
      <div class="card"><h3>The writing</h3>${p.text.trim() ? `<div class="wpiece">${esc(p.text)}</div>` : '<p class="muted">Nothing was written this time.</p>'}</div>
      <p class="small muted">Writing is not marked here. In Kent the writing task is only looked at if a child's scores are borderline or there is an appeal.</p>
      <div class="row noprint"><a class="btn" href="#writing">Another writing task</a>${canPrint() ? '<button class="btn alt" data-act="print">🖨 Print</button>' : ''}</div>`);
  }
  const w = st.wtask;
  if (!w) {
    const ps = wPrompts(), pr = ps[promptIdx % ps.length];
    return page(`<p><a href="#tests">← Tests</a></p><h1>✏️ Writing task</h1>
      <p>Like the Kent writing task: <b>${WT.plan + WT.write} minutes</b> in all. Spend the first <b>${WT.plan} minutes planning</b>, then <b>${WT.write} minutes writing</b>. Leave a few minutes at the end to check.</p>
      <div class="card"><h3>Your prompt</h3><div class="box eg"><p style="font-size:1.1rem"><b>${esc(pr)}</b></p></div>
        <div class="row"><button class="btn" data-act="wstart">Start the ${WT.plan + WT.write} minutes →</button><button class="btn alt" data-act="wprompt">Give me another prompt</button></div></div>
      <p class="small muted">Your writing is saved as you type, and kept in History for a grown-up to read. The clock keeps running if you leave the page.</p>`);
  }
  if (Date.now() - w.start >= (WT.plan + WT.write) * 60000) return wFinish();
  page(`<div class="sess-head"><div><span class="pill">✏️ Writing task</span> <span class="muted">${WT.plan} min plan + ${WT.write} min write</span></div>
      <div class="row"><span id="clock" class="clock" aria-label="Time left"></span><button class="btn ghost" data-act="wfinish">I have finished</button></div></div>
    <div id="wphase" class="pace good"></div><div id="wsay" class="sr" aria-live="assertive"></div>
    <div class="box eg"><b>Prompt:</b> ${esc(w.prompt)}</div>
    <div class="card"><label for="wplan"><b>1. Plan</b> <span class="small muted">(opening, build-up, problem, resolution, ending)</span></label>
      <textarea id="wplan" class="inp wbox" rows="6" data-winput="plan" spellcheck="false">${esc(w.plan || '')}</textarea></div>
    <div class="card"><label for="wtext"><b>2. Write</b></label>
      <textarea id="wtext" class="inp wbox" rows="16" data-winput="text" spellcheck="false">${esc(w.text || '')}</textarea>
      <p class="small muted" id="wcount" aria-live="off">${wWords(w.text)} words</p></div>`);
  wTick();
  if (!wTimer) wTimer = setInterval(wTick, 1000);
}
document.addEventListener('input', e => {
  const el = e.target.closest && e.target.closest('[data-winput]'); if (!el || !st.wtask) return;
  st.wtask[el.dataset.winput] = el.value.slice(0, 30000);
  if (el.id === 'wtext') { const c = $('#wcount'); if (c) c.textContent = wWords(el.value) + ' words'; }
  if (wSaveT) clearTimeout(wSaveT);
  wSaveT = setTimeout(() => { wSaveT = null; save(); }, 400);
});
window.addEventListener('beforeunload', () => { if (wSaveT) { clearTimeout(wSaveT); wSaveT = null; save(); } });
function writingList() {
  const l = st.writing || [];
  return l.length ? `<h2>✏️ Writing tasks</h2><div class="card tablewrap"><table><thead><tr><th>When</th><th>Prompt</th><th class="num">Words</th><th></th></tr></thead><tbody>${l.map(p => `<tr><td>${fmtWhen(p.ts)}</td><td>${esc(p.prompt.length > 70 ? p.prompt.slice(0, 68) + '…' : p.prompt)}</td><td class="num">${p.words}</td><td><a href="#writing/${esc(p.id)}">Read</a></td></tr>`).join('')}</tbody></table></div>` : '';
}

// ---------------------------------------------------------------- printable papers with an answer sheet
// Built with the same section builders as the mock exams. Options stay in their bank order (A to E never move), so the key matches the print.
const PRINTS = ['english', 'maths', 'reasoning'];
let PAPER = null;
function buildPaper(kind) {
  const recent = recentTested();
  let n = 0;
  const secs = MOCKS[kind].keys.map(k => mockSection(k, recent)).filter(s => s.qs.length).map(s => ({ name: s.name, mins: s.mins, qs: s.qs.map(q => ({ q, n: ++n })) }));
  return { kind, name: MOCKS[kind].name, secs, total: n };
}
function printPassage(sid, pid) {
  const p = passages(sid)[pid]; if (!p) return '';
  let n = 0;
  const body = p.kind === 'poem' ? p.text.split('\n\n').map(v => '<div class="verse">' + v.split('\n').map(l => `<div class="line"><span class="ln">${++n}</span>${esc(l)}</div>`).join('') + '</div>').join('')
    : p.text.split('\n\n').map(par => '<p>' + esc(par).replace(/\((\d+)\)/g, (m, g) => p.kind === 'cloze' ? `<b>(${g})</b> ______` : m) + '</p>').join('');
  return `<div class="pp-passage"><h3>${p.kind === 'poem' ? 'Poem' : 'Passage'}: ${esc(p.title)}</h3>${body}</div>`;
}
const L5 = 'ABCDE';
function printQ(x) {
  const q = x.q;
  return `<div class="pp-q" data-qid="${esc(q.id)}" data-n="${x.n}"><div class="pp-qn">${x.n}</div><div class="pp-qb"><div class="qtext">${rich(q.q)}</div>${q.svg ? `<div class="fig">${q.svg}</div>` : ''}
    ${q.of ? `<div class="pp-pics">${q.of.map((f, i) => `<div class="pp-pic" data-l="${L5[i]}"><b>${L5[i]}</b><span class="ofig">${f}</span></div>`).join('')}</div>`
      : `<ol class="pp-opts">${q.opts.map((o, i) => `<li data-l="${L5[i]}"><b>${L5[i]}</b> <span class="pp-ot">${rich(o)}</span></li>`).join('')}</ol>`}</div></div>`;
}
function vPrint(kind) {
  if (!PRINTS.includes(kind) || !mockReady(kind)) return vTests();
  if (!PAPER || PAPER.kind !== kind) PAPER = buildPaper(kind);
  const P = PAPER, mins = P.secs.reduce((a, s) => a + s.mins, 0), range = s => s.qs.length ? `${s.qs[0].n}–${s.qs[s.qs.length - 1].n}` : '';
  const book = P.secs.map((s, i) => {
    let lastP = null;
    const qs = s.qs.map(x => { const pre = x.q.p && x.q.p !== lastP ? printPassage(x.q.subject, x.q.p) : ''; lastP = x.q.p || lastP; return pre + printQ(x); }).join('');
    return `<section class="pp-page pp-book"><div class="pp-sechead"><h2>Section ${i + 1}: ${esc(s.name)}</h2><p>Questions ${range(s)} · ${s.mins} minutes</p></div>${qs}<p class="pp-stop">${i + 1 < P.secs.length ? 'End of this section. Stop and wait to be told to go on.' : 'End of the paper. Check your answer sheet.'}</p></section>`;
  }).join('');
  const sheet = P.secs.map((s, i) => `<div class="pp-sblock"><h3>Section ${i + 1}: ${esc(s.name)}</h3><div class="pp-grid">${s.qs.map(x => `<div class="pp-row" data-n="${x.n}"><span class="pp-rn">${x.n}</span>${[...L5.slice(0, x.q.opts.length)].map(l => `<span class="pp-bub">${l}</span>`).join('')}</div>`).join('')}</div></div>`).join('');
  const key = P.secs.map((s, i) => `<div class="pp-kblock"><h3>Section ${i + 1}: ${esc(s.name)}</h3><ol class="pp-key">${s.qs.map(x => { const t = topicOf(x.q.subject, x.q.topic); return `<li data-n="${x.n}" value="${x.n}"><b class="pp-kl">${L5[x.q.a]}</b> <span class="small">${esc(t ? t.name : x.q.topic)}</span></li>`; }).join('')}</ol></div>`).join('');
  page(`<div class="noprint pp-bar"><p><a href="#tests">← Back to Tests</a></p><h1>🖨 ${esc(P.name)}</h1>
      <p class="muted small">${P.total} questions · ${mins} minutes. Print it, or choose "Save as PDF" in the print window. The answer key for a grown-up is on the last page.</p>
      <div class="row"><button class="btn" data-act="print">🖨 Print</button><button class="btn alt" data-act="printpaper" data-kind="${kind}">Make a different paper</button></div></div>
    <div class="paper">
    <section class="pp-page pp-cover"><p class="pp-brand">11+ Explorer · practice paper</p><h1>${esc(P.name)}</h1><p>Kent Test style (GL Assessment) · multiple choice</p>
      <div class="pp-lines"><p>Name: <span class="pp-line"></span></p><p>Date: <span class="pp-line short"></span></p></div>
      <table class="pp-secs"><thead><tr><th>Section</th><th>Questions</th><th>Time allowed</th></tr></thead><tbody>${P.secs.map((s, i) => `<tr><td>${i + 1}. ${esc(s.name)}</td><td>${range(s)}</td><td>${s.mins} minutes</td></tr>`).join('')}<tr><td><b>Total</b></td><td><b>${P.total}</b></td><td><b>${mins} minutes</b></td></tr></tbody></table>
      <h2>Instructions</h2><ul>
        <li>Do not open the booklet until you are told to start.</li>
        <li>Mark your answers on the separate <b>answer sheet</b>, not in this booklet. Shade one letter for each question.</li>
        <li>If you change your mind, rub out the first answer fully.</li>
        <li>Each section has its own time. When the time is up, stop and wait.</li>
        <li>If a question is hard, make your best guess and move on. You can come back if there is time.</li>
        <li>You may use spare paper for working out. No calculators.</li></ul>
      <p class="small">For grown-ups: time each section with a clock. The answer key is on the last page, so take it off before the paper is handed over.</p></section>
    ${book}
    <section class="pp-page pp-sheet"><h2>Answer sheet · ${esc(P.name)}</h2><p>Name: <span class="pp-line"></span></p><p class="small">Shade one letter for each question, like this: <span class="pp-bub on">A</span></p>${sheet}</section>
    <section class="pp-page pp-keyp"><h2>Answer key (for grown-ups)</h2><p class="small">${esc(P.name)} · question number, answer letter and topic. Letters match the printed booklet.</p>${key}</section></div>`);
}

// How an option is shown in feedback and review: text, or its letter plus the little picture.
const showOpt = (q, i) => q.of ? `${'ABCDE'[i]} <span class="ofig mini">${q.of[i]}</span>` : rich(q.opts[i]);

function optionHTML(q, it, fb) {
  return q.opts.map((o, i) => {
    let cls = '';
    if (fb && it.chosen !== null) cls = i === q.a ? 'right' : i === it.chosen ? 'picked' : '';
    else if (!fb && it.chosen === i) cls = 'sel';
    return `<button class="opt ${cls} ${q.of ? 'pic' : ''}" data-act="pick" data-i="${i}" ${fb && it.chosen !== null ? 'disabled' : ''}><span class="letter">${'ABCDE'[i]}</span>${q.of ? `<span class="ofig">${q.of[i]}</span>` : `<span>${rich(o)}</span>`}</button>`;
  }).join('');
}

function passageHTML(q, open) {
  const p = q.p && passages(q.subject)[q.p];
  if (!p) return '';
  let body, n = 0;
  if (p.kind === 'poem') body = p.text.split('\n\n').map(v => '<div class="verse">' + v.split('\n').map(l => `<div class="line"><span class="ln">${++n}</span>${esc(l)}</div>`).join('') + '</div>').join('');
  else body = p.text.split('\n\n').map(par => '<p>' + esc(par).replace(/\((\d+)\)/g, (m, g) => p.kind === 'cloze' ? `<span class="gap ${+g === q.gap ? 'cur' : ''}">(${g}) ____</span>` : m) + '</p>').join('');
  return `<details class="card passage" ${open ? 'open' : ''}><summary>${p.kind === 'poem' ? 'Poem' : 'Passage'}: ${esc(p.title)}</summary><div class="ptext">${body}</div></details>`;
}

function renderBetween() {
  const done = S.parts[S.part], next = S.parts[S.part + 1];
  const got = S.items.slice(done.from, done.to).filter(i => i.chosen !== null).length;
  view().classList.remove('wide');
  page(`<div class="card" style="text-align:center;padding:2rem 1.2rem">
    <p class="pill">${esc(S.label || MODE[S.mode])}</p>
    <div style="display:flex;justify-content:center;margin-top:.8rem">${buddy(`<b>${esc(done.name)} section finished!</b> Great focus. Take a breath.`, 'happy')}</div>
    <p class="muted">You answered ${got} of ${done.to - done.from} questions. The clock is stopped.</p>
    ${next.rest ? '<div class="box eg"><b>Half-way break.</b> In the real test there is a break here. Have a drink, stretch, and come back when you are ready.</div>' : '<p>Take a few deep breaths before the next section.</p>'}
    <h2>Next: ${esc(next.name)}</h2><p class="muted">${next.to - next.from} questions · ${next.mins} minutes${S.mode === 'mock' ? ' · a few practice questions first' : ''}</p>
    <button class="btn big" data-act="startpart" style="max-width:420px;margin:1rem auto 0">Start ${esc(next.name)} →</button></div>`);
}

function renderSession() {
  if (S.warm) return renderWarm();
  if (S.between) { stamp(); persist(); return renderBetween(); }
  stamp();
  const it = S.items[S.idx], q = it.q, fb = !S.parts;
  const part = S.parts && S.parts[S.part], lo = part ? part.from : 0, hi = part ? part.to : S.items.length;
  const total = S.mode === 'exercise' ? S.target : hi - lo, num = S.idx - lo + 1;
  const answered = S.items.slice(lo, hi).filter(i => i.chosen !== null).length;
  const t = topicOf(q.subject, q.topic);
  const lastPart = part && S.part + 1 === S.parts.length, endWord = part ? (lastPart ? (S.mode === 'mock' ? 'Finish exam' : 'Finish test') : 'Finish section') : 'Finish';
  const where = part ? part.name + (S.parts.length > 1 ? ` · section ${S.part + 1} of ${S.parts.length}` : '') : S.topic ? t.name : S.mode === 'fix' ? 'Second chances' : 'Mixed topics';
  const tag = S.tags && S.tags[q.id];
  const helpful = S.mode === 'exercise' || S.mode === 'fix' || S.mode === 'quiz' || S.mode === 'revision';
  let h = `<div class="sess-head"><div><span class="pill ${S.hard ? 'hardp' : S.ai ? 'aip' : ''}">${S.hard ? '🔥 Challenge' : S.ai ? '✨ AI practice' : esc(S.label && part ? S.label : MODE[S.mode])}</span> <span class="muted">${esc(where)}</span></div>
    <div class="row">${part ? '<span id="clock" class="clock" aria-label="Time left"></span>' : ''}<button class="btn ghost" data-act="finish">${endWord}</button></div></div>
    ${part ? '<div id="pace" class="pace" aria-live="polite"></div>' : ''}
    <div class="prog"><div style="width:${Math.round(100 * (fb ? answered : num) / total)}%"></div></div>
    <div class="${q.p ? 'split' : ''}">${passageHTML(q, true)}
    <div class="card" id="qcard" data-qid="${q.id}"><div class="row spread"><div class="qnum">Question ${num} of ${total}${S.mode === 'exercise' || S.mode === 'fix' ? ' · ' + (q.ai ? (q.vh ? 'Very hard' : AI_LEVELS[q.d].name) : LEVEL[q.d]) : ''}${!S.topic && fb ? ' · ' + esc(t.name) : ''}
      ${tag === 'again' ? ' <span class="pill gold">Second chance</span>' : tag === 'twin' ? ' <span class="pill">Similar question</span>' : ''}${part && S.flags.has(S.idx) ? ' <span class="pill flagp">🚩 Flagged</span>' : ''}${q.ai ? ' <span class="pill aip">✨ AI-made</span>' : ''}</div>
      <div class="row tools">${helpful && canSpeak() ? '<button class="btn ghost" data-act="speak" data-sel="#qcard .qtext,#qcard .opts" aria-label="Read the question aloud">🔊 Read to me</button>' : ''}
      ${part ? `<button class="btn ghost ${S.flags.has(S.idx) ? 'on' : ''}" data-act="flag">${S.flags.has(S.idx) ? '🚩 Unflag' : '🚩 Flag to check later'}</button>` : ''}</div></div>
    <div class="qtext">${rich(q.q)}</div>${q.svg ? `<div class="fig">${q.svg}</div>` : ''}
    <div class="opts ${q.of ? 'pics' : ''}">${optionHTML(q, it, fb)}</div>`;
  if ((S.mode === 'exercise' || S.mode === 'fix') && it.chosen === null) h += S.hint
    ? `<div class="box hint"><b>Hint:</b> ${rich(q.hint)}</div><p><button class="btn ghost" data-act="lessonpop" data-sid="${q.subject}" data-tid="${q.topic}">📖 Show me the lesson</button></p>`
    : `<p style="margin-top:1rem" class="row"><button class="btn ghost" data-act="hint">💡 Show a hint</button><button class="btn ghost" data-act="lessonpop" data-sid="${q.subject}" data-tid="${q.topic}">📖 Show me the lesson</button></p>`;
  if (fb && it.chosen !== null) {
    const ok = it.chosen === q.a, last = num >= total;
    h += `<div class="fb ${ok ? 'ok' : 'try'}" id="fbbox"><div class="fbhead ${ok ? 'happy' : ''}">${OWL}<h3>${ok ? esc(it.say) + ' <span class="plus">+1 ⭐</span>' : esc(it.say)}</h3></div>
      ${ok ? '' : `<p>You chose <b>${showOpt(q, it.chosen)}</b>. The answer is <b>${showOpt(q, q.a)}</b>.</p>`}
      <p><b>${ok ? 'The method:' : 'Here is how to work it out, step by step:'}</b></p><ol class="steps">${q.steps.map(s => `<li>${rich(s)}</li>`).join('')}</ol>
      ${!ok && t.lesson && t.lesson.watch ? `<div class="box watch"><b>Tip for ${esc(t.name.toLowerCase())}:</b> ${rich(t.lesson.watch)}</div>` : ''}
      ${S.msg === 'up' ? '<p><b>Level up!</b> Three in a row. The next questions are a bit trickier.</p>' : S.msg === 'down' ? '<p>Let\'s build confidence with some gentler questions next.</p>' : ''}
      <div class="row"><button class="btn" id="next" data-act="next">${last ? 'See how you did →' : 'Next question →'}</button>
      ${canSpeak() ? '<button class="btn ghost" data-act="speak" data-sel="#fbbox .steps,#fbbox .watch">🔊 Read the method</button>' : ''}
      ${ok ? '' : `<button class="btn ghost" data-act="lessonpop" data-sid="${q.subject}" data-tid="${q.topic}">📖 Show me the lesson</button>`}</div>
      <p style="margin:.6rem 0 0">${st.hidden && st.hidden[q.id] ? '<span class="small muted">🚩 Reported. Thank you!</span>' : reportBtn(q.id)}</p></div>`;
  }
  if (!fb) {
    const blanks = [], flagged = [];
    S.items.slice(lo, hi).forEach((x, i) => { if (x.chosen === null) blanks.push(lo + i); if (S.flags.has(lo + i)) flagged.push(lo + i); });
    const jump = list => list.map(i => `<button class="dot" data-act="goto" data-i="${i}">${i - lo + 1}</button>`).join(' ');
    h += `<div class="row spread" style="margin-top:1rem"><button class="btn alt" data-act="prev" ${S.idx > lo ? '' : 'disabled'}>← Back</button>
      ${S.idx + 1 < hi ? '<button class="btn" data-act="next">Next →</button>' : `<button class="btn" data-act="finish">${endWord}</button>`}</div>
      <div class="dots">${S.items.slice(lo, hi).map((x, i) => `<button class="dot ${x.chosen !== null ? 'done' : ''} ${lo + i === S.idx ? 'cur' : ''} ${S.flags.has(lo + i) ? 'flag' : ''}" data-act="goto" data-i="${lo + i}" aria-label="Question ${i + 1}">${i + 1}</button>`).join('')}</div>
      <p class="small muted">Tip: answer every question. If you are stuck, pick your best guess, flag it 🚩 and come back if there is time.</p>
      ${S.confirm ? `<div class="box hint"><h3>Before you finish</h3>
        ${blanks.length ? `<p><b>${blanks.length} still blank:</b> ${jump(blanks)}</p>` : ''}
        ${flagged.length ? `<p><b>${flagged.length} flagged to check:</b> ${jump(flagged)}</p>` : ''}
        <p>Tap a number to go to it, or press <b>${endWord}</b> again to end now.</p></div>` : ''}`;
  }
  page(h + '</div></div>');
  view().classList.toggle('wide', !!q.p);
  S.qIdx = S.idx; S.qShown = Date.now();
  persist();
  if (part) tick();
  const nx = $('#next'); if (nx) nx.focus({ preventScroll: true });
}

// ---- Report a problem: the question is hidden for this child and listed for a grown-up to check and send on
const REPORT_REASONS = [['wrong', 'I think the marked answer is wrong'], ['confusing', 'The question is confusing'], ['typo', 'There is a typo or the picture is wrong'], ['level', 'It is much too hard for its level'], ['other', 'Something else']];
const REPO_ISSUES = 'https://github.com/mukeshkbj/11-plus-explorer/issues/new';
const reportBtn = id => `<button class="btn ghost small-btn" data-act="report" data-id="${esc(id)}">🚩 Report a problem</button>`;
function reportPop(id) {
  const q = QI[id]; if (!q) return;
  closePop();
  const d = document.createElement('div');
  d.className = 'modal'; d.id = 'pop'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Report a problem');
  d.innerHTML = `<div class="card pop"><h2 style="margin-top:0">🚩 Report a problem</h2><p class="small muted">Thank you! A grown-up will check it. This question will not come up again for you.</p>
    <form data-submit="report" data-id="${esc(id)}">${REPORT_REASONS.map((x, i) => `<label class="check"><input type="radio" name="why" value="${x[0]}" ${i === 0 ? 'checked' : ''}> ${esc(x[1])}</label>`).join('')}
    <label for="whynote" style="margin-top:.8rem">Anything else? (optional)</label><input id="whynote" class="inp" type="text" maxlength="200" autocomplete="off" style="width:100%">
    <div class="row" style="margin-top:1rem"><button class="btn" type="submit">Send report</button><button class="btn ghost" type="button" data-act="closepop">Cancel</button></div></form></div>`;
  document.body.appendChild(d);
  d.addEventListener('click', ev => { if (ev.target === d) closePop(); });
}
function issueURL(rp) {
  const q = QI[rp.id];
  const body = `**Question id:** ${rp.id}\n**Subject / topic:** ${rp.subject} / ${rp.topic} (level ${rp.d})\n**Reason:** ${(REPORT_REASONS.find(x => x[0] === rp.why) || [])[1] || rp.why}\n${rp.note ? `**Note:** ${rp.note}\n` : ''}\n**Question:** ${rp.q}\n**Options:** ${(q ? q.opts : rp.opts || []).join(' | ')}\n**Marked answer:** ${rp.ans}\n`;
  return `${REPO_ISSUES}?title=${encodeURIComponent('Question report: ' + rp.subject + ' / ' + rp.topic)}&body=${encodeURIComponent(body)}`;
}
function reviewList(items) {
  return items.map((x, n) => {
    const q = QI[x.id]; if (!q) return '';
    const ok = x.c === q.a, t = topicOf(q.subject, q.topic);
    return `<details class="rev" ${ok ? '' : 'open'}><summary><span class="mark ${ok ? 'y' : 'n'}">${ok ? '✓' : '→'}</span><span>${n + 1}. ${rich(q.q)}</span></summary>
      ${q.svg ? `<div class="fig" style="margin-top:.6rem">${q.svg}</div>` : ''}
      ${q.p && passages(q.subject)[q.p] ? `<p class="small muted">From: ${esc(passages(q.subject)[q.p].title)}</p>` : ''}
      <p>${x.c === null || x.c === undefined ? 'Left blank.' : `Your answer: <b>${showOpt(q, x.c)}</b>.`} ${ok ? '' : `The answer is <b>${showOpt(q, q.a)}</b>.`}</p>
      <ol>${q.steps.map(s => `<li>${rich(s)}</li>`).join('')}</ol>
      ${ok ? '' : `<p class="small"><span class="muted">${esc(subj(q.subject).name)} · ${esc(t.name)}${x.t ? ' · ' + fmtSecs(x.t) + ' on this question' : ''}</span> · <a href="#lesson/${q.subject}/${q.topic}">Read the lesson</a></p>`}
      <p>${st.hidden && st.hidden[q.id] ? '<span class="small muted">🚩 Reported. Thank you!</span>' : reportBtn(q.id)}</p></details>`;
  }).join('');
}
// Score per topic for one attempt, weakest first.
function topicBreakdown(e) {
  const m = {};
  e.items.forEach(x => {
    const q = QI[x.id]; if (!q) return;
    const k = tkey(q.subject, q.topic), r = m[k] || (m[k] = { sid: q.subject, tid: q.topic, n: 0, ok: 0, t: 0 });
    r.n++; r.t += x.t || 0; if (x.c === q.a) r.ok++;
  });
  return Object.values(m).sort((a, b) => a.ok / a.n - b.ok / b.n || b.n - a.n);
}
const isTimedEntry = e => e.mode === 'test' || e.mode === 'mock';
// ---- Kent-style estimated scores for mock papers.
// THE ONE MAPPING from percentage right to a standardised-style score: a straight line from 0% = 69 to 100% = 141, kept inside 69 to 141.
// This is only an approximation. Real Kent Test scores are age-standardised against everyone who sat the test that year.
const KENT = { lo: 69, hi: 141, pass: 106, total: 332 };
const kentScore = pct => Math.max(KENT.lo, Math.min(KENT.hi, Math.round(KENT.lo + (KENT.hi - KENT.lo) * pct)));
function kentPanel(e) {
  if (e.mode !== 'mock' || !e.total) return '';
  const area = sid => sid === 'english' ? 'English' : sid === 'maths' ? 'Maths' : 'Reasoning', m = {};
  e.items.forEach(x => { const q = QI[x.id]; if (!q) return; const r = m[area(q.subject)] || (m[area(q.subject)] = { n: 0, ok: 0 }); r.n++; if (x.c === q.a) r.ok++; });
  const rows = ['English', 'Maths', 'Reasoning'].filter(k => m[k]).map(k => ({ k, n: m[k].n, ok: m[k].ok, s: kentScore(m[k].ok / m[k].n) }));
  if (!rows.length) return '';
  const all = rows.length === 3, total = rows.reduce((a, r) => a + r.s, 0), low = rows.filter(r => r.s < KENT.pass);
  const meets = all && total >= KENT.total && !low.length;
  const note = all ? (meets ? `<p><b>On this paper the estimate reaches the usual Kent standard</b> (a total of ${KENT.total} or more, with no score below ${KENT.pass}). Brilliant work!</p>`
    : `<p>The usual Kent standard is a total of ${KENT.total} or more, with no single score below ${KENT.pass}. ${total >= KENT.total ? 'The total is there' : 'This estimate is not there yet'}${low.length ? `, and ${low.map(r => r.k).join(' and ')} ${low.length > 1 ? 'need' : 'needs'} a lift` : ''}. Every mock and every fixed mistake helps.</p>`)
    : `<p class="small">Each area needs about ${KENT.pass} or more, and the three together ${KENT.total} or more. Try the complete mock exam for a total.</p>`;
  return `<div class="card tablewrap kent"><h3>📊 Estimated Kent-style scores</h3>
    <table><thead><tr><th>Area</th><th class="num">Right</th><th class="num">Estimated score</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.k}</td><td class="num">${r.ok}/${r.n}</td><td class="num"><b>${r.s}</b>${r.s < KENT.pass ? ' <span class="small muted">(below ' + KENT.pass + ')</span>' : ''}</td></tr>`).join('')}
    ${all ? `<tr><td><b>Total</b></td><td></td><td class="num"><b>${total}</b></td></tr>` : ''}</tbody></table>
    ${note}<p class="small muted">A rough guide only. Scores here run from ${KENT.lo} to ${KENT.hi} and are worked out from the percentage right. Real Kent scores are age-standardised, so they also depend on age and on how everyone else did.</p></div>`;
}
function vResult(id, done) {
  const e = st.history.find(h => h.id === id);
  if (!e) return vHistory();
  const pct = Math.round(100 * e.score / e.total);
  const t = e.topic && ready(e.subject) && topicOf(e.subject, e.topic);
  const msg = pct >= 90 ? 'Brilliant work!' : pct >= 70 ? 'Great effort. You are really getting this.' : pct >= 50 ? 'Good going. Every question makes you stronger.' : 'Well done for sticking with it. The tricky ones are saved in Revision so you can beat them next time.';
  const mins = Math.round((st.time[today()] || 0) / 60);
  const wrong = e.items.filter(x => QI[x.id] && x.c !== QI[x.id].a).length;
  const prev = e.label && st.history.find(h => h.id !== e.id && h.ts < e.ts && h.label === e.label && h.mode === e.mode);
  const prevPct = prev && Math.round(100 * prev.score / prev.total);
  const br = topicBreakdown(e);
  const perQ = e.total ? Math.round(e.secs / e.total) : 0, target = e.mins ? Math.round(e.mins * 60 / e.total) : 0;
  const actions = [];
  if (e.cfg) actions.push(`<button class="btn" data-act="again" data-id="${e.id}">${['challenge', 'aiex', 'aiset'].includes(e.cfg.k) ? '🔄 New set of questions' : e.cfg.k === 'aimock' ? '✨ Write another paper' : '🔄 Generate a new test'}</button>`);
  if (wrong) actions.push(`<button class="btn ${e.cfg ? 'alt' : ''}" data-act="fix" data-id="${e.id}">🔧 Fix my mistakes (${wrong})</button>`);
  if (done && t) actions.push(`<button class="btn alt" data-act="${e.mode === 'quiz' ? 'quiz' : 'exercise'}" data-sid="${e.subject}" data-tid="${e.topic}">${e.mode === 'quiz' ? 'Try the quiz again' : 'Keep practising'}</button>`);
  if (done && t && e.mode === 'exercise') actions.push(`<button class="btn alt" data-act="quiz" data-sid="${e.subject}" data-tid="${e.topic}">Take the quiz</button>`);
  if (done) actions.push('<a class="btn alt" href="#home">Back to Home</a>');
  const multi = new Set(br.map(r => r.sid)).size > 1;
  const weakHere = br.filter(r => r.ok / r.n < 0.7).slice(0, 3);
  page(`${done ? '' : '<p><a href="#history">← History</a></p>'}
    ${done ? `<div class="hero">${buddy(`<h1 style="margin:0;font-size:1.35rem">${esc(msg)}</h1>`, pct >= 70 ? 'happy' : '')}</div>` : `<h1>${esc(e.label || MODE[e.mode]) + (t ? ': ' + esc(t.name) : '')}</h1>`}
    <div class="card score"><div class="ring" style="--p:${pct}"><span${e.total > 99 ? ' style="font-size:1.15rem"' : ''}>${e.score}/${e.total}</span></div>
      <div><p><b>${esc(e.label || MODE[e.mode])}</b>${e.label ? '' : ' · ' + esc(sname(e))}${t ? ' · ' + esc(t.name) : ''} · <b>${pct}%</b></p>
      <p class="muted">${fmtWhen(e.ts)} · Time taken: ${fmtSecs(e.secs)}${e.stars ? ' · ⭐ ' + e.stars + ' earned' : ''}</p>
      ${prev ? `<p>${pct > prevPct ? `<b class="up">▲ Up from ${prevPct}% last time.</b> Your hard work is paying off!` : pct === prevPct ? `Same as last time (${prevPct}%).` : `Last time you scored ${prevPct}%. Fix the mistakes below and you will bounce back.`}</p>` : ''}
      ${target && e.secs >= 30 ? `<p class="small">About ${perQ} s per question. ${perQ <= target ? 'Good pace for the real exam.' : `In the exam aim for about ${target} s, so keep practising timed tests.`}</p>` : ''}
      ${done && awards.length ? `<div class="badges">${awards.map(a => `<a class="badge" href="#trophies">${badgeInfo(a).icon} New: ${esc(badgeName(a))}</a>`).join('')}</div>` : ''}
      ${done && mins >= 20 ? `<p><b>${mins} minutes today.</b> Super session. Time for a break!</p>` : ''}</div></div>
    ${actions.length ? `<div class="row">${actions.join('')}</div>` : ''}
    ${e.cfg ? '<p class="small muted">A new test has different questions, picked at random, avoiding ones from your recent tests.</p>' : ''}
    ${e.parts ? `<div class="card tablewrap"><h3>Section scores</h3><table><tbody>${e.parts.map(p => { const its = e.items.slice(p.from, p.to), sc = its.filter(x => QI[x.id] && x.c === QI[x.id].a).length; return `<tr><td>${esc(p.name)}</td><td class="num">${sc}/${its.length}</td><td class="num">${Math.round(100 * sc / its.length)}%</td></tr>`; }).join('')}</tbody></table></div>` : ''}
    ${kentPanel(e)}
    ${br.length > 1 ? `<div class="card tablewrap"><h3>How you did in each topic</h3>
      ${weakHere.length ? `<p class="small">Work on next: <b>${weakHere.map(r => esc(topicOf(r.sid, r.tid).name)).join(', ')}</b>. Read the lesson, then do one exercise.</p>` : '<p class="small"><b>Every topic 70% or more. Excellent!</b></p>'}
      <table><thead><tr><th>Topic</th><th class="num">Score</th><th></th></tr></thead><tbody>${br.map(r => { const tp = topicOf(r.sid, r.tid), p = r.ok / r.n; return `<tr><td>${multi ? subj(r.sid).icon + ' ' : ''}${esc(tp.name)}${bar(p, p >= 0.7 ? 'g' : '')}</td><td class="num">${r.ok}/${r.n}</td><td class="num">${p < 0.7 ? `<a href="#lesson/${r.sid}/${r.tid}">Lesson</a> · <a href="#topic/${r.sid}/${r.tid}">Practise</a>` : '✓'}</td></tr>`; }).join('')}</tbody></table></div>` : ''}
    <h2>Look back at each question</h2>
    ${[...new Set(e.items.map(x => QI[x.id] && QI[x.id].p).filter(Boolean))].map(pid => passageHTML(e.items.map(x => QI[x.id]).find(q => q && q.p === pid), false).replace(/class="gap cur"/g, 'class="gap"')).join('')}
    ${reviewList(e.items)}`);
  if (done) {
    if (awards.length) { const list = awards.slice(); awards = []; setTimeout(() => celebrate(list), 500); }
    else if (pct >= 70) { confetti(pct >= 90 ? 120 : 60); sfx('win'); }
  }
}

function vHistory() {
  page(`<h1>History</h1>` + (st.history.length ? `<div class="card tablewrap"><table><thead><tr><th>When</th><th>Activity</th><th>Topic</th><th class="num">Score</th><th class="num">Time</th><th></th></tr></thead><tbody>` +
    st.history.map(e => { const t = e.topic && ready(e.subject) && topicOf(e.subject, e.topic); return `<tr><td>${fmtWhen(e.ts)}</td><td>${esc(MODE[e.mode])}</td><td>${esc(e.label || sname(e))}${t ? ': ' + esc(t.name) : ''}</td><td class="num">${e.score}/${e.total}</td><td class="num">${fmtSecs(e.secs)}</td><td><a href="#history/${e.id}">Review</a></td></tr>`; }).join('') +
    `</tbody></table></div>` : `<div class="card"><p>Nothing here yet. Every exercise, quiz and test you finish is saved here so you can look back at it.</p><a class="btn" href="#learn">Start learning</a></div>`) + writingList());
}

let promptIdx = Math.floor(Math.random() * 12);
let deck = 'all';
let F = null;   // flashcard deck state
function vRevise() {
  const due = dueList(), waiting = Object.keys(st.review).filter(id => QI[id]).length - due.length;
  const weak = [];
  SUBJECTS.filter(s => ready(s.id)).forEach(s => B(s.id).topics.forEach(t => { const p = peek(s.id, t.id); if (p && p.seen >= 5 && accuracy(s.id, t.id) < 0.7) weak.push({ s, t, a: accuracy(s.id, t.id) }); }));
  weak.sort((a, b) => a.a - b.a);
  const decks = SUBJECTS.filter(s => ready(s.id) && (B(s.id).flashcards || []).length);
  const cards = [].concat(...decks.filter(s => deck === 'all' || s.id === deck).map(s => B(s.id).flashcards));
  if (!F || F.n !== cards.length) F = { n: cards.length, order: shuffle(cards.map((_, i) => i)), i: 0, flip: false, seen: 0 };
  const c = cards[F.order[F.i]];
  page(`<h1>Revise</h1>
    <div class="card"><div class="row spread"><div><h3>Try-again questions</h3>
      <p class="muted small">${due.length ? `${due.length} question${due.length > 1 ? 's are' : ' is'} ready today.` : 'Nothing is due today.'} ${waiting > 0 ? `${waiting} more will come back over the next few days.` : ''}<br>Questions return after 1 day, then 3 days, then 7 days, until you have them every time.</p></div>
      <button class="btn" data-act="revision" ${due.length ? '' : 'disabled'}>Start revision</button></div></div>
    ${weak.length ? `<div class="card"><h3>Topics to strengthen</h3>${weak.slice(0, 4).map(w => `<div class="row spread" style="padding:.4rem 0"><span>${esc(w.t.name)} <span class="muted small">(${Math.round(w.a * 100)}% lately)</span></span><button class="btn alt" data-act="exercise" data-sid="${w.s.id}" data-tid="${w.t.id}">Practise</button></div>`).join('')}</div>` : ''}
    ${c ? `<div class="card flash"><div class="row spread"><h3>Flashcards</h3><span class="muted small">Card ${F.i + 1} of ${cards.length}</span></div>
      ${decks.length > 1 ? `<div class="row" style="margin-bottom:.7rem">${[{ id: 'all', name: 'All' }].concat(decks).map(s => `<button class="btn ghost ${deck === s.id ? 'on' : ''}" data-act="deck" data-deck="${s.id}">${esc(s.name)}</button>`).join('')}</div>` : ''}
      <button class="flashcard ${F.flip ? 'back' : ''}" data-act="flip"><span>${rich(F.flip ? c.back : c.front)}<small>${F.flip ? 'Tap for the next card' : 'Say the answer, then tap to check'}</small></span></button></div>` : ''}`);
}

function trendSVG(entries) {
  if (entries.length < 2) return '<p class="muted">Finish two or more activities to see your trend.</p>';
  const W = 640, H = 200, L = 40, R = 12, T = 12, Bm = 26, n = entries.length;
  const x = i => L + (W - L - R) * i / (n - 1), y = p => T + (H - T - Bm) * (1 - p);
  const pts = entries.map((e, i) => [x(i), y(e.score / e.total)]);
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Score trend">
    ${[0, 0.5, 1].map(p => `<line x1="${L}" x2="${W - R}" y1="${y(p)}" y2="${y(p)}" stroke="#dfe5ee"/><text x="${L - 6}" y="${y(p) + 4}" text-anchor="end" font-size="12" fill="#5b6b7c">${p * 100}%</text>`).join('')}
    <polyline fill="none" stroke="#3b5bdb" stroke-width="3" stroke-linejoin="round" points="${pts.map(p => p.join(',')).join(' ')}"/>
    ${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#3b5bdb"/>`).join('')}
    <text x="${L}" y="${H - 6}" font-size="12" fill="#5b6b7c">Older</text><text x="${W - R}" y="${H - 6}" text-anchor="end" font-size="12" fill="#5b6b7c">Latest</text></svg>`;
}

function vProgress() {
  const all = [];
  SUBJECTS.filter(s => ready(s.id)).forEach(s => B(s.id).topics.forEach(t => { const p = peek(s.id, t.id); if (p && p.seen >= 5) all.push({ name: t.name, a: accuracy(s.id, t.id) }); }));
  all.sort((a, b) => b.a - a.a);
  const strong = all.slice(0, 3), need = all.slice(3).reverse().slice(0, 3);
  const list = a => a.length ? '<ul>' + a.map(x => `<li>${esc(x.name)} <span class="muted small">(${Math.round(x.a * 100)}%)</span></li>`).join('') + '</ul>' : '<p class="muted small">Answer at least five questions in a few topics and they will appear here.</p>';
  const ids = Object.keys(st.badges);
  page(`<h1>Progress</h1>
    ${countdownHTML() ? `<p>${countdownHTML()}</p>` : ''}
    ${readinessCard()}
    <div class="grid"><div class="card"><h3>💪 Strongest</h3>${list(strong)}</div><div class="card"><h3>🌱 Needs a bit more work</h3>${list(need)}</div></div>
    <div class="card"><h3>Score trend</h3>${trendSVG(st.history.slice(0, 20).reverse())}</div>
    <h2>Topics by subject</h2><p class="muted small">Tap a subject to open or close it.</p>
    ${SUBJECTS.filter(s => ready(s.id)).map(s => fold('prog-' + s.id, `<span class="ft" style="--c:${s.c}">${s.icon} ${esc(s.name)}</span><span class="pill">${Math.round(subjectMastery(s.id) * 100)}% mastered</span>`,
      `${bar(subjectMastery(s.id), 'g')}<div style="margin-top:1rem">${B(s.id).topics.map(t => { const p = peek(s.id, t.id); return `<div style="margin:.55rem 0"><div class="row spread small"><a href="#topic/${s.id}/${t.id}">${esc(t.name)}</a> ${starRow(starsOf(s.id, t.id))}<span class="muted">${p ? `${p.correct}/${p.seen} · ${LEVEL[p.level]}` : 'Not started'}</span></div>${bar(mastery(s.id, t.id))}</div>`; }).join('')}</div>`, false, 'card')).join('')}
    <div class="card"><div class="row spread"><h3>Badges</h3><a class="btn alt" href="#trophies">🏆 Trophy room</a></div><div class="badges">${ids.length ? ids.map(b => `<span class="badge">${badgeInfo(b).icon} ${esc(badgeName(b))}</span>`).join('') : '<span class="badge off">Score 8 out of 10 in a topic quiz to earn your first badge</span>'}</div></div>`);
}

// ---------------------------------------------------------------- exam readiness, countdown, parent view, tips
// Readiness mixes how much of the subject is mastered with recent timed-test accuracy (the last 40 test questions).
function readiness(sid) {
  const items = [];
  st.history.filter(isTimedEntry).forEach(h => h.items.forEach(x => { const q = QI[x.id]; if (q && q.subject === sid && items.length < 40) items.push(x.c === q.a ? 1 : 0); }));
  const m = subjectMastery(sid);
  if (items.length < 10) return { v: m, m, test: null };
  const ta = items.reduce((a, b) => a + b, 0) / items.length;
  return { v: 0.4 * m + 0.6 * ta, m, test: ta };
}
const readyLabel = v => v >= 0.85 ? 'Exam ready' : v >= 0.7 ? 'Nearly there' : v >= 0.45 ? 'Getting there' : 'Building up';
function daysToExam() {
  const d = st.settings.examDate;
  if (!d) return null;
  return Math.round((new Date(d + 'T00:00:00') - new Date(today() + 'T00:00:00')) / 864e5);
}
function countdownHTML() {
  const n = daysToExam();
  if (n === null || n < 0) return '';
  return `<span class="pill gold">🗓 ${n === 0 ? 'Exam day today. You have got this!' : n + ' day' + (n > 1 ? 's' : '') + ' to the exam'}</span>`;
}
function readinessCard() {
  return `<div class="card"><h3>📈 Exam readiness</h3><p class="muted small">Mixes how much of each subject is mastered with recent scores in timed tests.</p>
    ${SUBJECTS.filter(s => ready(s.id)).map(s => { const r = readiness(s.id); return `<div style="margin:.6rem 0"><div class="row spread small"><span>${s.icon} <b>${esc(s.name)}</b></span><span>${Math.round(r.v * 100)}% · ${readyLabel(r.v)}</span></div>${bar(r.v, r.v >= 0.7 ? 'g' : '')}</div>`; }).join('')}</div>`;
}
function lessonBody(t) {
  const L = t.lesson;
  return `<p>${rich(L.text).replace(/<br><br>/g, '</p><p>')}</p>
    ${L.method ? `<div class="box method"><h3>🧭 Step by step</h3><ol>${L.method.map(x => `<li>${rich(x)}</li>`).join('')}</ol></div>` : ''}
    ${L.checklist ? `<div class="checks"><h3>✅ Things to check</h3><div class="chipset">${L.checklist.map(x => `<span class="cchip">${esc(x)}</span>`).join('')}</div></div>` : ''}
    <div class="box eg"><h3>Worked example</h3><p>${rich(L.example)}</p></div>
    <div class="box watch"><h3>Watch out!</h3><p>${rich(L.watch)}</p>${L.traps ? `<ul>${L.traps.map(x => `<li>${rich(x)}</li>`).join('')}</ul>` : ''}</div>
    ${L.extra ? `<div class="box eg"><p>💡 ${rich(L.extra)}</p></div>` : ''}`;
}
// ---- "Try one together": a practice question inside the lesson, with the full method shown after answering.
let TRY = null;
function tryNew(sid, tid, level) {
  const list = pool(sid, tid, level).length ? pool(sid, tid, level) : pool(sid, tid);
  const q = randomFresh(list, 1)[0];
  TRY = q ? { sid, tid, q: prep(q), chosen: null, level: level || 1 } : null;
}
function tryHTML() {
  if (!TRY) return '';
  const q = TRY.q, it = { chosen: TRY.chosen };
  const done = TRY.chosen !== null, ok = TRY.chosen === q.a;
  return `<div class="card tryone" id="tryone"><div class="row spread"><h2 style="margin:0">🤝 Try one together</h2><span class="pill">${LEVEL[q.d]}</span></div>
    <p class="small muted">This one is just for practice. It does not count towards your scores.</p>
    ${q.p ? passageHTML(q, false) : ''}
    <div class="qtext">${rich(q.q)}</div>${q.svg ? `<div class="fig">${q.svg}</div>` : ''}
    <div class="opts ${q.of ? 'pics' : ''}">${q.opts.map((o, i) => `<button class="opt ${q.of ? 'pic' : ''} ${done ? (i === q.a ? 'right' : i === TRY.chosen ? 'picked' : '') : ''}" data-act="trypick" data-i="${i}" ${done ? 'disabled' : ''}><span class="letter">${'ABCDE'[i]}</span>${q.of ? `<span class="ofig">${q.of[i]}</span>` : `<span>${rich(o)}</span>`}</button>`).join('')}</div>
    ${done ? `<div class="fb ${ok ? 'ok' : 'try'}" id="tryfb"><div class="fbhead ${ok ? 'happy' : ''}">${OWL}<h3>${ok ? 'Yes! You worked it out.' : 'Good try. Let\'s look at it together.'}</h3></div>
      ${ok ? '' : `<p>The answer is <b>${showOpt(q, q.a)}</b>.</p>`}
      <ol class="steps">${q.steps.map(x => `<li>${rich(x)}</li>`).join('')}</ol>
      <div class="row"><button class="btn" data-act="trynext" data-l="${Math.min(3, TRY.level + (ok ? 1 : 0))}">${ok ? 'Try a harder one →' : 'Try another →'}</button>
      ${canSpeak() ? '<button class="btn ghost" data-act="speak" data-sel="#tryfb .steps">🔊 Read the method</button>' : ''}</div></div>`
    : `<p><button class="btn ghost" data-act="tryhint">💡 Hint</button></p>${TRY.hint ? `<div class="box hint"><b>Hint:</b> ${rich(q.hint)}</div>` : ''}`}</div>`;
}
function renderTry() { const el = $('#tryone'); if (el) el.outerHTML = tryHTML(); }
function closePop() { const p = $('#pop'); if (p) p.remove(); if (canSpeak()) speechSynthesis.cancel(); }
function lessonPop(sid, tid) {
  const t = ready(sid) && topicOf(sid, tid);
  if (!t) return;
  closePop();
  const d = document.createElement('div');
  d.className = 'modal'; d.id = 'pop'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', t.name + ' lesson');
  d.innerHTML = `<div class="card lesson pop"><div class="row spread"><h2 style="margin:0">📖 ${esc(t.name)}</h2><div class="row">
    ${canSpeak() ? '<button class="btn ghost" data-act="speak" data-sel="#pop .lesson-body">🔊 Read to me</button>' : ''}<button class="btn ghost" data-act="closepop">Back to the question ✕</button></div></div>
    <div class="lesson-body">${lessonBody(t)}</div></div>`;
  document.body.appendChild(d);
  d.addEventListener('click', ev => { if (ev.target === d) closePop(); });
  d.querySelector('[data-act=closepop]').focus();
}

// Questions the child reported, for a grown-up to check and send to the app maker.
function reportsCard() {
  const list = st.reports || [];
  return `<div class="card"><h3>🚩 Reported questions ${list.length ? `<span class="pill">${list.length}</span>` : ''}</h3>
    ${list.length ? `<p class="small muted">These no longer come up for ${esc(me().name || 'your child')}. If a question really is wrong, send it to the app maker so it can be fixed for everyone.</p>
      ${list.slice(0, 20).map(rp => `<div class="report"><p><b>${esc(rp.q).replace(/\n/g, '<br>')}</b></p><p class="small">Marked answer: <b>${esc(rp.ans)}</b> · ${esc((REPORT_REASONS.find(x => x[0] === rp.why) || [])[1] || rp.why)}${rp.note ? ` · "${esc(rp.note)}"` : ''} · <span class="muted">${esc(subj(rp.subject) ? subj(rp.subject).name : rp.subject)}, ${rp.day.split('-').reverse().join('/')}</span></p>
        <div class="row noprint"><a class="btn alt" href="${issueURL(rp)}" target="_blank" rel="noopener">Send to the app maker (GitHub)</a><button class="btn ghost" data-act="unreport" data-id="${esc(rp.id)}">It's fine, show it again</button></div></div>`).join('')}`
      : '<p class="small muted">Nothing reported. Children can press "🚩 Report a problem" on any question they think is wrong.</p>'}</div>`;
}
// ---------------------------------------------------------------- cloud sync between devices (optional, Firebase)
// A parent pastes their own Firebase project's web settings and signs in with an email and password.
// Each child's progress is stored at families/{user id}/children/{child id}. Nothing goes anywhere else.
// Changes from two devices are merged, so progress made on either device is never lost.
const SYNCKEY = 'elevenplus.sync';
const FB_VER = '10.12.2', FB_URL = m => `https://www.gstatic.com/firebasejs/${FB_VER}/firebase-${m}.js`;
const AUTHCFG = window.ELEVENPLUS_AUTH || {};
const BUILTIN_FB = AUTHCFG.firebase && AUTHCFG.firebase.apiKey ? AUTHCFG.firebase : null;   // set by the site owner in config.js
function syncConf() { if (BUILTIN_FB) return { config: BUILTIN_FB, builtin: true }; try { return JSON.parse(localStorage.getItem(SYNCKEY)) || null; } catch (e) { return null; } }
function syncStore(c) { try { if (c) localStorage.setItem(SYNCKEY, JSON.stringify(c)); else localStorage.removeItem(SYNCKEY); } catch (e) { /* storage blocked */ } }
// Accepts the snippet Firebase shows (const firebaseConfig = { apiKey: "...", ... }) or plain JSON.
function parseFbConfig(text) {
  const out = {};
  String(text || '').replace(/["']?(apiKey|authDomain|projectId|storageBucket|messagingSenderId|appId)["']?\s*:\s*["']([^"']+)["']/g, (m, k, v) => { out[k] = v; });
  return out.apiKey && out.projectId && out.appId ? out : null;
}
async function syncInit() {
  const c = syncConf(); if (!c || !c.config) return null;
  if (sync.fb) return sync.fb;
  try {
    const [app, auth, fs] = await Promise.all([import(FB_URL('app')), import(FB_URL('auth')), import(FB_URL('firestore'))]);
    const a = app.initializeApp(c.config, 'elevenplus');
    sync.fb = { app: a, auth: auth.getAuth(a), db: fs.getFirestore(a), A: auth, F: fs };
    auth.getRedirectResult(sync.fb.auth).catch(e => { sync.status = authMsg(e); if (location.hash === '#login') vLogin(); });
    auth.onAuthStateChanged(sync.fb.auth, u => {
      const first = !sync.ready; sync.ready = true; sync.user = u || null;
      if (u) {
        if (location.hash === '#login') { vLogin(); syncPullAll().then(afterLogin); }
        else syncPullAll().then(() => { if (location.hash === '#parent' && parentOK) vParent(); if (location.hash === '#settings') vSettings(); });
      } else if (location.hash === '#login') vLogin();
      else if (needLogin()) location.replace('#login');
      else if (location.hash === '#parent' && parentOK) vParent();
      else if (!first && location.hash === '#settings') vSettings();
    });
    return sync.fb;
  } catch (e) { sync.status = 'Could not load the sign-in service. Check the internet connection.'; sync.ready = true; if (location.hash === '#login') vLogin(); return null; }
}
const childRef = id => sync.fb.F.doc(sync.fb.db, 'families', sync.user.uid, 'children', id);
const familyRef = () => sync.fb.F.doc(sync.fb.db, 'families', sync.user.uid);
// Merging two saved progress records for the same child: nothing either device did is lost.
function mergeState(a, b) {
  if (!a) return b; if (!b) return a;
  const m = Object.assign(fresh(), a, b);
  const newer = (a.savedAt || 0) >= (b.savedAt || 0) ? a : b;
  const byId = new Map(); (a.history || []).concat(b.history || []).forEach(h => { if (h && h.id && !byId.has(h.id)) byId.set(h.id, h); });
  m.history = [...byId.values()].sort((x, y) => y.ts - x.ts).slice(0, 400);
  m.stars = Math.max(a.stars || 0, b.stars || 0);
  const la = a.lastDay || '', lb = b.lastDay || ''; m.lastDay = la >= lb ? a.lastDay : b.lastDay; m.streak = la === lb ? Math.max(a.streak || 0, b.streak || 0) : (la > lb ? a.streak : b.streak);
  m.badges = Object.assign({}, b.badges, a.badges); Object.keys(b.badges || {}).forEach(k => { if (a.badges && a.badges[k] && b.badges[k] < a.badges[k]) m.badges[k] = b.badges[k]; });
  m.topic = Object.assign({}, a.topic); Object.entries(b.topic || {}).forEach(([k, v]) => { if (!m.topic[k] || (v.seen || 0) > (m.topic[k].seen || 0)) m.topic[k] = v; });
  m.q = Object.assign({}, a.q); Object.entries(b.q || {}).forEach(([k, v]) => { if (!m.q[k] || (v.s || 0) > (m.q[k].s || 0)) m.q[k] = v; });
  m.review = Object.assign({}, newer === a ? b.review : a.review, newer.review);
  m.time = Object.assign({}, a.time); Object.entries(b.time || {}).forEach(([k, v]) => { m.time[k] = Math.max(m.time[k] || 0, v); });
  m.lessons = Object.assign({}, a.lessons, b.lessons);
  m.hidden = Object.assign({}, a.hidden, b.hidden);
  const rp = new Map(); (a.reports || []).concat(b.reports || []).forEach(x => { if (x && !rp.has(x.id)) rp.set(x.id, x); }); m.reports = [...rp.values()].slice(0, 100);
  const wr = new Map(); (a.writing || []).concat(b.writing || []).forEach(x => { if (x && x.id && !wr.has(x.id)) wr.set(x.id, x); }); m.writing = [...wr.values()].sort((x, y) => y.ts - x.ts).slice(0, 60); m.wtask = newer.wtask;
  m.aiq = Object.assign({}, a.aiq, b.aiq); m.aip = Object.assign({}, a.aip, b.aip);
  m.settings = Object.assign({}, newer === a ? b.settings : a.settings, newer.settings);
  m.active = newer.active; m.last = newer.last; m.plan = newer.plan; m.rank = Math.max(a.rank || 0, b.rank || 0);
  m.savedAt = Math.max(a.savedAt || 0, b.savedAt || 0);
  return m;
}
// AI questions are left out of the cloud copy to keep it small; everything else is kept.
const cloudCopy = o => { const c = Object.assign({}, o); delete c.aiq; delete c.aip; return JSON.stringify(c); };
async function syncChild(id) {
  const F = sync.fb.F, ref = childRef(id);
  const snap = await F.getDoc(ref);
  const remote = snap.exists() ? JSON.parse(snap.data().state || 'null') : null;
  let local = null; try { local = JSON.parse(localStorage.getItem(keyFor(id))); } catch (e) { /* none */ }
  if (id === meta.current) local = st;
  const merged = mergeState(local, remote);
  if (!merged) return;
  if (id === meta.current) {
    const keepActive = st.active;   // an activity in progress on this device stays as it is
    st = Object.assign(fresh(), merged); if (S) st.active = keepActive;
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* storage blocked */ }
  } else { try { localStorage.setItem(keyFor(id), JSON.stringify(merged)); } catch (e) { /* storage blocked */ } }
  await F.setDoc(ref, { state: cloudCopy(merged), updatedAt: Date.now(), name: (meta.list.find(p => p.id === id) || {}).name || '' });
}
async function syncPullAll() {
  if (!sync.fb || !sync.user || sync.busy) return;
  sync.busy = true;
  try {
    const F = sync.fb.F, fam = await F.getDoc(familyRef());
    if (fam.exists()) {
      const rm = fam.data().meta || {};
      // First sync on this device: a local child whose name differs from the family's child with the same id
      // is a different child (for example a sister's tablet), so give them their own id instead of merging.
      const cf = syncConf() || {};
      if (!cf.linked) {
        (rm.list || []).forEach(rp => {
          const mine = meta.list.find(x => x.id === rp.id);
          if (mine && mine.name && rp.name && mine.name.trim().toLowerCase() !== rp.name.trim().toLowerCase()) {
            const nid = 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4);
            try { const data = localStorage.getItem(keyFor(mine.id)); if (data) localStorage.setItem(keyFor(nid), data); localStorage.removeItem(keyFor(mine.id)); } catch (e) { /* storage blocked */ }
            if (meta.current === mine.id) { meta.current = nid; KEY = keyFor(nid); }
            mine.id = nid;
          }
        });
        syncStore(Object.assign(cf, { linked: true }));
      }
      (rm.list || []).forEach(p => { const mine = meta.list.find(x => x.id === p.id); if (!mine) meta.list.push(p); else if (!mine.name && p.name) mine.name = p.name; });
      if (!meta.pin && rm.pin) meta.pin = rm.pin;
      saveMetaLocal();
    }
    await F.setDoc(familyRef(), { meta: { list: meta.list, pin: meta.pin || null }, updatedAt: Date.now() });
    for (const p of meta.list) await syncChild(p.id);
    sync.last = Date.now(); sync.status = '';
    if (location.hash !== '#session' && location.hash !== '#parent') route(); else chips();
  } catch (e) { sync.status = syncErr(e); }
  finally { sync.busy = false; }
}
function syncErr(e) {
  const c = (e && e.code) || '';
  if (c.includes('permission')) return 'Sync was refused. Check the Firestore security rules (see the setup steps).';
  if (c.includes('unavailable') || c.includes('network')) return 'Offline. Changes will sync when you are back online.';
  if (c.includes('not-found')) return 'The Firestore database was not found. Create it in the Firebase console.';
  return 'Sync problem: ' + ((e && e.message) || 'unknown error');
}
// After any change, sync the current child a few seconds later (several quick changes become one upload).
function syncSoon() {
  if (!sync.user) return;
  clearTimeout(sync.timer);
  sync.timer = setTimeout(async () => { if (sync.busy) return syncSoon(); sync.busy = true; try { await syncChild(meta.current); sync.last = Date.now(); sync.status = ''; } catch (e) { sync.status = syncErr(e); } finally { sync.busy = false; } }, 4000);
}
function syncCard() {
  const c = syncConf(), u = sync.user;
  const rules = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /families/{uid}/{document=**} {\n      allow read, write: if request.auth != null && request.auth.uid == uid;\n    }\n  }\n}`;
  if (!c || !c.config) return `<div class="card noprint" id="syncset"><h3>☁️ Sync between devices (optional)</h3>
    <p class="small">Keep each child's progress the same on every phone, tablet and computer. It uses your own free Firebase project, so the data stays in your Google account.</p>
    <details class="small"><summary><b>Set-up steps (about 10 minutes, once)</b></summary><ol>
      <li>Go to console.firebase.google.com and create a project (Google Analytics is not needed).</li>
      <li>Build → Authentication → Get started → turn on <b>Email/Password</b>.</li>
      <li>Build → Firestore Database → Create database (choose a location near you, start in production mode).</li>
      <li>In Firestore → Rules, replace everything with the rules below and press Publish.</li>
      <li>Project settings → Your apps → add a <b>Web app</b> (the &lt;/&gt; icon). Copy the <code>firebaseConfig</code> it shows and paste it below.</li></ol>
      <pre class="code">${esc(rules)}</pre></details>
    <form data-submit="syncsave"><label for="fbcfg" style="margin-top:.7rem">Firebase web config</label><textarea id="fbcfg" class="inp" rows="6" style="width:100%" placeholder="const firebaseConfig = { apiKey: &quot;...&quot;, authDomain: &quot;...&quot;, projectId: &quot;...&quot;, ... };"></textarea>
    <button class="btn" type="submit" style="margin-top:.6rem">Save</button></form></div>`;
  const forget = c.builtin ? '' : '<button class="btn ghost small-btn" data-act="syncforget">Remove sync settings</button>';
  if (!sync.fb) return `<div class="card noprint" id="syncset"><h3>☁️ Sync between devices</h3><p class="small">${esc(sync.status || 'Connecting…')}</p><div class="row"><button class="btn alt" data-act="syncretry">Try again</button>${forget}</div></div>`;
  if (!u) return `<div class="card noprint" id="syncset"><h3>☁️ Sync between devices</h3><p class="small">Sign in with Google, Facebook, email or another account, and progress is kept the same on every device.</p>
    ${sync.status ? `<div class="box watch small">${esc(sync.status)}</div>` : ''}
    <div class="row"><a class="btn" href="#login">Sign in</a>${forget}</div></div>`;
  return `<div class="card noprint" id="syncset"><h3>☁️ Sync between devices <span class="pill">On</span></h3>
    <p class="small">Signed in as <b>${esc(who(u))}</b>. ${sync.last ? `Last synced at ${new Date(sync.last).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.` : 'Syncing…'} Progress for all ${meta.list.length} ${meta.list.length === 1 ? 'child' : 'children'} is kept the same on every device you sign in on.</p>
    ${sync.status ? `<div class="box watch small">${esc(sync.status)}</div>` : ''}
    <div class="row"><button class="btn alt" data-act="syncnow">Sync now</button><button class="btn ghost" data-act="syncout">Sign out</button></div></div>`;
}
// ---------------------------------------------------------------- sign-in page (Google, Facebook, Microsoft, Apple, GitHub, email)
const GUESTKEY = 'elevenplus.guest';
const PROVIDERS = {
  google:    { name: 'Google',    icon: 'G', bg: '#ffffff', fg: '#1f1f1f', make: A => new A.GoogleAuthProvider() },
  facebook:  { name: 'Facebook',  icon: 'f', bg: '#1877f2', fg: '#ffffff', make: A => new A.FacebookAuthProvider() },
  microsoft: { name: 'Microsoft', icon: '⊞', bg: '#2f2f2f', fg: '#ffffff', make: A => new A.OAuthProvider('microsoft.com') },
  apple:     { name: 'Apple',     icon: '🍎', bg: '#000000', fg: '#ffffff', make: A => { const p = new A.OAuthProvider('apple.com'); p.addScope('email'); return p; } },
  github:    { name: 'GitHub',    icon: '⌥', bg: '#24292f', fg: '#ffffff', make: A => new A.GithubAuthProvider() },
  twitter:   { name: 'X',         icon: '𝕏', bg: '#000000', fg: '#ffffff', make: A => new A.TwitterAuthProvider() },
  yahoo:     { name: 'Yahoo',     icon: 'Y!', bg: '#6001d2', fg: '#ffffff', make: A => new A.OAuthProvider('yahoo.com') }
};
function guestChosen() { try { return localStorage.getItem(GUESTKEY) === '1'; } catch (e) { return true; } }
function setGuest(on) { try { if (on) localStorage.setItem(GUESTKEY, '1'); else localStorage.removeItem(GUESTKEY); } catch (e) { /* ok */ } }
// The sign-in page comes first when the site has sign-in set up and no one is signed in on this device.
function needLogin() { const c = syncConf(); return !!(c && c.config) && !sync.user && !(AUTHCFG.allowGuest !== false && guestChosen()); }
const who = u => (u && (u.email || u.displayName || (u.providerData && u.providerData[0] && (u.providerData[0].email || u.providerData[0].displayName)))) || 'your account';
function provList() { const l = (AUTHCFG.providers || ['google', 'facebook', 'microsoft', 'apple', 'email']).filter(k => k === 'email' || PROVIDERS[k]); return isNative() ? l.filter(k => k === 'email') : l; }
function afterLogin() {
  let to = '#home'; try { to = sessionStorage.getItem('elevenplus.after') || '#home'; sessionStorage.removeItem('elevenplus.after'); } catch (e) { /* ok */ }
  if (to === '#login') to = '#home';
  if (meta.list.length > 1 && to === '#home') { try { sessionStorage.removeItem('elevenplus.chosen'); } catch (e) { /* ok */ } to = '#who'; }
  location.replace(to);
}
function authMsg(e) {
  const c = (e && e.code) || '';
  if (c.includes('popup-closed') || c.includes('cancelled-popup')) return 'Sign-in was closed before it finished. Try again.';
  if (c.includes('account-exists-with-different-credential')) return 'This email already uses a different sign-in button. Use the one you chose the first time.';
  if (c.includes('wrong-password') || c.includes('invalid-credential') || c.includes('user-not-found')) return 'That email and password did not match. Try again, or press Create account the first time.';
  if (c.includes('email-already')) return 'That email already has an account. Press Sign in instead.';
  if (c.includes('weak-password')) return 'Please choose a password of at least 6 characters.';
  if (c.includes('invalid-email')) return 'That email address does not look right.';
  if (c.includes('operation-not-allowed')) return 'This sign-in option is not turned on yet. A parent needs to turn it on in Firebase (see docs/LOGIN.md).';
  if (c.includes('unauthorized-domain')) return 'This website address is not allowed to sign in yet. Add it in Firebase → Authentication → Settings → Authorised domains.';
  if (c.includes('network')) return 'No internet connection. Try again when you are online.';
  if (c.includes('too-many-requests')) return 'Too many tries. Please wait a few minutes.';
  return 'Sign-in problem: ' + ((e && e.message) || 'unknown error');
}
let loginNote = '', loginBusy = false, loginEmail = false;
function vLogin() {
  view().classList.remove('wide');
  document.body.classList.add('gate');
  const c = syncConf();
  if (!c || !c.config) { document.body.classList.remove('gate'); location.replace('#home'); return; }
  if (sync.user && sync.ready) {
    view().innerHTML = `<div class="login"><div class="lcard"><div class="lowl">${OWL}</div><h1>Welcome back!</h1><p>Signed in as <b>${esc(who(sync.user))}</b>.</p><p class="small muted"><span class="spin"></span> Getting your progress…</p></div></div>`;
    return;
  }
  const waiting = !sync.ready, list = provList(), note = loginNote || sync.status;
  const pbtn = k => { const p = PROVIDERS[k]; return `<button class="btn pbtn" data-act="login" data-p="${k}" style="background:${p.bg};color:${p.fg};border-color:${p.bg === '#ffffff' ? '#c9d2de' : p.bg}" ${loginBusy ? 'disabled' : ''}><span class="pi" aria-hidden="true">${p.icon}</span>Continue with ${p.name}</button>`; };
  const others = list.filter(k => k !== 'email'), hasEmail = list.includes('email');
  const emailForm = `<form data-submit="loginemail" class="lform"><label for="sem">Email</label><input id="sem" class="inp" type="email" autocomplete="username" required>
      <label for="spw">Password (at least 6 characters)</label><input id="spw" class="inp" type="password" autocomplete="current-password" minlength="6" required>
      <div class="row"><button class="btn" type="submit" ${loginBusy ? 'disabled' : ''}>Sign in</button><button class="btn alt" type="button" data-act="loginnew" ${loginBusy ? 'disabled' : ''}>Create account</button></div>
      <button class="linkbtn small" type="button" data-act="loginreset">Forgot password?</button></form>`;
  view().innerHTML = `<div class="login"><div class="lcard">
    <div class="lowl">${OWL}</div>
    <h1>Welcome to 11+ Explorer</h1>
    <p class="lsub">A grown-up signs in once. Stars, trophies and progress are then saved and kept the same on every device.</p>
    ${note ? `<div class="box watch small" role="alert">${esc(note)}</div>` : ''}
    ${waiting ? '<p class="small muted"><span class="spin"></span> Checking sign-in…</p>' : `
    <div class="plist">${others.map(pbtn).join('')}</div>
    ${hasEmail ? (others.length && !loginEmail ? `<button class="btn ghost pbtn" data-act="loginshowemail"><span class="pi" aria-hidden="true">✉️</span>Continue with email</button>` : (others.length ? '<div class="or"><span>or</span></div>' : '') + emailForm) : ''}
    ${isNative() && AUTHCFG.providers && AUTHCFG.providers.some(k => k !== 'email') ? '<p class="small muted">In the phone app, sign in with email. Google, Facebook and the others work on the website.</p>' : ''}`}
    ${AUTHCFG.allowGuest !== false ? `<div class="guest"><button class="linkbtn" data-act="loginguest">Use without an account →</button><p class="small muted">Progress stays on this device only. You can sign in later in Settings.</p></div>` : ''}
    <p class="small muted lfoot">Children under 13 should not sign in with their own account. <a href="privacy.html" target="_blank" rel="noopener">Privacy policy</a></p>
    <p class="small muted lfoot">© ${new Date().getFullYear()} Learn Earn &amp; Fun</p>
  </div></div>`;
}
async function loginWith(k) {
  if (!sync.fb) await syncInit(); if (!sync.fb) return vLogin();
  const A = sync.fb.A, prov = PROVIDERS[k].make(A);
  if (k === 'google') prov.setCustomParameters({ prompt: 'select_account' });
  loginNote = ''; sync.status = ''; loginBusy = true; vLogin();
  try { await A.signInWithPopup(sync.fb.auth, prov); }
  catch (e) {
    const c = (e && e.code) || '';
    if (c.includes('popup-blocked') || c.includes('operation-not-supported')) { try { await A.signInWithRedirect(sync.fb.auth, prov); return; } catch (e2) { loginNote = authMsg(e2); } }
    else loginNote = authMsg(e);
  } finally { loginBusy = false; }
  if (!sync.user) vLogin();
}
async function emailAuth(kind, back) {
  const em = (($('#sem') || {}).value || '').trim(), pw = ($('#spw') || {}).value || '';
  if (!sync.fb) await syncInit();
  if (!sync.fb) return back(sync.status);
  const A = sync.fb.A;
  try {
    if (kind === 'reset') { if (!em) return back('Type your email first, then press Forgot password.'); await A.sendPasswordResetEmail(sync.fb.auth, em); return back('Password reset email sent. Check your inbox.'); }
    if (!em || pw.length < 6) return back('Please type an email and a password of at least 6 characters.');
    loginBusy = true;
    if (kind === 'new') await A.createUserWithEmailAndPassword(sync.fb.auth, em, pw); else await A.signInWithEmailAndPassword(sync.fb.auth, em, pw);
    sync.status = '';
  } catch (e) { back(authMsg(e)); }
  finally { loginBusy = false; }
}
const loginBack = m => { loginNote = m || ''; loginEmail = true; vLogin(); const f = $('#sem'); if (f && m) f.focus(); };
function accountCard() {
  const c = syncConf(); if (!c || !c.config) return '';
  if (sync.user) return `<div class="card"><h3>👤 Account</h3><p class="small">Signed in as <b>${esc(who(sync.user))}</b>. Progress for every child is saved to this account and kept the same on all your devices.</p>
    <button class="btn ghost" data-act="signout">Sign out</button></div>`;
  return `<div class="card"><h3>👤 Account</h3><p class="small muted">Not signed in. Progress is saved on this device only.</p><a class="btn alt" href="#login">Sign in</a></div>`;
}

// Parent settings for AI-made questions.
function aiCard() {
  const c = aiConf() || { provider: 'anthropic', model: AI_MODELS[0][0] }, prov = c.provider || 'anthropic';
  const masked = c.key ? c.key.slice(0, 7) + '…' + c.key.slice(-4) : '';
  return `<div class="card noprint" id="aiset"><h3>✨ AI-made questions (optional)</h3>
    <p class="small">Add your own AI API key and the app can write brand-new exercises (for Maths, English and Verbal Reasoning) and full mock papers. The key is stored only on this device, is never included in backup files, and is sent only to the AI company you choose. Each request uses your account's credit, so check your provider's prices.</p>
    <p class="small muted">AI can occasionally get an answer wrong. The app checks that each question's working matches its marked answer and drops any that do not, and AI questions are labelled ✨ so you can spot them.</p>
    <form data-submit="aisave">
      <label for="aiprov">AI company</label><select id="aiprov" data-change="aiprov"><option value="anthropic" ${prov === 'anthropic' ? 'selected' : ''}>Anthropic (Claude)</option><option value="openai" ${prov === 'openai' ? 'selected' : ''}>OpenAI</option></select>
      <label for="aimodel" style="margin-top:.7rem">Model</label>
      ${c.models && c.models.length && c.provider === prov ? `<select id="aimodel">${c.models.map(m => `<option value="${esc(m.id)}" ${c.model === m.id ? 'selected' : ''}>${esc(m.name && m.name !== m.id ? `${m.name} (${m.id})` : m.id)}</option>`).join('')}</select><p class="small muted">These are the models your key can use.</p>`
        : prov === 'anthropic' ? `<select id="aimodel">${AI_MODELS.map(m => `<option value="${m[0]}" ${c.model === m[0] ? 'selected' : ''}>${esc(m[1])}</option>`).join('')}</select>` : `<input id="aimodel" class="inp" type="text" value="${esc(c.model || '')}" placeholder="Leave blank to pick one automatically" autocomplete="off">`}
      <label for="aikey" style="margin-top:.7rem">API key ${masked ? `<span class="muted small">(saved: ${esc(masked)})</span>` : ''}</label>
      <input id="aikey" class="inp" type="password" autocomplete="off" placeholder="${masked ? 'Leave blank to keep the saved key' : prov === 'anthropic' ? 'sk-ant-…' : 'sk-…'}" style="width:100%">
      <div class="row" style="margin-top:.8rem"><button class="btn" type="submit">Save</button>${c.key ? '<button class="btn alt" type="button" data-act="aitest">Test the key and find models</button><button class="btn ghost" type="button" data-act="airemove">Remove key</button>' : ''}</div>
    </form>
    <p class="small muted">Get a Claude key at console.anthropic.com, or an OpenAI key at platform.openai.com. Treat it like a password.</p></div>`;
}
const hashPin = p => { let h = 7; for (const c of String(p)) h = (h * 31 + c.charCodeAt(0)) % 1000000007; return 'p' + h; };
let parentOK = false;
function vParent(note) {
  const msg = note ? `<div class="box ${/not|must/i.test(note) ? 'watch' : 'eg'}">${esc(note)}</div>` : '';
  if (!meta.pin) return page(`<h1>🔒 Parent view</h1>${msg}<div class="card"><p>Choose a PIN (4 to 6 digits) so only grown-ups can open this page.</p>
    <form data-submit="setpin" class="row"><input id="pin1" class="inp" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" aria-label="New PIN" placeholder="New PIN"><button class="btn" type="submit">Save PIN</button></form></div>`);
  if (!parentOK) return page(`<h1>🔒 Parent view</h1>${msg}<div class="card"><p>Enter the parent PIN.</p>
    <form data-submit="unlock" class="row"><input id="pin2" class="inp" type="password" inputmode="numeric" autocomplete="current-password" maxlength="6" aria-label="PIN" placeholder="PIN"><button class="btn" type="submit">Open</button></form>
    <p class="small muted">Forgotten it? Clearing a child's progress in Settings also removes the PIN.</p></div>`);
  const days = [...Array(14)].map((_, i) => plusDays(i - 13)), week = days.slice(7);
  const wk = st.history.filter(h => week.includes(h.day));
  const wkMins = Math.round(week.reduce((a, d) => a + (st.time[d] || 0), 0) / 60);
  const wkQ = wk.reduce((a, h) => a + h.total, 0), wkOK = wk.reduce((a, h) => a + h.score, 0);
  const maxM = Math.max(20, ...days.map(d => (st.time[d] || 0) / 60));
  const weak = [];
  SUBJECTS.filter(s => ready(s.id)).forEach(s => B(s.id).topics.forEach(t => { const p = peek(s.id, t.id); if (p && p.seen >= 5 && accuracy(s.id, t.id) < 0.75) weak.push({ s, t, a: accuracy(s.id, t.id) }); }));
  weak.sort((a, b) => a.a - b.a);
  const timed = st.history.filter(isTimedEntry);
  const n = daysToExam();
  const phase = n === null ? 'Add the exam date in Settings to get a plan for the weeks ahead.'
    : n > 120 ? '<b>Building foundations.</b> Learn two or three new topics a week, with an exercise and a quiz for each. One 10-minute test at the weekend.'
    : n > 60 ? '<b>Mixing it up.</b> Keep learning the remaining topics, two timed tests a week, and a mock paper every fortnight. Use Fix my mistakes after every test.'
    : n >= 0 ? '<b>Exam practice.</b> One mock paper a week under exam conditions, weak-spot tests on other days, and Fix my mistakes after each. Keep sessions short and positive.' : 'The exam date has passed. Update it in Settings if needed.';
  const untouched = SUBJECTS.filter(s => ready(s.id)).map(s => ({ s, n: B(s.id).topics.filter(t => !peek(s.id, t.id)).length, all: B(s.id).topics.length }));
  page(`<div class="row spread"><h1>🔒 Parent view</h1><div class="row noprint">${canPrint() ? '<button class="btn alt" data-act="print">🖨 Print or save as PDF</button>' : ''}<button class="btn ghost" data-act="lock">Lock</button></div></div>
    <p class="muted">${me().avatar} <b>${esc(me().name || 'Your child')}</b> · summary for ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. ${countdownHTML()}</p>
    ${meta.list.length > 1 ? `<div class="row noprint">${meta.list.map(p => `<button class="btn ${p.id === meta.current ? '' : 'alt'}" data-act="parentchild" data-id="${p.id}">${p.avatar} ${esc(p.name || 'Explorer')}</button>`).join('')}</div>` : ''}
    ${msg}
    <div class="tiles four"><div class="tile"><b>${wkMins}</b><span>minutes this week</span></div><div class="tile"><b>${wk.length}</b><span>sessions this week</span></div>
      <div class="tile"><b>${wkQ ? Math.round(100 * wkOK / wkQ) + '%' : '–'}</b><span>right this week (${wkQ} questions)</span></div><div class="tile"><b>🔥 ${st.streak}</b><span>day streak</span></div></div>
    <div class="card"><h3>Plan for now</h3><p>${phase}</p></div>
    ${readinessCard()}
    <div class="card"><h3>Minutes practised, last 14 days</h3><div class="minbars">${days.map(d => { const m = Math.round((st.time[d] || 0) / 60); return `<div title="${d}: ${m} min"><i style="height:${Math.round(100 * m / maxM)}%"></i><span>${m || ''}</span><b>${DAYS[new Date(d + 'T12:00:00').getDay()][0]}</b></div>`; }).join('')}</div>
      <p class="small muted">Little and often works best: 15 to 20 minutes on most days.</p></div>
    <div class="card"><h3>Topics that need attention</h3>${weak.length ? `<table><tbody>${weak.slice(0, 8).map(w => `<tr><td>${w.s.icon} ${esc(w.t.name)}</td><td class="num">${Math.round(w.a * 100)}%</td><td class="small">${w.a < 0.5 ? 'Read the lesson together, then two exercises' : 'One exercise, then the topic quiz'}</td></tr>`).join('')}</tbody></table>` : '<p class="muted small">No weak topics yet (a topic shows here after five or more questions with under 75% right).</p>'}
      <p class="small">Not started yet: ${untouched.map(u => `${esc(u.s.name)} ${u.n} of ${u.all}`).join(' · ')}. Revision queue: ${Object.keys(st.review).filter(id => QI[id]).length} questions.</p></div>
    <div class="card"><h3>Timed test scores</h3>${trendSVG(timed.slice(0, 15).reverse())}
      ${timed.length ? `<div class="tablewrap"><table><thead><tr><th>When</th><th>Paper</th><th class="num">Score</th><th class="num">Time</th><th></th></tr></thead><tbody>${timed.slice(0, 10).map(e => `<tr><td>${fmtWhen(e.ts)}</td><td>${esc(e.label || MODE[e.mode])}</td><td class="num">${e.score}/${e.total} (${Math.round(100 * e.score / e.total)}%)</td><td class="num">${fmtSecs(e.secs)}</td><td class="noprint"><a href="#history/${e.id}">Review</a></td></tr>`).join('')}</tbody></table></div>` : ''}</div>
    <div class="card"><h3>Badges</h3><div class="badges">${Object.keys(st.badges).map(b => `<span class="badge">${badgeInfo(b).icon} ${esc(badgeName(b))}</span>`).join('') || '<span class="badge off">None yet</span>'}</div></div>
    ${reportsCard()}
    ${syncCard()}
    ${aiCard()}`);
}

const TIPS = [
  { h: '⏱ Exam technique (every subject)', li: [
    'Read every question twice. Picture what it is really asking before you look at the answers.',
    'Cross out answers you know are wrong. Choosing from two is much easier than choosing from five.',
    'Never leave a blank. There is no penalty for a wrong answer, so a sensible guess can still score.',
    'Keep moving. If a question takes more than about a minute and a half, pick your best guess, flag it and come back at the end.',
    'Keep an eye on the clock: at half time you should be about half way through.',
    'Use spare time to check flagged questions first, then any you rushed.'] },
  { h: '➗ Maths', li: [
    'Know your times tables up to 12 × 12 instantly. They make division, fractions and ratio much quicker.',
    'Estimate first. If you expect about 300 and get 3,000, look again.',
    'Write your working on scrap paper. Most slips happen in your head.',
    'Learn the common matches: 1/2 = 0.5 = 50%, 1/4 = 0.25 = 25%, 1/5 = 0.2 = 20%, 1/10 = 0.1 = 10%.',
    'Check the units. Is the answer in cm or m, minutes or hours, pence or pounds?',
    'For word problems, underline the numbers and the question word ("how many more", "altogether", "each").'] },
  { h: '📖 English', li: [
    'Read the passage once for the story or main idea, then go back to it for each question.',
    'The answers are in the text. Find the line that proves your answer before you choose.',
    'For word meanings, put each option into the sentence and see which one keeps the meaning.',
    'Read lots: stories, non-fiction and poems. It is the best way to grow your vocabulary.',
    'For spelling, say the word in syllables and look for small words hiding inside.'] },
  { h: '🔤 Verbal reasoning', li: [
    'Write the alphabet across the top of your scrap paper with numbers: A1, B2 … Z26.',
    'Remember EJOTY: E is 5, J is 10, O is 15, T is 20, Y is 25. It helps you count quickly.',
    'For letter series and codes, write the gaps between letters as + or − numbers.',
    'For word questions, say each new word quietly in your head and check it is a real word.',
    'Learn word families: synonyms, opposites and words with two meanings.'] },
  { h: '🔷 Non-verbal reasoning', li: [
    'Check one thing at a time: shape, size, shading, number of parts, position, rotation, reflection.',
    'Count sides, lines and dots. Many questions hide a counting rule.',
    'For odd one out, find the rule that four share, then check the fifth breaks it.',
    'For reflections, check that each part flips to the opposite side of the mirror line.',
    'Practise nets with real paper: cut out a cross shape and fold it into a cube.'] },
  { h: '🌙 The week before and the day itself', li: [
    'Do a full mock exam at the same time of day as the real test, at a quiet table.',
    'Go to bed on time, eat a good breakfast and take a drink of water.',
    'Take two sharp pencils, a rubber and a watch if you are allowed one.',
    'If you feel nervous, breathe in for four, hold for four, and breathe out for four.',
    'One hard question does not matter. Move on and keep going. You have practised for this.'] }
];
function vTips() {
  page(`<h1>💡 How to do your best in the 11+</h1><p class="muted">Ten minutes of tips that can add marks in every paper.</p>
    ${TIPS.map(s => `<div class="card lesson tip"><h2 style="margin-top:0">${s.h}</h2><ul>${s.li.map(x => `<li>${rich(x)}</li>`).join('')}</ul></div>`).join('')}
    <div class="card"><h3>For parents</h3><ul><li>Short and regular beats long and rare. Aim for 15 to 20 minutes on most days.</li><li>Praise effort and good methods, not only scores.</li><li>After each test, use <b>Fix my mistakes</b> together. Talking through a method is when learning sticks.</li><li>Sit mock papers under real conditions: quiet room, timer on, no help.</li></ul></div>
    <a class="btn big" href="#tests">Go to the tests →</a>`);
}

let resetArmed = false, removeArmed = null;
function vSettings(note) {
  const days = Object.keys(st.time).sort().slice(-7);
  page(`<h1>Settings</h1>${note ? `<div class="box eg">${esc(note)}</div>` : ''}
    ${accountCard()}
    ${storageOK ? '' : '<div class="box watch"><b>Progress cannot be saved in this browser window.</b> Check that private browsing is off, then reload.</div>'}
    <div class="card"><label for="board">Target exam</label>
      <select id="board" data-change="board">${Object.keys(BOARDS).map(k => `<option value="${k}" ${k === st.settings.board ? 'selected' : ''}>${esc(BOARDS[k].name)}</option>`).join('')}</select>
      <p class="muted small">${esc(BOARDS[st.settings.board].note)}</p></div>
    <div class="card"><label for="kidname">Your first name</label>
      <input id="kidname" class="inp" type="text" maxlength="20" autocomplete="off" value="${esc(st.settings.name || '')}" data-change="name" placeholder="For greetings and certificates">
      <label class="check"><input type="checkbox" data-change="sound" ${soundOn() ? 'checked' : ''}> Play sounds for right answers and awards</label></div>
    <div class="card"><h3>Children on this device</h3><p class="muted small">Each child has their own progress. Switch child with the animal button at the top.</p>
      ${meta.list.map(p => `<div class="row spread" style="padding:.35rem 0"><span>${p.avatar} <b>${esc(p.name || 'Explorer')}</b>${p.id === meta.current ? ' <span class="pill">Using now</span>' : ''}</span>${p.id === meta.current ? '' : `<button class="btn ghost" data-act="removechild" data-id="${p.id}">${removeArmed === p.id ? 'Press again to delete for good' : 'Remove'}</button>`}</div>`).join('')}
      <a class="btn alt" href="#who" style="margin-top:.5rem">➕ Add or switch child</a></div>
    <div class="card"><label for="examdate">Exam date</label>
      <input id="examdate" class="inp" type="date" value="${esc(st.settings.examDate || '')}" data-change="examdate">
      <p class="muted small">Shows a countdown and adjusts the parent plan. The Kent Test is usually taken in early September at the start of Year 6. Check your council's website for the exact date.</p></div>
    <div class="card"><h3>Parent PIN</h3><p class="muted small">${meta.pin ? 'A PIN is set for the parent view.' : 'No PIN yet. You can set one when you first open the parent view.'}</p>
      <div class="row"><a class="btn alt" href="#parent">Open parent view</a>${meta.pin ? '<button class="btn ghost" data-act="clearpin">Remove PIN</button>' : ''}</div></div>
    <div class="card"><h3>Time spent (last 7 active days)</h3>${days.length ? `<table><tbody>${days.map(d => `<tr><td>${d.split('-').reverse().join('/')}</td><td class="num">${Math.round(st.time[d] / 60)} min</td></tr>`).join('')}</tbody></table>` : '<p class="muted small">No sessions yet.</p>'}</div>
    <div class="card"><h3>Back up progress</h3><p class="muted small">Progress is stored only in this browser on this device. Save a backup file now and then, or use it to move progress to another device.</p>
      <div class="row"><button class="btn alt" data-act="export">Save a backup file</button><label class="btn alt" style="margin:0">Restore from a backup<input type="file" accept="application/json,.json" data-change="import" hidden></label></div></div>
    <div class="card"><h3>Start again</h3><p class="muted small">This clears all stars, history and progress on this device.</p>
      <button class="btn warn" data-act="reset">${resetArmed ? 'Press again to clear everything' : 'Clear all progress'}</button></div>
    <p class="muted small">No personal details are collected and nothing leaves this device unless a parent signs in, or turns on AI questions. <a href="privacy.html" target="_blank" rel="noopener">Privacy policy</a></p>`);
}

// ---------------------------------------------------------------- actions
const ACT = {
  exercise: d => { if (S && S.mode === 'exercise' && S.subject === d.sid && S.topic === d.tid) { location.hash = '#session'; return; } startExercise(d.sid, d.tid); },
  quiz: d => { if (S && S.mode === 'quiz' && S.subject === d.sid && S.topic === d.tid) { location.hash = '#session'; return; } startQuiz(d.sid, d.tid); },
  endsession: () => { if (S) finish(true); },
  report: d => reportPop(d.id),
  login: d => loginWith(d.p),
  loginshowemail: () => { loginEmail = true; vLogin(); const f = $('#sem'); if (f) f.focus(); },
  loginnew: () => emailAuth('new', loginBack),
  loginreset: () => emailAuth('reset', loginBack),
  loginguest: () => { setGuest(true); loginNote = ''; document.body.classList.remove('gate'); afterLogin(); },
  signout: () => { if (!sync.fb) return; setGuest(false); sync.fb.A.signOut(sync.fb.auth).then(() => { sync.user = null; loginNote = 'Signed out. Progress made so far stays on this device too.'; location.hash = '#login'; }); },
  syncnow: () => { syncPullAll().then(() => vParent(sync.status || 'Synced.')); },
  syncout: () => ACT.signout(),
  syncretry: () => { sync.fb = null; syncInit().then(() => vParent()); },
  syncforget: () => { const done = () => { syncStore(null); sync.fb = null; sync.user = null; vParent('Sync settings removed from this device. Progress stays on this device.'); }; if (sync.fb && sync.user) sync.fb.A.signOut(sync.fb.auth).then(done, done); else done(); },
  unreport: d => { if (st.hidden) delete st.hidden[d.id]; st.reports = (st.reports || []).filter(x => x.id !== d.id); save(); vParent('Report removed. The question can come up again.'); },
  parentchild: d => { if (d.id === meta.current) return; if (S) { stamp(); stopTimer(); persist(); } meta.current = d.id; saveMeta(); KEY = keyFor(d.id); st = load(); S = null; restore(); F = null; TRY = null; lastStars = null; vParent(); },
  switchchild: d => { if (d.id === meta.current) { location.hash = '#home'; return; } switchChild(d.id); },
  removechild: d => {
    const p = meta.list.find(x => x.id === d.id); if (!p || d.id === meta.current) return;
    if (removeArmed !== d.id) { removeArmed = d.id; return vSettings(); }
    removeArmed = null; meta.list = meta.list.filter(x => x.id !== d.id); saveMeta(); try { localStorage.removeItem(keyFor(d.id)); } catch (e) { /* ok */ }
    vSettings(`${p.name || 'That child'} has been removed from this device.`);
  },
  challenge: d => { if (S && S.hard && S.subject === d.sid && S.topic === d.tid) { location.hash = '#session'; return; } startChallenge(d.sid, d.tid); },
  hardtest: d => startHardTest(d.sid),
  aiex: d => aiExercise(d.sid, d.tid, d.l),
  aimock: d => aiMock(d.kind, aiLv()),
  aiset: d => aiPractice(d.sid, aiLv()),
  aiweak: () => { const w = weakTopics(['maths', 'english', 'vr'], 4); const sid = (w.find(x => ['maths', 'english', 'vr'].includes(x.sid)) || { sid: 'maths' }).sid; aiPractice(sid, aiLv(), true); },
  ailevel: d => { st.settings.aiLevel = aiLevelOK(d.l); save(); vTests(); const f = document.querySelector('[data-fold=t-ai]'); if (f && f.scrollIntoView) f.scrollIntoView({ block: 'start' }); },
  airemove: () => { aiStore(null); vParent('AI key removed from this device.'); },
  aitest: () => { const was = location.hash; aiRun('a test question', async () => {
    const r = await aiRefreshModels();
    await aiMake({ sid: 'maths', tids: ['four_ops'], n: 3, level: 1 });
    if (location.hash === was) vParent(`✅ The AI key works, using ${r.model}.${r.changed && r.was && r.was !== 'auto' ? ` (${r.was} is not available for this key, so the app switched.)` : ''} AI practice and AI papers are now available.`);
  }); },
  restartex: d => { if (S) finish(false); startExercise(d.sid, d.tid); },
  test: d => startTest(d.sid),
  focus: d => startFocus(d.scope || 'all'),
  again: d => { const e = st.history.find(h => h.id === d.id); if (e) regenerate(e.cfg); },
  fix: d => startFix(d.id),
  flag: () => { if (!S || !S.parts) return; if (S.flags.has(S.idx)) S.flags.delete(S.idx); else S.flags.add(S.idx); renderSession(); },
  speak: d => { const txt = d.sel.split(',').map(sel => [...document.querySelectorAll(sel)].map(el => el.innerText).join('. ')).join('. '); speak(txt); },
  lessonpop: d => lessonPop(d.sid, d.tid),
  trypick: d => { if (!TRY || TRY.chosen !== null) return; TRY.chosen = +d.i; const ok = TRY.chosen === TRY.q.a; renderTry(); sfx(ok ? 'right' : 'wrong'); if (ok) confetti(30); const f = $('#tryfb'); if (f && f.scrollIntoView) f.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' }); },
  trynext: d => { if (!TRY) return; tryNew(TRY.sid, TRY.tid, +d.l || 1); renderTry(); const el = $('#tryone'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' }); },
  tryhint: () => { if (TRY) { TRY.hint = true; renderTry(); } },
  closepop: () => closePop(),
  print: () => window.print(),
  sound: () => { st.settings.sound = !soundOn(); save(); chips(); if (soundOn()) sfx('right'); },
  lock: () => { parentOK = false; vParent(); },
  clearpin: () => { delete meta.pin; delete st.settings.pin; parentOK = false; saveMeta(); save(); vSettings('Parent PIN removed.'); },
  revision: () => startRevision(),
  hint: () => { S.hint = true; renderSession(); },
  prompt: d => { promptIdx++; const y = window.scrollY; vLesson(d.sid, d.tid); window.scrollTo(0, y); },
  deck: d => { deck = d.deck; F = null; vRevise(); },
  pick: d => {
    if (!S) return;
    const it = S.items[S.idx], i = +d.i;
    if (S.warm) { if (S.warm.c[S.warm.n] === null) { S.warm.c[S.warm.n] = i; const wq = QI[S.warm.ids[S.warm.n]]; sfx(wq && wq.a === i ? 'right' : 'wrong'); renderWarm(); } return; }
    if (S.between) return;
    if (S.parts) { it.chosen = i; S.confirm = false; sfx('tap'); return renderSession(); }
    if (it.chosen !== null) return;
    it.chosen = i;
    const ok = i === it.q.a;
    it.say = pick(ok ? PRAISE : KINDLY);
    if (ok) S.stars++;
    S.msg = record(it.q, ok, S.mode);
    save(); renderSession();
    sfx(ok ? 'right' : 'wrong'); buzz(ok ? 15 : [30, 40, 30]);
    if (S.msg === 'up') { setTimeout(() => sfx('level'), 350); confetti(50); }
    else if (ok) { let k = 0; for (let j = S.idx; j >= 0 && S.items[j].chosen === S.items[j].q.a; j--) k++; if (k && k % 5 === 0) { confetti(40); toast(`🔥 ${k} in a row! You are on fire!`); } }
  },
  next: () => {
    if (!S || S.between) return;
    if (S.parts) {
      if (S.idx + 1 >= S.parts[S.part].to) return ACT.finish();
    } else {
      const total = S.mode === 'exercise' ? S.target : S.items.length;
      if (S.idx + 1 >= total) return finish(true);
      if (S.mode === 'exercise' && S.idx + 1 >= S.items.length) {
        const lvl = ts(S.subject, S.topic).level;
        const from = d => pool(S.subject, S.topic, d).filter(q => !S.pid || q.p === S.pid);
        const q = freshest(from(lvl), 1, S.used)[0] || freshest(from(), 1, S.used)[0];
        if (!q) return finish(true);
        S.used.add(q.id); S.items.push({ q, chosen: null });
      }
    }
    S.idx++; S.hint = false; S.msg = null; S.confirm = false; renderSession();
    const card = $('#qcard');
    if (S.items[S.idx].q.p && window.innerWidth < 900 && card && card.scrollIntoView) card.scrollIntoView(); else window.scrollTo(0, 0);
  },
  prev: () => { if (S && !S.between && S.idx > (S.parts ? S.parts[S.part].from : 0)) { S.idx--; renderSession(); } },
  goto: d => { if (S && !S.between) { S.idx = +d.i; renderSession(); } },
  finish: () => {
    if (!S) return;
    if (!S.parts) return finish(true);
    if (S.between) return;
    const p = S.parts[S.part];
    if (!S.confirm && S.items.slice(p.from, p.to).some((i, k) => i.chosen === null || S.flags.has(p.from + k))) { S.confirm = true; return renderSession(); }
    endPart();
  },
  startpart: () => { if (S && S.between && !S.warm) { (S.mode === 'mock' ? startWarm : startPart)(S.part + 1); renderSession(); window.scrollTo(0, 0); } },
  warmnext: () => { if (S && S.warm && S.warm.n + 1 < S.warm.ids.length) { S.warm.n++; renderWarm(); window.scrollTo(0, 0); } },
  warmdone: () => endWarm(),
  wstart: () => { if (!st.wtask) { const ps = wPrompts(); st.wtask = { prompt: ps[promptIdx % ps.length], start: Date.now(), plan: '', text: '', planned: false }; save(); } vWriting(); window.scrollTo(0, 0); },
  wprompt: () => { promptIdx++; vWriting(); },
  wfinish: () => wFinish(),
  printpaper: d => { PAPER = buildPaper(d.kind); if (location.hash === '#print/' + d.kind) { vPrint(d.kind); window.scrollTo(0, 0); } else location.hash = '#print/' + d.kind; },
  mix: d => startMix(d.kind),
  mock: d => startMock(d.kind),
  flip: () => {
    if (F.flip) { F.i = (F.i + 1) % F.n; F.flip = false; F.seen++; if (F.seen >= 10 && st.flashDay !== today()) { st.flashDay = today(); save(); } }
    else F.flip = true;
    vRevise();
  },
  export: () => {
    const name = 'eleven-plus-progress-' + today() + '.json', data = JSON.stringify(st);
    if (isNative()) {
      const f = new File([data], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f], title: '11+ Explorer backup' }).catch(() => {});
      if (navigator.clipboard) return navigator.clipboard.writeText(data).then(() => vSettings('Backup copied. Paste it into a note or email to keep it safe.'));
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(st)], { type: 'application/json' }));
    a.download = 'eleven-plus-progress-' + today() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
  },
  reset: () => {
    if (!resetArmed) { resetArmed = true; return vSettings(); }
    resetArmed = false; S = null; st = fresh(); st.settings.name = me().name || null; delete meta.pin; saveMeta(); save(); vSettings(`All of ${me().name || 'this child'}'s progress has been cleared, and the parent PIN was removed.`);
  }
};
const SUBMIT = {
  syncsave: () => { const cfg = parseFbConfig(($('#fbcfg') || {}).value); if (!cfg) return vParent('That does not look like a Firebase web config. Copy the whole firebaseConfig block, including apiKey, projectId and appId.'); syncStore({ config: cfg }); sync.fb = null; syncInit().then(() => vParent(sync.fb ? 'Firebase connected. Now sign in or create an account.' : sync.status)); },
  loginemail: () => emailAuth('in', loginBack),
  report: () => {
    const f = document.querySelector('form[data-submit=report]'); if (!f) return;
    const id = f.dataset.id, q = QI[id]; if (!q) return closePop();
    const why = (f.querySelector('input[name=why]:checked') || {}).value || 'other', note = (($('#whynote') || {}).value || '').trim().slice(0, 200);
    st.hidden = st.hidden || {}; st.hidden[id] = today();
    st.reports = (st.reports || []).filter(x => x.id !== id);
    st.reports.unshift({ id, day: today(), why, note, subject: q.subject, topic: q.topic, d: q.d, q: q.q, opts: q.opts, ans: q.opts[q.a] });
    if (st.reports.length > 100) st.reports.length = 100;
    save(); closePop(); toast('🚩 Thanks! The question has been reported.');
    if (location.hash === '#session') renderSession(); else route();
  },
  addchild: () => {
    const name = (($('#newname') || {}).value || '').trim().slice(0, 20); if (!name) return vWho('Please type a name.');
    const av = (document.querySelector('input[name=av]:checked') || {}).value || AVATARS[0];
    const id = 'p' + Date.now().toString(36);
    meta.list.push({ id, name, avatar: av }); saveMeta();
    // the new child's progress starts fresh, with their name and the same exam setting
    try { localStorage.setItem(keyFor(id), JSON.stringify(Object.assign(fresh(), { settings: { board: st.settings.board, name, examDate: st.settings.examDate || null } }))); } catch (e) { /* ok */ }
    switchChild(id); toast(`Welcome, ${name}! ${av}`);
  },
  aisave: () => {
    const provider = ($('#aiprov') || {}).value || 'anthropic', key = (($('#aikey') || {}).value || '').trim(), model = (($('#aimodel') || {}).value || '').trim();
    const old = aiConf() || {};
    const k = key || (old.provider === provider ? old.key : '');
    if (!k) return vParent('Please paste an API key.');
    const same = old.provider === provider && old.key === k;
    aiStore({ provider, key: k, model: model || (same && old.model) || (provider === 'anthropic' ? AI_MODELS[0][0] : 'auto'), models: same ? old.models : undefined, maxOut: same && old.model === model ? old.maxOut : 0 });
    ACT.aitest();   // check the key straight away and find the models it can use
  },
  hello: () => { const v = (($('#hello') || {}).value || '').trim().slice(0, 20); if (!v) return; st.settings.name = v; me().name = v; saveMeta(); save(); sfx('right'); vHome(); toast(`Nice to meet you, ${v}! 🦉`); },
  setpin: () => { const v = ($('#pin1') || {}).value || ''; if (!/^\d{4,6}$/.test(v)) return vParent('The PIN must be 4 to 6 digits.'); meta.pin = hashPin(v); parentOK = true; saveMeta(); vParent('PIN saved.'); },
  unlock: () => { const v = ($('#pin2') || {}).value || ''; if (hashPin(v) === meta.pin) { parentOK = true; vParent(); } else vParent('That PIN is not right. Try again.'); }
};
document.addEventListener('submit', e => { const f = e.target.closest('[data-submit]'); if (f && SUBMIT[f.dataset.submit]) { e.preventDefault(); SUBMIT[f.dataset.submit](); } });
const CHANGE = {
  aiprov: () => { const c = aiConf() || {}; const v = ($('#aiprov') || {}).value; aiStore(Object.assign({}, c, { provider: v, model: v === 'anthropic' ? AI_MODELS[0][0] : '', key: c.provider === v ? c.key : '' })); vParent(); },
  name: el => { st.settings.name = el.value.trim().slice(0, 20) || null; me().name = st.settings.name || ''; saveMeta(); save(); if (location.hash.startsWith('#cert')) route(); else vSettings('Name saved.'); },
  sound: el => { st.settings.sound = el.checked; save(); chips(); },
  examdate: el => { st.settings.examDate = el.value || null; save(); vSettings(el.value ? 'Exam date saved.' : 'Exam date cleared.'); },
  wcheck: el => { const p = (st.writing || []).find(x => x.id === el.dataset.id); if (p) { p.checks = p.checks || []; p.checks[+el.dataset.i] = el.checked; save(); } },
  board: el => { st.settings.board = el.value; save(); vSettings('Exam setting saved.'); },
  import: el => {
    const f = el.files && el.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try { const o = JSON.parse(r.result); if (!o || !Array.isArray(o.history) || !o.settings) throw 0; st = Object.assign(fresh(), o); save(); vSettings('Backup restored.'); }
      catch (e) { vSettings('That file could not be read as a backup. Nothing was changed.'); }
    };
    r.readAsText(f);
  }
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const f = ACT[el.dataset.act];
  if (f) { e.preventDefault(); f(el.dataset, el); }
});
document.addEventListener('toggle', e => { const d = e.target; if (d && d.dataset && d.dataset.fold) { st.settings.folds = st.settings.folds || {}; st.settings.folds[d.dataset.fold] = d.open; save(); } }, true);
document.addEventListener('change', e => { const el = e.target.closest('[data-change]'); if (el && CHANGE[el.dataset.change]) CHANGE[el.dataset.change](el); });
document.addEventListener('keydown', e => {
  if ($('#pop')) { if (e.key === 'Escape') closePop(); return; }
  if (!S || S.between || location.hash !== '#session' || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase(), i = '12345'.indexOf(k) >= 0 ? '12345'.indexOf(k) : 'abcde'.indexOf(k);
  if (k.length === 1 && i >= 0 && i < S.items[S.idx].q.opts.length) ACT.pick({ i });
});

// ---------------------------------------------------------------- routing
function route() {
  const h = (location.hash || '#home').slice(1).split('/');
  if (h[0] !== 'session' && S) { stamp(); stopTimer(); persist(); }   // leaving pauses the activity; it can be continued later
  if (h[0] !== 'settings') { resetArmed = false; removeArmed = null; }
  if (h[0] !== 'parent' && h[0] !== 'history') parentOK = false;
  closePop(); if (canSpeak()) speechSynthesis.cancel();
  if (h[0] !== 'session') view().classList.remove('wide');
  if (h[0] !== 'writing' || h[1]) wStop(); document.body.classList.toggle('printview', h[0] === 'print');
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.nav === h[0] || a.dataset.nav === ({ topic: 'learn', lesson: 'learn', session: '', tips: 'more', cert: 'trophies', progress: 'more', history: 'more', parent: 'more', settings: 'more' }[h[0]] ?? h[0])));
  if (h[0] !== 'login') document.body.classList.remove('gate');
  if (h[0] !== 'login' && needLogin()) { try { if (h[0] !== 'who') sessionStorage.setItem('elevenplus.after', location.hash || '#home'); } catch (e) { /* ok */ } location.replace('#login'); return; }
  if (!firstReady()) return page('<div class="card"><h1>No questions found</h1><p>The course data files did not load. Check that the data folder is next to index.html.</p></div>');
  switch (h[0]) {
    case 'learn': h[1] ? vSubject(h[1]) : vLearn(); break;
    case 'topic': vTopic(h[1], h[2]); break;
    case 'lesson': vLesson(h[1], h[2]); break;
    case 'tests': vTests(); break;
    case 'writing': vWriting(h[1]); break;
    case 'print': vPrint(h[1]); break;
    case 'session':
      if (!S) { location.hash = '#home'; return; }
      if (S.parts && !S.between) { if (Date.now() >= S.deadline) { endPart(); break; } if (!timer) timer = setInterval(tick, 500); }
      renderSession(); break;
    case 'history': h[1] ? vResult(h[1], h[2] === 'done') : vHistory(); break;
    case 'revise': vRevise(); break;
    case 'progress': vProgress(); break;
    case 'settings': vSettings(); break;
    case 'parent': vParent(); break;
    case 'tips': vTips(); break;
    case 'trophies': vTrophies(); break;
    case 'more': vMore(); break;
    case 'who': vWho(); break;
    case 'login': vLogin(); break;
    case 'cert': vCert(decodeURIComponent(h.slice(1).join('/'))); break;
    default: vHome();
  }
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
window.addEventListener('beforeunload', () => { if (S) { stamp(); persist(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden && S) { stamp(); persist(); if (location.hash === '#session') { S.qIdx = S.idx; S.qShown = Date.now(); } } });
document.querySelectorAll('.cy').forEach(e => { e.textContent = new Date().getFullYear(); });   // copyright year in the footer
restore();
if (syncConf()) syncInit();
document.addEventListener('visibilitychange', () => { if (!document.hidden && sync.user) syncPullAll(); });
try { if (!needLogin() && meta.list.length > 1 && !sessionStorage.getItem('elevenplus.chosen') && (location.hash || '#home') === '#home') location.replace('#who'); } catch (e) { /* ok */ }
route();
})();
