/* 11+ Explorer. All progress is stored on this device only (browser localStorage). */
(function () {
'use strict';

// ---------------------------------------------------------------- setup
const KEY = 'elevenplus.v1';
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
function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { storageOK = false; } }
let st = load();

// ---------------------------------------------------------------- question bank
const B = id => (window.BANK || {})[id];
const ready = id => !!(B(id) && B(id).questions && B(id).questions.length);
// Fresh non-verbal reasoning puzzles are drawn each time the app opens (12 per level per topic).
if (window.NVRGEN && ready('nvr')) window.NVRGEN.topics.forEach(t => { B('nvr').questions.push(...window.NVRGEN.batch(t, 12)); });
const QIraw = {};
SUBJECTS.forEach(s => { if (ready(s.id)) B(s.id).questions.forEach(q => { q.subject = s.id; QIraw[q.id] = q; }); });
// Generated puzzles from earlier sessions are rebuilt from their id when history or revision needs them.
const QI = new Proxy(QIraw, { get: (t, k) => {
  if (t[k] || typeof k !== 'string' || !k.startsWith('g-nvr-') || !window.NVRGEN) return t[k];
  const q = window.NVRGEN.fromId(k); if (q) { q.subject = 'nvr'; t[k] = q; }
  return q || undefined;
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
const pool = (sid, tid, d) => B(sid).questions.filter(q => q.topic === tid && (!d || q.d === d));
// Reading passages: questions that share a passage are kept together in one sitting.
const passages = sid => B(sid).passages || {};
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
  el.innerHTML = `<a class="chip" href="#trophies" title="${esc(r[2])}">${r[1]}</a><span class="chip" title="Day streak">🔥 ${st.streak}</span><span class="chip star ${bump ? 'bump' : ''}" title="Stars">⭐ ${st.stars}</span>
    <button class="chip" data-act="sound" aria-label="${soundOn() ? 'Turn sound off' : 'Turn sound on'}">${soundOn() ? '🔊' : '🔇'}</button>`;
}
const starsOf = (sid, tid) => { const m = mastery(sid, tid); return m >= 0.85 ? 3 : m >= 0.6 ? 2 : m >= 0.3 ? 1 : 0; };
const starRow = n => `<span class="tstars" aria-label="${n} of 3 stars">${'<i class="on">★</i>'.repeat(n)}${'<i>★</i>'.repeat(3 - n)}</span>`;

// ---------------------------------------------------------------- sessions
let S = null;       // the session in progress
let timer = null;
function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

function begin(mode, sid, tid, questions, extra) {
  S = Object.assign({ mode, subject: sid, topic: tid || null, items: questions.map(q => ({ q: prep(q), chosen: null })), idx: 0, start: Date.now(), hint: false, msg: null, stars: 0, used: new Set(questions.map(q => q.id)), flags: new Set(), qIdx: null }, extra || {});
  if (S.parts) startPart(0);
  if (location.hash === '#session') renderSession(); else location.hash = '#session';
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
function pickSpread(sid, topicIds, count, used, recent) {
  const topics = shuffle(topicIds.filter(t => pool(sid, t).length)), qs = [];
  if (!topics.length || count <= 0) return qs;
  recent = recent || recentTested();
  const easy = Math.round(count * 0.3), hard = Math.round(count * 0.25);
  const ds = shuffle(Array.from({ length: count }, (_, i) => i < easy ? 1 : i < count - hard ? 2 : 3));
  for (let i = 0; qs.length < count && i < count * 6; i++) {
    const t = topics[i % topics.length], d = ds[qs.length];
    const q = randomFresh(pool(sid, t, d), 1, used, recent)[0] || randomFresh(pool(sid, t), 1, used, recent)[0];
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
// Mock papers follow the Kent Test layout: English and Maths (25 minutes each), then Reasoning in three short sections.
function mockSection(key, recent) {
  const used = new Set();
  switch (key) {
    case 'english': return { name: 'English', mins: scaled(25), qs: passageBlock('english', ['comp_fiction', 'comp_nonfiction', 'comp_poetry'], 10).concat(pickSpread('english', ['spelling', 'punctuation', 'grammar', 'vocabulary', 'synonyms_antonyms', 'sentence_completion'], 14, used, recent)) };
    case 'maths': return { name: 'Maths', mins: scaled(25), qs: pickSpread('maths', plainTopics('maths'), 25, used, recent) };
    case 'vr': return { name: 'Verbal reasoning', mins: scaled(20), qs: pickSpread('vr', plainTopics('vr'), 24, used, recent) };
    case 'nvr': return { name: 'Non-verbal reasoning', mins: scaled(12), qs: pickSpread('nvr', ['odd_one_out', 'nvr_sequences', 'analogies', 'matrices', 'nvr_codes'], 16, used, recent) };
    default: return { name: 'Spatial reasoning', mins: scaled(12), qs: pickSpread('nvr', ['reflections', 'rotations', 'hidden_shapes', 'nets', 'views_3d'], 16, used, recent) };
  }
}
const MOCKS = {
  english: { name: 'English paper', keys: ['english'], sid: 'english' },
  maths: { name: 'Maths paper', keys: ['maths'], sid: 'maths' },
  reasoning: { name: 'Reasoning paper', keys: ['vr', 'nvr', 'spatial'], sid: 'mix' },
  full: { name: 'Complete mock exam', keys: ['english', 'maths', 'vr', 'nvr', 'spatial'], sid: 'mix' }
};
const MOCK_SIZE = { english: 24, maths: 25, vr: 24, nvr: 16, spatial: 16 };
const MOCK_MINS = { english: 25, maths: 25, vr: 20, nvr: 12, spatial: 12 };
const mockReady = kind => MOCKS[kind].keys.every(k => ready(k === 'spatial' ? 'nvr' : k));
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
// "Generate a new test" on the results page: the same kind of paper, freshly picked.
function regenerate(cfg) {
  if (!cfg) return;
  if (cfg.k === 'test') startTest(cfg.sid);
  else if (cfg.k === 'mix') startMix(cfg.kind);
  else if (cfg.k === 'mock') startMock(cfg.kind);
  else if (cfg.k === 'focus') startFocus(cfg.scope);
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
  const s = S; S = null;
  const isTimed = !!s.parts;
  if (isTimed && !redirect && !s.between) s.elapsed = (s.elapsed || 0) + Math.min(s.parts[s.part].mins * 60, Math.round((Date.now() - s.partStart) / 1000));
  // a timed paper counts blanks as not yet right; anything else only counts what was answered
  // (if he leaves a timed paper part-way, only the questions he answered are kept)
  let items = isTimed && redirect ? s.items.slice(0, s.parts[s.part].to) : s.items.filter(i => i.chosen !== null);
  if (isTimed && !items.some(i => i.chosen !== null)) items = [];
  if (!items.length) { if (redirect) location.hash = '#home'; return; }
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
function page(html) { view().innerHTML = html; chips(); animateCounts(); }
const bar = (v, cls) => `<div class="bar ${cls || ''}"><i style="width:${Math.round(v * 100)}%"></i></div>`;

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
    <h2>Subject medals</h2>
    <div class="shelf">${SUBJECTS.filter(s => ready(s.id)).map(s => `<div class="card medalcard" style="--c:${s.c}"><h3>${s.icon} ${esc(s.name)}</h3><p class="small muted">${topicStars(s.id)} of ${B(s.id).topics.length} topic stars</p>
      <div class="medals">${MEDALS.map(m => { const id = `m:${s.id}:${m.k}`; return `<a class="medal ${earned(id) ? 'got' : ''}" ${earned(id) ? `href="#cert/${encodeURIComponent(id)}"` : ''} title="${esc(badgeInfo(id).how)}"><span>${m.icon}</span><small>${earned(id) ? m.name : medalNeed(s.id, m.k) + ' ⭐'}</small></a>`; }).join('')}</div></div>`).join('')}</div>
    <h2>Badges <span class="pill">${got} of ${BADGES.length}</span></h2>
    <div class="trophies">${BADGES.map(b => card(b.id, b)).join('')}</div>
    <h2>Topic stars <span class="pill">${tstars.length}</span></h2>
    <p class="muted small">Score 8 or more out of 10 in a topic quiz to win its star.</p>
    ${tstars.length ? `<div class="trophies">${tstars.map(id => card(id, badgeInfo(id))).join('')}</div>` : `<div class="card">${buddy('No topic stars yet. Pick a topic, read the lesson, then take its quiz. You can do it!')}</div>`}`);
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
  const s = peek(sid, tid);
  page(`<p><a href="#learn/${sid}">← ${esc(B(sid).name)}</a></p><h1>${esc(t.name)}</h1>
    <p class="muted">${s ? `${s.correct} right out of ${s.seen} so far · Level: ${LEVEL[s.level]}` : 'New topic. Start with the lesson.'}</p>${bar(mastery(sid, tid), 'g')}
    <div class="grid" style="margin-top:1rem">
      <div class="card"><h3>1. Lesson</h3><p class="muted small">${t.extra ? 'Planning tips, writing prompts and a checklist.' : 'A short explanation with a worked example.'}</p><a class="btn alt" href="#lesson/${sid}/${tid}">Read the lesson</a></div>
      <div class="card"><h3>2. Exercise</h3><p class="muted small">No timer. Hints and full explanations.</p><button class="btn" data-act="exercise" data-sid="${sid}" data-tid="${tid}">Start practising</button></div>
      <div class="card"><h3>3. Quiz</h3><p class="muted small">10 questions. Score 8 or more to earn the topic star.</p><button class="btn alt" data-act="quiz" data-sid="${sid}" data-tid="${tid}">Take the quiz</button></div>
    </div>`);
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
    <h2>🎯 Weak-spot test</h2>` +
    (weak.length ? card('🎯 My weak spots', `${count} questions on ${tried ? 'the topics you find hardest right now' : 'four topics to get you started'}: ${weak.map(w => esc(w.name)).join(', ')}.`, 'focus', 'data-scope="all"', 'Start') : '') +
    `<h2>10-minute tests: one subject</h2>` +
    SUBJECTS.filter(s => ready(s.id)).map(s => card(`${s.icon} ${esc(s.name)}`, `${count} questions from across the subject.`, 'test', `data-sid="${s.id}"`, 'Start')).join('') +
    `<h2>10-minute tests: mixed</h2>` +
    Object.keys(MIXES).filter(k => MIXES[k].sids.filter(ready).length > 1).map(k => card(`🔀 ${esc(MIXES[k].name)}`, `${count} questions, shared between the subjects.`, 'mix', `data-kind="${k}"`, 'Start')).join('') +
    `<h2>Mock exams</h2><p class="muted small">Full-length papers laid out like the real test. Each section has its own clock, and you cannot go back to a section once it is finished. Find a quiet table before you start.</p>` +
    ['english', 'maths', 'reasoning'].filter(mockReady).map(k => card(`📝 ${esc(MOCKS[k].name)}`, info(k) + (k === 'reasoning' ? ' · three sections: verbal, non-verbal and spatial' : ''), 'mock', `data-kind="${k}"`, 'Start paper')).join('') +
    (mockReady('full') ? card('🏁 Complete mock exam', `${info('full')} · English, Maths, then the three Reasoning sections, with a break in the middle. Allow about two hours.`, 'mock', 'data-kind="full"', 'Start mock') : '') +
    (ready('english') ? `<div class="card"><div class="row spread"><div style="flex:1;min-width:220px"><h3>✏️ Writing task</h3><p class="muted small">The real test also includes a piece of writing. It is done on paper and is not marked here. Use the prompts and checklist to practise.</p></div>
      <a class="btn alt" href="#lesson/english/creative_writing">Open writing prompts</a></div></div>` : ''));
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
    <h2>Next: ${esc(next.name)}</h2><p class="muted">${next.to - next.from} questions · ${next.mins} minutes</p>
    <button class="btn big" data-act="startpart" style="max-width:420px;margin:1rem auto 0">Start ${esc(next.name)} →</button></div>`);
}

function renderSession() {
  if (S.between) { stamp(); return renderBetween(); }
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
  let h = `<div class="sess-head"><div><span class="pill">${esc(S.label && part ? S.label : MODE[S.mode])}</span> <span class="muted">${esc(where)}</span></div>
    <div class="row">${part ? '<span id="clock" class="clock" aria-label="Time left"></span>' : ''}<button class="btn ghost" data-act="finish">${endWord}</button></div></div>
    ${part ? '<div id="pace" class="pace" aria-live="polite"></div>' : ''}
    <div class="prog"><div style="width:${Math.round(100 * (fb ? answered : num) / total)}%"></div></div>
    <div class="${q.p ? 'split' : ''}">${passageHTML(q, true)}
    <div class="card" id="qcard" data-qid="${q.id}"><div class="row spread"><div class="qnum">Question ${num} of ${total}${S.mode === 'exercise' || S.mode === 'fix' ? ' · ' + LEVEL[q.d] : ''}${!S.topic && fb ? ' · ' + esc(t.name) : ''}
      ${tag === 'again' ? ' <span class="pill gold">Second chance</span>' : tag === 'twin' ? ' <span class="pill">Similar question</span>' : ''}${part && S.flags.has(S.idx) ? ' <span class="pill flagp">🚩 Flagged</span>' : ''}</div>
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
      ${ok ? '' : `<button class="btn ghost" data-act="lessonpop" data-sid="${q.subject}" data-tid="${q.topic}">📖 Show me the lesson</button>`}</div></div>`;
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
  if (part) tick();
  const nx = $('#next'); if (nx) nx.focus({ preventScroll: true });
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
      ${ok ? '' : `<p class="small"><span class="muted">${esc(subj(q.subject).name)} · ${esc(t.name)}${x.t ? ' · ' + fmtSecs(x.t) + ' on this question' : ''}</span> · <a href="#lesson/${q.subject}/${q.topic}">Read the lesson</a></p>`}</details>`;
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
  if (e.cfg) actions.push(`<button class="btn" data-act="again" data-id="${e.id}">🔄 Generate a new test</button>`);
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
    `</tbody></table></div>` : `<div class="card"><p>Nothing here yet. Every exercise, quiz and test you finish is saved here so you can look back at it.</p><a class="btn" href="#learn">Start learning</a></div>`));
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
    ${SUBJECTS.filter(s => ready(s.id)).map(s => `<div class="card"><div class="row spread"><h3>${s.icon} ${esc(s.name)}</h3><span class="pill">${Math.round(subjectMastery(s.id) * 100)}% mastered</span></div>${bar(subjectMastery(s.id), 'g')}
      <div style="margin-top:1rem">${B(s.id).topics.map(t => { const p = peek(s.id, t.id); return `<div style="margin:.55rem 0"><div class="row spread small"><a href="#topic/${s.id}/${t.id}">${esc(t.name)}</a><span class="muted">${p ? `${p.correct}/${p.seen} · ${LEVEL[p.level]}` : 'Not started'}</span></div>${bar(mastery(s.id, t.id))}</div>`; }).join('')}</div></div>`).join('')}
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

const hashPin = p => { let h = 7; for (const c of String(p)) h = (h * 31 + c.charCodeAt(0)) % 1000000007; return 'p' + h; };
let parentOK = false;
function vParent(note) {
  const msg = note ? `<div class="box ${/not|must/i.test(note) ? 'watch' : 'eg'}">${esc(note)}</div>` : '';
  if (!st.settings.pin) return page(`<h1>🔒 Parent view</h1>${msg}<div class="card"><p>Choose a PIN (4 to 6 digits) so only grown-ups can open this page.</p>
    <form data-submit="setpin" class="row"><input id="pin1" class="inp" type="password" inputmode="numeric" autocomplete="new-password" maxlength="6" aria-label="New PIN" placeholder="New PIN"><button class="btn" type="submit">Save PIN</button></form></div>`);
  if (!parentOK) return page(`<h1>🔒 Parent view</h1>${msg}<div class="card"><p>Enter the parent PIN.</p>
    <form data-submit="unlock" class="row"><input id="pin2" class="inp" type="password" inputmode="numeric" autocomplete="current-password" maxlength="6" aria-label="PIN" placeholder="PIN"><button class="btn" type="submit">Open</button></form>
    <p class="small muted">Forgotten it? Clearing all progress in Settings also removes the PIN.</p></div>`);
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
    <p class="muted">Summary for ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. ${countdownHTML()}</p>
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
    <div class="card"><h3>Badges</h3><div class="badges">${Object.keys(st.badges).map(b => `<span class="badge">${badgeInfo(b).icon} ${esc(badgeName(b))}</span>`).join('') || '<span class="badge off">None yet</span>'}</div></div>`);
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

let resetArmed = false;
function vSettings(note) {
  const days = Object.keys(st.time).sort().slice(-7);
  page(`<h1>Settings</h1>${note ? `<div class="box eg">${esc(note)}</div>` : ''}
    ${storageOK ? '' : '<div class="box watch"><b>Progress cannot be saved in this browser window.</b> Check that private browsing is off, then reload.</div>'}
    <div class="card"><label for="board">Target exam</label>
      <select id="board" data-change="board">${Object.keys(BOARDS).map(k => `<option value="${k}" ${k === st.settings.board ? 'selected' : ''}>${esc(BOARDS[k].name)}</option>`).join('')}</select>
      <p class="muted small">${esc(BOARDS[st.settings.board].note)}</p></div>
    <div class="card"><label for="kidname">Your first name</label>
      <input id="kidname" class="inp" type="text" maxlength="20" autocomplete="off" value="${esc(st.settings.name || '')}" data-change="name" placeholder="For greetings and certificates">
      <label class="check"><input type="checkbox" data-change="sound" ${soundOn() ? 'checked' : ''}> Play sounds for right answers and awards</label></div>
    <div class="card"><label for="examdate">Exam date</label>
      <input id="examdate" class="inp" type="date" value="${esc(st.settings.examDate || '')}" data-change="examdate">
      <p class="muted small">Shows a countdown and adjusts the parent plan. The Kent Test is usually taken in early September at the start of Year 6. Check your council's website for the exact date.</p></div>
    <div class="card"><h3>Parent PIN</h3><p class="muted small">${st.settings.pin ? 'A PIN is set for the parent view.' : 'No PIN yet. You can set one when you first open the parent view.'}</p>
      <div class="row"><a class="btn alt" href="#parent">Open parent view</a>${st.settings.pin ? '<button class="btn ghost" data-act="clearpin">Remove PIN</button>' : ''}</div></div>
    <div class="card"><h3>Time spent (last 7 active days)</h3>${days.length ? `<table><tbody>${days.map(d => `<tr><td>${d.split('-').reverse().join('/')}</td><td class="num">${Math.round(st.time[d] / 60)} min</td></tr>`).join('')}</tbody></table>` : '<p class="muted small">No sessions yet.</p>'}</div>
    <div class="card"><h3>Back up progress</h3><p class="muted small">Progress is stored only in this browser on this device. Save a backup file now and then, or use it to move progress to another device.</p>
      <div class="row"><button class="btn alt" data-act="export">Save a backup file</button><label class="btn alt" style="margin:0">Restore from a backup<input type="file" accept="application/json,.json" data-change="import" hidden></label></div></div>
    <div class="card"><h3>Start again</h3><p class="muted small">This clears all stars, history and progress on this device.</p>
      <button class="btn warn" data-act="reset">${resetArmed ? 'Press again to clear everything' : 'Clear all progress'}</button></div>
    <p class="muted small">No personal details are collected and nothing leaves this device.</p>`);
}

// ---------------------------------------------------------------- actions
const ACT = {
  exercise: d => startExercise(d.sid, d.tid),
  quiz: d => startQuiz(d.sid, d.tid),
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
  clearpin: () => { delete st.settings.pin; parentOK = false; save(); vSettings('Parent PIN removed.'); },
  revision: () => startRevision(),
  hint: () => { S.hint = true; renderSession(); },
  prompt: d => { promptIdx++; const y = window.scrollY; vLesson(d.sid, d.tid); window.scrollTo(0, y); },
  deck: d => { deck = d.deck; F = null; vRevise(); },
  pick: d => {
    if (!S) return;
    const it = S.items[S.idx], i = +d.i;
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
  startpart: () => { if (S && S.between) { startPart(S.part + 1); renderSession(); window.scrollTo(0, 0); } },
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
    resetArmed = false; st = fresh(); save(); vSettings('All progress has been cleared.');
  }
};
const SUBMIT = {
  hello: () => { const v = (($('#hello') || {}).value || '').trim().slice(0, 20); if (!v) return; st.settings.name = v; save(); sfx('right'); vHome(); toast(`Nice to meet you, ${v}! 🦉`); },
  setpin: () => { const v = ($('#pin1') || {}).value || ''; if (!/^\d{4,6}$/.test(v)) return vParent('The PIN must be 4 to 6 digits.'); st.settings.pin = hashPin(v); parentOK = true; save(); vParent('PIN saved.'); },
  unlock: () => { const v = ($('#pin2') || {}).value || ''; if (hashPin(v) === st.settings.pin) { parentOK = true; vParent(); } else vParent('That PIN is not right. Try again.'); }
};
document.addEventListener('submit', e => { const f = e.target.closest('[data-submit]'); if (f && SUBMIT[f.dataset.submit]) { e.preventDefault(); SUBMIT[f.dataset.submit](); } });
const CHANGE = {
  name: el => { st.settings.name = el.value.trim().slice(0, 20) || null; save(); if (location.hash.startsWith('#cert')) route(); else vSettings('Name saved.'); },
  sound: el => { st.settings.sound = el.checked; save(); chips(); },
  examdate: el => { st.settings.examDate = el.value || null; save(); vSettings(el.value ? 'Exam date saved.' : 'Exam date cleared.'); },
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
  if (h[0] !== 'session' && S) finish(false);   // leaving mid-session still saves what was answered
  if (h[0] !== 'settings') resetArmed = false;
  if (h[0] !== 'parent' && h[0] !== 'history') parentOK = false;
  closePop(); if (canSpeak()) speechSynthesis.cancel();
  if (h[0] !== 'session') view().classList.remove('wide');
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.nav === h[0] || a.dataset.nav === ({ topic: 'learn', lesson: 'learn', session: '', tips: 'more', cert: 'trophies', progress: 'more', history: 'more', parent: 'more', settings: 'more' }[h[0]] ?? h[0])));
  if (!firstReady()) return page('<div class="card"><h1>No questions found</h1><p>The course data files did not load. Check that the data folder is next to index.html.</p></div>');
  switch (h[0]) {
    case 'learn': h[1] ? vSubject(h[1]) : vLearn(); break;
    case 'topic': vTopic(h[1], h[2]); break;
    case 'lesson': vLesson(h[1], h[2]); break;
    case 'tests': vTests(); break;
    case 'session': if (S) renderSession(); else { location.hash = '#home'; return; } break;
    case 'history': h[1] ? vResult(h[1], h[2] === 'done') : vHistory(); break;
    case 'revise': vRevise(); break;
    case 'progress': vProgress(); break;
    case 'settings': vSettings(); break;
    case 'parent': vParent(); break;
    case 'tips': vTips(); break;
    case 'trophies': vTrophies(); break;
    case 'more': vMore(); break;
    case 'cert': vCert(decodeURIComponent(h.slice(1).join('/'))); break;
    default: vHome();
  }
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
window.addEventListener('beforeunload', () => { if (S && !S.parts) finish(false); });
route();
})();
