"""Storage housekeeping: a very heavy year of saved progress for three children is tidied on load,
every view still works with tidied (summary-only) history, and sync never fills tidied entries out again."""
import asyncio, json, subprocess, tempfile, os
from playwright.async_api import async_playwright
from helpers import ROOT, URL, TESTS, launch_args, device, closepop, state, Checks
import server as fakefb

LIMIT = 300 * 1024
META = {'list': [{'id': 'p1', 'name': 'Arjun', 'avatar': '🦉'}, {'id': 'p1x', 'name': 'Riya', 'avatar': '🦊'}, {'id': 'p2x', 'name': 'Dev', 'avatar': '🐼'}], 'current': 'p1'}

def heavy():
    f = tempfile.mktemp(suffix='.json')
    out = subprocess.run(['node', str(TESTS / 'storage' / 'heavy-year.js'), f], capture_output=True, text=True, check=True).stdout
    print(out.strip())
    raw = json.load(open(f)); os.remove(f)
    # the simulation names the extra children p1 and p2; use the ids in META
    return {'elevenplus.v1': raw['elevenplus.v1'], 'elevenplus.v1.p1x': raw['elevenplus.v1.p1'], 'elevenplus.v1.p2x': raw['elevenplus.v1.p2']}

async def seed(pg, items):
    # one key at a time with a reload in between: untidied, three heavy children do not even fit in the browser's storage
    await pg.goto(URL); await pg.wait_for_timeout(300)
    await pg.evaluate("() => { localStorage.clear(); localStorage.setItem('elevenplus.guest', '1'); sessionStorage.setItem('elevenplus.chosen', '1'); }")
    for k in sorted(items, key=lambda k: k != 'elevenplus.profiles'):
        await pg.evaluate("([k, v]) => localStorage.setItem(k, v)", [k, items[k]])
        await pg.goto(URL + '#home'); await pg.reload(); await pg.wait_for_timeout(500)

async def main():
    C = Checks('storage')
    states = heavy()
    before = {k: json.loads(v) for k, v in states.items()}
    srv = fakefb.start()
    async with async_playwright() as p:
        b = await p.chromium.launch(**launch_args())
        pg = await device(b)
        await seed(pg, dict(states, **{'elevenplus.profiles': json.dumps(META)}))
        sizes = await pg.evaluate("Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith('elevenplus.v1')).map(k => [k, localStorage.getItem(k).length]))")
        for k, n in sorted(sizes.items()):
            print(f'  after tidy {k}: {n // 1024} KB')
            C.ok(n < LIMIT, f'{k} is under 300 KB after a heavy year')
        s = await state(pg); s0 = before['elevenplus.v1']
        full = [h for h in s['history'] if not h.get('lite')]; lite = [h for h in s['history'] if h.get('lite')]
        C.ok(0 < len(full) and sum(len(h['items']) for h in full[10:]) <= 1200 and len(lite) > 0, f'recent history keeps its detail ({len(full)} full, {len(lite)} summaries)')
        C.ok(all(h['items'] for h in full) and all(h['items'] == [] for h in lite), 'summaries keep an empty items list (older app versions still read them)')
        C.ok(s['history'][0]['id'] == s0['history'][0]['id'] and len(s['history']) == min(500, len(s0['history'])), 'history keeps the newest 500 activities')
        C.ok(all(k in h for h in lite for k in ('id', 'ts', 'day', 'mode', 'score', 'total', 'secs')), 'summaries keep date, activity, score and time')
        C.ok(s['badges'] == s0['badges'] and s['topic'] == s0['topic'] and s['settings'] == s0['settings'] and s['stars'] == s0['stars'], 'badges, topic levels, settings and stars are untouched')
        C.ok(sum(s['time'].values()) == sum(s0['time'].values()), 'minutes practised are kept')
        C.ok(len(s['review']) <= 400, f"revision queue is capped ({len(s['review'])})")
        # tidying twice changes nothing
        await pg.reload(); await pg.wait_for_timeout(500)
        s2 = await state(pg)
        C.ok(all(json.dumps(s2[k]) == json.dumps(s[k]) for k in ('history', 'q', 'review', 'aiq', 'time')), 'tidying again changes nothing (idempotent)')
        # every view that reads history
        lid, fid = lite[0]['id'], full[0]['id']
        await pg.goto(URL + '#history'); await pg.wait_for_timeout(300)
        C.ok(await pg.locator('#view tbody tr').count() == len(s['history']), 'History lists every activity')
        await pg.goto(URL + f'#history/{lid}'); await pg.wait_for_timeout(300)
        C.ok('no longer kept' in await pg.inner_text('#view'), 'an old activity says its details are no longer kept')
        C.ok(await pg.locator('.ring').count() == 1, 'an old activity still shows its score')
        await pg.goto(URL + f'#history/{fid}'); await pg.wait_for_timeout(300)
        C.ok('Look back at each question' in await pg.inner_text('#view'), 'a recent activity still has its questions')
        for h in ['#progress', '#revise', '#home', '#trophies', '#tests', '#settings']:
            await pg.goto(URL + h); await pg.wait_for_timeout(250)
        C.ok('Progress uses' in await pg.inner_text('#view') and 'KB of space on this device' in await pg.inner_text('#view'), 'Settings shows the storage used on this device')
        await pg.goto(URL + '#parent'); await pg.fill('#pin1', '1234'); await pg.click('form[data-submit=setpin] button'); await pg.wait_for_timeout(400)
        C.ok('Timed test scores' in await pg.inner_text('#view'), 'parent report renders')
        # Fix my mistakes from a recent paper with rebuildable wrong answers
        fixable = await pg.evaluate("""() => { const st = JSON.parse(localStorage.getItem('elevenplus.v1'));
            const h = st.history.find(h => !h.lite && h.items.some(x => /^g/.test(x.id) && x.id.includes('-fractions-'))); return h && h.id; }""")
        if fixable:
            await pg.goto(URL + f'#history/{fixable}'); await pg.wait_for_timeout(300)
            if await pg.locator('button[data-act=fix]').count():
                await pg.click('button[data-act=fix]'); await pg.wait_for_timeout(300)
                C.ok('#session' in pg.url, 'Fix my mistakes starts from a recent activity')
                await pg.goto(URL + '#home'); await pg.wait_for_timeout(200)
                if await pg.locator('button[data-act=endsession]').count(): await pg.click('button[data-act=endsession]')
        # finishing an activity
        await pg.goto(URL + '#topic/maths/fractions'); await pg.click('button[data-act=quiz]'); await pg.wait_for_timeout(200)
        for i in range(10): await pg.click('.opt >> nth=0'); await pg.click('#next'); await pg.wait_for_timeout(30)
        await closepop(pg)
        s3 = await state(pg)
        C.ok(len(s3['history']) == len(s['history']) and s3['history'][0]['mode'] == 'quiz' and s3['history'][0]['items'] and s3['history'][1]['id'] == s['history'][0]['id'], 'a new activity is added with full detail and the list stays at its limit')
        C.ok(pg.errs == [], f'no page errors {pg.errs[:3]}')

        # an old or partial saved state does not break anything
        pg2 = await device(b)
        await seed(pg2, {'elevenplus.v1': json.dumps({'v': 1, 'settings': {'board': 'kent'}, 'history': [{'id': 'h1', 'ts': 1600000000000, 'mode': 'quiz', 'subject': 'maths', 'topic': 'fractions', 'score': 3, 'total': 5, 'secs': 60}, None, {'id': 'h1'}], 'review': None, 'q': {'g-maths-fractions-1-5': None}, 'aiq': {'ai-maths-zz-0-1': {}}})})
        s4 = await state(pg2)
        C.ok(len(s4['history']) == 1 and s4['history'][0]['lite'] == 1 and s4['history'][0]['day'] == '2020-09-13', 'a partial old state is repaired (missing items, null entries, duplicate ids)')
        await pg2.goto(URL + '#history/h1'); await pg2.wait_for_timeout(300)
        for h in ['#progress', '#revise', '#history', '#settings']:
            await pg2.goto(URL + h); await pg2.wait_for_timeout(200)
        C.ok(pg2.errs == [], f'no page errors with a partial old state {pg2.errs[:3]}')

        # sync: the cloud copy stays small, and a device with the old full copy does not fill summaries out again
        fakefb.reset()
        A = await device(b, guest=False)
        await seed(A, {'elevenplus.v1': states['elevenplus.v1'], 'elevenplus.profiles': json.dumps({'list': [META['list'][0]], 'current': 'p1'}), 'elevenplus.guest': ''})
        await A.evaluate("localStorage.removeItem('elevenplus.guest')"); await A.goto(URL + '#login'); await A.reload(); await A.wait_for_timeout(600)
        await A.click('[data-act=loginshowemail]'); await A.fill('#sem', 'mum@example.com'); await A.fill('#spw', 'secret123'); await A.click('button[data-act=loginnew]'); await A.wait_for_timeout(2500)
        doc = next((v for k, v in fakefb.DOCS.items() if k.endswith('/children/p1')), None)
        C.ok(doc is not None, 'the child was uploaded')
        if doc:
            print(f"  cloud copy: {len(doc['state']) // 1024} KB")
            C.ok(len(doc['state']) < 700 * 1024, 'the cloud copy is well under the 1 MB document limit')
        old = before['elevenplus.v1']; old['savedAt'] = old['savedAt'] + 1000   # an older device that has not tidied yet, with a newer save
        B = await device(b, guest=False)
        await seed(B, {'elevenplus.v1': json.dumps(old), 'elevenplus.profiles': json.dumps({'list': [META['list'][0]], 'current': 'p1'})})
        # put the untidied copy back as it would be on an old app version, then sign in
        await B.evaluate("s => { localStorage.setItem('elevenplus.v1', s); localStorage.removeItem('elevenplus.guest'); }", json.dumps(old))
        await B.goto(URL + '#login'); await B.reload(); await B.wait_for_timeout(600)
        await B.click('[data-act=loginshowemail]'); await B.fill('#sem', 'mum@example.com'); await B.fill('#spw', 'secret123'); await B.click('form[data-submit=loginemail] button[type=submit]'); await B.wait_for_timeout(2500)
        sb = await state(B)
        ids = [h['id'] for h in sb['history']]
        C.ok(len(ids) == len(set(ids)), 'merged history has no duplicates')
        C.ok(sum(1 for h in sb['history'] if not h.get('lite')) <= 200, 'merged history is not filled out again')
        doc = next((v for k, v in fakefb.DOCS.items() if k.endswith('/children/p1')), None)
        rs = json.loads(doc['state']) if doc else {'history': []}
        C.ok(len(doc['state']) < 700 * 1024 and sum(1 for h in rs['history'] if not h.get('lite')) <= 200, 'the cloud copy stays tidy after the merge')
        C.ok(A.errs == [] and B.errs == [], f'no page errors while syncing {A.errs[:2]} {B.errs[:2]}')
        await b.close()
    srv.shutdown()
    C.done()

asyncio.run(main())
