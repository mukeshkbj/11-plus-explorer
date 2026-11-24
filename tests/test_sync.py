"""Sync between devices with a fake Firebase (tests/fake-firebase): one family account, two devices for the
same child, and a sister's tablet that had its own progress before signing in (it must not be merged)."""
import asyncio
from playwright.async_api import async_playwright
from helpers import URL, launch_args, device, closepop, state, Checks
import server as fakefb

async def quiz(pg, sid, tid):
    await pg.goto(URL + f'#topic/{sid}/{tid}'); await pg.click('button[data-act=quiz]'); await pg.wait_for_timeout(200)
    for i in range(10): await pg.click('.opt >> nth=0'); await pg.click('#next'); await pg.wait_for_timeout(30)
    await closepop(pg, 500)

async def sign_in(pg, new=False, email='dad@example.com'):
    if '#login' not in pg.url: await pg.goto(URL + '#login')
    await pg.wait_for_selector('[data-act=loginshowemail]', timeout=8000)
    await pg.click('[data-act=loginshowemail]'); await pg.fill('#sem', email); await pg.fill('#spw', 'secret123')
    await pg.click('button[data-act=loginnew]' if new else 'form[data-submit=loginemail] button[type=submit]')
    await pg.wait_for_timeout(2000)

def cur_key(meta): return 'elevenplus.v1' if meta['current'] == 'p1' else 'elevenplus.v1.' + meta['current']

async def main():
    C = Checks('sync')
    srv = fakefb.start()
    async with async_playwright() as p:
        b = await p.chromium.launch(**launch_args())
        A = await device(b, guest=False)
        await A.goto(URL); await A.wait_for_timeout(500)
        C.ok('#login' in A.url, 'with a Firebase project set, the sign-in page comes first')
        await sign_in(A, new=True)
        C.ok(any(k.startswith('families/') for k in fakefb.DOCS), 'signing in creates the family record')
        await A.goto(URL + '#home'); await A.wait_for_timeout(300)
        if await A.locator('#hello').count(): await A.fill('#hello', 'Arjun'); await A.click('form[data-submit=hello] button'); await A.wait_for_timeout(200)
        await quiz(A, 'maths', 'fractions'); await A.wait_for_timeout(5000)   # saves are uploaded a few seconds later
        histA = len((await state(A))['history'])
        doc = next((v for k, v in fakefb.DOCS.items() if k.endswith('/children/p1')), None)
        C.ok(doc is not None and '"fractions"' in doc['state'], 'the quiz is uploaded')

        B = await device(b, guest=False)
        await B.goto(URL); await B.wait_for_timeout(500)
        await sign_in(B)
        stB = await state(B)
        C.ok(stB and len(stB['history']) == histA and stB['settings'].get('name') == 'Arjun', f"the second device gets Arjun's progress ({stB and len(stB['history'])} of {histA})")
        await quiz(B, 'vr', 'letter_series'); await B.wait_for_timeout(5000)
        await A.goto(URL + '#parent'); await A.wait_for_timeout(300)
        if await A.locator('#pin1').count(): await A.fill('#pin1', '1234'); await A.click('form[data-submit=setpin] button'); await A.wait_for_timeout(300)
        if await A.locator('#pin2').count(): await A.fill('#pin2', '1234'); await A.click('form[data-submit=unlock] button'); await A.wait_for_timeout(300)
        if await A.locator('button[data-act=syncnow]').count(): await A.click('button[data-act=syncnow]'); await A.wait_for_timeout(1500)
        stA = await state(A)
        topics = sorted(set(h.get('topic') for h in stA['history']))
        C.ok(topics == ['fractions', 'letter_series'], f'the first device gets what was done on the second ({topics})')

        Cd = await device(b, guest=True)   # sister's tablet: her own progress as the first child, before signing in
        await Cd.goto(URL); await Cd.wait_for_timeout(400)
        await Cd.fill('#hello', 'Riya'); await Cd.click('form[data-submit=hello] button'); await Cd.wait_for_timeout(200)
        await quiz(Cd, 'english', 'spelling')
        await Cd.evaluate("localStorage.removeItem('elevenplus.guest')")
        await Cd.goto(URL + '#login'); await Cd.wait_for_timeout(600)
        await sign_in(Cd); await Cd.wait_for_timeout(800)
        meta = await Cd.evaluate("JSON.parse(localStorage.getItem('elevenplus.profiles'))")
        names = sorted(x['name'] for x in meta['list'])
        C.ok(names == ['Arjun', 'Riya'], f'the tablet now has both children ({names})')
        cur = await state(Cd, cur_key(meta))
        C.ok(cur['settings'].get('name') == 'Riya' and sorted(set(h['topic'] for h in cur['history'])) == ['spelling'], "Riya keeps her own progress (not merged into Arjun's)")
        arjun = next(x for x in meta['list'] if x['name'] == 'Arjun')
        sa = await state(Cd, 'elevenplus.v1' if arjun['id'] == 'p1' else 'elevenplus.v1.' + arjun['id'])
        C.ok(sa and sorted(set(h.get('topic') for h in sa['history'])) == ['fractions', 'letter_series'], "Arjun's progress arrives on the tablet too")
        C.ok(A.errs == [] and B.errs == [] and Cd.errs == [], f'no page errors {A.errs[:2]} {B.errs[:2]} {Cd.errs[:2]}')
        await b.close()
    srv.shutdown()
    C.done()

asyncio.run(main())
