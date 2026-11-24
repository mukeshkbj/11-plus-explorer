const S = 'http://127.0.0.1:8765', L = [];
let user = JSON.parse(localStorage.getItem('fakeuser') || 'null');
const post = async (p, b) => { const r = await fetch(S + p, { method: 'POST', body: JSON.stringify(b) }); const j = await r.json(); if (!r.ok) { const e = new Error(j.code); e.code = j.code; throw e; } return j; };
const set = u => { user = u; localStorage.setItem('fakeuser', JSON.stringify(u)); L.forEach(f => f(u)); };
export function getAuth() { return {}; }
export function onAuthStateChanged(a, f) { L.push(f); setTimeout(() => f(user), 10); }
export async function createUserWithEmailAndPassword(a, email, pw) { const j = await post('/signup', { email, pw }); set({ uid: j.uid, email }); }
export async function signInWithEmailAndPassword(a, email, pw) { const j = await post('/signin', { email, pw }); set({ uid: j.uid, email }); }
export async function signOut() { localStorage.removeItem('fakeuser'); set(null); }
export async function sendPasswordResetEmail() {}
class P { constructor(id) { this.providerId = id || 'google.com'; } setCustomParameters() {} addScope() {} }
export class GoogleAuthProvider extends P { constructor() { super('google.com'); } }
export class FacebookAuthProvider extends P { constructor() { super('facebook.com'); } }
export class GithubAuthProvider extends P { constructor() { super('github.com'); } }
export class TwitterAuthProvider extends P { constructor() { super('twitter.com'); } }
export class OAuthProvider extends P {}
export async function signInWithPopup(a, p) { if (window.__popupFail) { const e = new Error(window.__popupFail); e.code = window.__popupFail; throw e; } set({ uid: 'u-' + p.providerId, email: 'dad@' + p.providerId, displayName: 'Dad' }); }
export async function signInWithRedirect(a, p) { return signInWithPopup(a, p); }
export async function getRedirectResult() { return null; }
