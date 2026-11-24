"""Smoke test: every topic (lesson, an exercise, the quiz button), every mock paper, and the main flows
(name prompt, exercise with right and wrong answers, a topic quiz that earns a star, a timed test, the views)."""
import asyncio, time
from playwright.async_api import async_playwright
from helpers import URL, launch_args, device, closepop, state, Checks

async def end_activity(pg):
    await pg.goto(URL + '#home'); await pg.wait_for_timeout(60)
    if await pg.locator('button[data-act=endsession]').count(): await pg.locator('button[data-act=endsession]').click(); await pg.wait_for_timeout(80)

async def answer_of(pg):
    """The text of the right option for the question on screen (bank or generated question)."""
    return await pg.evaluate("""() => { const id = document.querySelector('#qcard').dataset.qid;
        const all = [].concat(...Object.values(window.BANK).map(b => b.questions)); let q = all.find(x => x.id === id);
        if (!q) { const m = /^g\\d*-([a-z]+)-/.exec(id); q = m && window.GENS[m[1]].fromId(id); }
        return q ? q.opts[q.a] : null; }""")

def norm(s): return ''.join(c for c in s if c.isalnum())

async def pick_answer(pg, right=True):
    ans = norm(await answer_of(pg) or '')
    opts = [norm(o.split('\n', 1)[-1]) for o in await pg.locator('.opt').all_inner_texts()]
    i = opts.index(ans) if ans in opts else 0
    await pg.click(f'.opt >> nth={i if right else (i + 1) % len(opts)}')

async def main():
    C = Checks('smoke')
    async with async_playwright() as p:
        b = await p.chromium.launch(**launch_args())
        pg = await device(b)
        t0 = time.time(); await pg.goto(URL); await pg.wait_for_selector('#view h1'); print('  load %.2fs' % (time.time() - t0))
        C.ok(await pg.locator('#hello').count() == 1, 'first visit asks for a name')
        await pg.fill('#hello', 'Arjun'); await pg.click('form[data-submit=hello] button'); await pg.wait_for_timeout(200)
        C.ok((await state(pg))['settings'].get('name') == 'Arjun', 'the name is saved')
        topics = await pg.evaluate("Object.fromEntries(['maths','english','vr','nvr'].map(s => [s, window.BANK[s].topics.filter(t => !t.extra).map(t => t.id)]))")
        counts = await pg.evaluate("Object.fromEntries(['maths','english','vr','nvr'].map(s => [s, window.BANK[s].questions.length]))"); print('  pool sizes', counts)
        C.ok(all(n > 100 for n in counts.values()), 'every subject has a question pool')
        bad = []
        for sid, ts in topics.items():
            for tid in ts:
                await pg.goto(URL + f'#lesson/{sid}/{tid}'); await pg.wait_for_timeout(40)
                if not await pg.locator('.box.method').count(): bad.append(('no method', sid, tid))
                await pg.goto(URL + f'#topic/{sid}/{tid}'); await pg.wait_for_timeout(40)
                if not await pg.locator('button[data-act=quiz]').count(): bad.append(('no quiz button', sid, tid))
                btn = pg.locator('button[data-act=exercise]').first
                if not await btn.count(): bad.append(('no exercise button', sid, tid)); continue
                await btn.click(); await pg.wait_for_timeout(80)
                for k in range(3):
                    if not await pg.locator('.opt').count(): bad.append(('no options', sid, tid)); break
                    await pg.locator('.opt').first.click(); await pg.wait_for_timeout(30)
                    if await pg.locator('#next').count(): await pg.click('#next'); await pg.wait_for_timeout(30)
                await end_activity(pg)
        C.ok(not bad, f"every topic has a lesson, an exercise and a quiz ({sum(len(v) for v in topics.values())} topics) {bad[:5]}")
        for k in ['english', 'maths', 'reasoning', 'full']:
            await pg.goto(URL + '#tests'); await pg.wait_for_timeout(60)
            await pg.evaluate("document.querySelectorAll('details.fold').forEach(d => d.open = true)")
            sel = f'button[data-act=mock][data-kind="{k}"]'
            if not await pg.locator(sel).count(): C.ok(False, f'mock {k} button exists'); continue
            await pg.click(sel); await pg.wait_for_timeout(200)
            C.ok('#session' in pg.url and await pg.locator('.opt').count() >= 4, f"mock {k} starts ({(await pg.inner_text('.qnum')).strip()})")
            await end_activity(pg)

        # an exercise with one wrong answer, then a perfect quiz for a topic star
        await pg.goto(URL + '#topic/maths/fractions'); await pg.click('button[data-act=exercise]'); await pg.wait_for_timeout(150)
        for i in range(10):
            await pick_answer(pg, right=(i != 3)); await pg.wait_for_timeout(60)
            if i == 3: C.ok(await pg.locator('.opt.bad, .opt.wrong, .opt.no').count() >= 1 or 'answer' in (await pg.inner_text('#view')).lower(), 'a wrong answer shows feedback')
            await pg.click('#next'); await pg.wait_for_timeout(40)
        await closepop(pg, 600)
        C.ok('#history/' in pg.url, 'the exercise ends on its result page')
        st = await state(pg)
        C.ok(len(st['review']) >= 1, 'the wrong answer went into revision')
        await pg.goto(URL + '#topic/maths/fractions'); await pg.click('button[data-act=quiz]'); await pg.wait_for_timeout(150)
        for i in range(10): await pick_answer(pg); await pg.click('#next'); await pg.wait_for_timeout(30)
        await closepop(pg, 600)
        st = await state(pg)
        C.ok('t:maths/fractions' in st['badges'], 'a perfect quiz earns the topic star')
        await pg.goto(URL + '#cert/' + 't%3Amaths%2Ffractions'); await pg.wait_for_timeout(300)
        # a timed test
        await pg.goto(URL + '#tests'); await pg.click('button[data-act=test][data-sid=vr]'); await pg.wait_for_timeout(200)
        n = await pg.evaluate("document.querySelectorAll('.dots .dot').length") or 10
        for i in range(n):
            await pg.click('.opt >> nth=0')
            if i < n - 1 and await pg.locator('.row button[data-act=next]').count(): await pg.click('.row button[data-act=next]')
        await pg.click('.sess-head button[data-act=finish]'); await pg.wait_for_timeout(200)
        if await pg.locator('button[data-act=finish]').count(): await pg.click('button[data-act=finish] >> nth=0'); await pg.wait_for_timeout(200)
        await closepop(pg, 600)
        C.ok('#history/' in pg.url, f'the timed test ends on its result page ({pg.url.split("#")[-1]})')
        # leaving and coming back keeps the place
        await pg.goto(URL + '#topic/english/spelling'); await pg.click('button[data-act=exercise]'); await pg.wait_for_timeout(150)
        await pg.locator('.opt').first.click(); await pg.wait_for_timeout(50)
        await pg.reload(); await pg.wait_for_timeout(400)
        C.ok('#session' in pg.url and await pg.locator('.opt').count() >= 4, 'an activity in progress survives a reload')
        await pg.goto(URL + '#home'); await pg.wait_for_timeout(150)
        C.ok(await pg.locator('button[data-act=endsession]').count() >= 1 or 'Continue' in await pg.inner_text('#view'), 'Home offers to continue the activity')
        await end_activity(pg)
        for h in ['#home', '#learn', '#learn/maths', '#tests', '#revise', '#progress', '#history', '#trophies', '#tips', '#more', '#settings', '#who', '#parent']:
            await pg.goto(URL + h); await pg.wait_for_timeout(120)
            C.ok(await pg.locator('#view h1').count() >= 1, f'{h} renders')
        C.ok(pg.errs == [], f'no page errors {pg.errs[:5]}')
        await b.close()
    C.done()

asyncio.run(main())
