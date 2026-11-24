const S = 'http://127.0.0.1:8765';
const post = async (p, b) => (await fetch(S + p, { method: 'POST', body: JSON.stringify(b) })).json();
export function getFirestore() { return {}; }
export function doc(db, ...seg) { return { path: seg.join('/') }; }
export async function getDoc(ref) { const j = await post('/get', { path: ref.path }); return { exists: () => j.data != null, data: () => j.data }; }
export async function setDoc(ref, data) { await post('/set', { path: ref.path, data }); }
