# Mock exams with practice warm-ups, Kent-style scores, printable papers and the writing task.
# Run: python3 tests/mock_print.py   (needs Playwright for Python and Google Chrome)
import asyncio, json, os, re, sys, time
from playwright.async_api import async_playwright

APP = os.environ.get('APP_URL') or 'file://' + os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'index.html')
SHOTS = os.environ.get('SHOTS', '/tmp/11plus-shots')
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')

fails = []
def check(ok, msg):
    print(('PASS ' if ok else 'FAIL ') + msg)
    if not ok: fails.append(msg)

async def main():
    os.makedirs(SHOTS, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        ctx = await b.new_context(viewport={'width': 1100, 'height': 900})
        await ctx.add_init_script("try{localStorage.setItem('elevenplus.guest','1')}catch(e){}")
        pg = await ctx.new_page()
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))

        async def go(h, wait=150):
            await pg.goto(APP + h); await pg.wait_for_timeout(wait)
            await pg.add_style_tag(content='#pop{display:none!important}')
        async def state():
            return await pg.evaluate("JSON.parse(localStorage.getItem('elevenplus.v1'))")
        async def open_folds():
            await pg.evaluate("document.querySelectorAll('details.fold').forEach(d=>d.open=true)")
        async def start_mock(kind):
            await go('#tests'); await open_folds()
            await pg.click(f'button[data-act=mock][data-kind="{kind}"]'); await pg.wait_for_timeout(250)
        async def end_session():
            await go('#home')
            if await pg.locator('button[data-act=endsession]').count():
                await pg.click('button[data-act=endsession]'); await pg.wait_for_timeout(200)

        await go('', 500)
        check(await pg.locator('#view h1').count() > 0, 'app loads')

        # --- Tests page wording
        await go('#tests'); await open_folds()
        txt = await pg.inner_text('#view')
        check('five sections' in txt, 'Tests page says five sections for the reasoning paper')
        check('three sections' not in txt, 'old "three sections" wording gone')
        check(await pg.locator('button[data-act=printpaper]').count() == 3, 'three Print a paper cards')
        check(await pg.locator('a[href="#writing"]').count() == 1, 'writing task card')

        # --- every mock kind: warm-up, then into the timed section
        expect_parts = {'english': 1, 'maths': 1, 'reasoning': 5, 'full': 7}
        for kind in ['english', 'maths', 'reasoning', 'full']:
            await start_mock(kind)
            pill = await pg.inner_text('.sess-head .pill')
            check('Practice first' in pill, f'{kind}: starts with a practice warm-up')
            check(await pg.locator('#clock').count() == 0, f'{kind}: no clock during practice')
            qn = await pg.inner_text('.qnum')
            check(re.match(r'Practice question 1 of [23]$', qn) is not None, f'{kind}: {qn}')
            await pg.locator('.opt').first.click(); await pg.wait_for_timeout(120)
            check(await pg.locator('#fbbox .steps li').count() > 0, f'{kind}: answer and method shown after a practice question')
            if kind == 'reasoning':
                await pg.screenshot(path=f'{SHOTS}/warmup.png', full_page=True)
            s = await state()
            check(s['active']['warm'] is not None and len(s['active']['parts']) == expect_parts[kind], f'{kind}: {len(s["active"]["parts"])} sections, warm-up saved')
            await pg.click('button[data-act=warmdone] >> nth=0'); await pg.wait_for_timeout(200)
            check(await pg.locator('#clock').count() == 1, f'{kind}: timed section started')
            qn = await pg.inner_text('.qnum')
            check(qn.startswith('Question 1 of'), f'{kind}: timed {qn}')
            await end_session()

        # --- reload in the middle of a warm-up keeps the place
        await start_mock('reasoning')
        await pg.locator('.opt').first.click(); await pg.wait_for_timeout(100)
        await pg.click('button[data-act=warmnext]'); await pg.wait_for_timeout(100)
        await pg.locator('.opt').nth(1).click(); await pg.wait_for_timeout(100)
        await pg.reload(); await pg.wait_for_function("document.querySelector('#view') && document.querySelector('#view').children.length > 0", timeout=15000); await pg.wait_for_timeout(500)
        await go('#session')
        qn = await pg.inner_text('.qnum')
        check(qn.startswith('Practice question 2 of'), f'reload mid-warm-up keeps the place ({qn})')
        check(await pg.locator('#fbbox').count() == 1, 'reload keeps the practice answer and method')
        check(await pg.locator('#clock').count() == 0, 'clock not running after reload in practice')
        # skip practice for every section and answer the paper
        right_letters = 0
        for sec in range(5):
            check('Practice first' in await pg.inner_text('.sess-head .pill'), f'reasoning section {sec + 1}: practice first')
            await pg.click('button[data-act=warmdone] >> nth=0'); await pg.wait_for_timeout(150)
            while True:
                await pg.locator('.opt').first.click(); await pg.wait_for_timeout(15)
                if await pg.locator('button[data-act=next]').count():
                    await pg.click('button[data-act=next]'); await pg.wait_for_timeout(15)
                else:
                    break
            await pg.click('#view button[data-act=finish] >> nth=-1'); await pg.wait_for_timeout(200)
            if await pg.locator('button[data-act=finish]').count() and await pg.locator('.box.hint').count():
                await pg.click('#view button[data-act=finish] >> nth=-1'); await pg.wait_for_timeout(200)
            if sec < 4:
                await go('#session')
                check(await pg.locator('button[data-act=startpart]').count() == 1, f'between screen after section {sec + 1}')
                await pg.click('button[data-act=startpart]'); await pg.wait_for_timeout(200)
        await pg.wait_for_timeout(400)
        check('#history/' in pg.url, 'reasoning paper finished to results')
        s = await state()
        e = s['history'][0]
        check(e['mode'] == 'mock' and e['total'] == 64, f'history entry has only the 64 paper questions (got {e["total"]})')
        check(len(e['parts']) == 5, 'five section scores saved')
        await pg.add_style_tag(content='#pop{display:none!important}')
        kent = pg.locator('.kent')
        check(await kent.count() == 1, 'Kent-style score panel on results')
        ktxt = await kent.inner_text()
        m = re.search(r'Reasoning\s+(\d+)/(\d+)\s+(\d+)', ktxt)
        ok = bool(m) and int(m.group(3)) == max(69, min(141, int(69 + 72 * int(m.group(1)) / int(m.group(2)) + 0.5)))
        check(ok, f'reasoning estimated score follows the 69-141 mapping ({m.groups() if m else ktxt[:80]})')
        check('rough guide' in ktxt.lower() and 'age-standardised' in ktxt, 'panel says it is a rough guide')
        await kent.scroll_into_view_if_needed()
        await pg.locator('.kent').screenshot(path=f'{SHOTS}/score_panel.png')
        # a complete mock entry shows English, Maths, Reasoning and a total: build one from the saved paper
        total_ok = await pg.evaluate("""() => {
          const s = JSON.parse(localStorage.getItem('elevenplus.v1'));
          const find = id => { for (const k of ['english','maths','vr','nvr']) { const q = window.BANK[k].questions.find(x => x.id === id); if (q) return q; } return null; };
          const pickIds = (sid, n) => window.BANK[sid].questions.filter(q => !q.p).slice(0, n).map(q => ({ id: q.id, c: q.a, t: 0 }));
          const items = pickIds('english', 10).concat(pickIds('maths', 10), pickIds('vr', 10));
          s.history.unshift({ id: 'hfull', ts: Date.now(), day: '2026-11-24', mode: 'mock', subject: 'mix', score: items.length, total: items.length, secs: 60, stars: 0, items, label: 'Complete mock exam', mins: 60 });
          localStorage.setItem('elevenplus.v1', JSON.stringify(s)); return true; }""")
        await pg.reload(); await pg.wait_for_function("document.querySelector('#view') && document.querySelector('#view').children.length > 0", timeout=15000); await go('#history/hfull')
        ktxt = await pg.inner_text('.kent')
        check('Total' in ktxt and '423' in ktxt and 'reaches the usual Kent standard' in ktxt, 'complete mock shows total and the 332/106 note')

        # --- printable papers
        for kind in ['english', 'maths', 'reasoning']:
            await go('#tests'); await open_folds()
            await pg.click(f'button[data-act=printpaper][data-kind="{kind}"]'); await pg.wait_for_timeout(500)
            check(pg.url.endswith('#print/' + kind), f'print {kind}: print view opens')
            cover = await pg.inner_text('.pp-cover')
            check('Name:' in cover and 'Instructions' in cover and 'Time allowed' in cover, f'print {kind}: cover page')
            nq = await pg.locator('.pp-q').count(); nrow = await pg.locator('.pp-sheet .pp-row').count(); nkey = await pg.locator('.pp-key li').count()
            check(nq > 0 and nq == nrow == nkey, f'print {kind}: {nq} questions, {nrow} answer-sheet rows, {nkey} key entries')
            res = await pg.evaluate("""() => {
              const find = id => { for (const k of ['english','maths','vr','nvr']) { const q = window.BANK[k].questions.find(x => x.id === id); if (q) return q; } return null; };
              const norm = s => String(s).replace(/[\\s\\/]/g, '');
              const tmp = document.createElement('span');
              const sameSvg = (el, html) => { tmp.innerHTML = html; return el.innerHTML === tmp.innerHTML; };
              const out = { bad: [], n: 0, nums: true, passages: true };
              document.querySelectorAll('.pp-q').forEach((el, i) => {
                const q = find(el.dataset.qid); out.n++;
                if (+el.dataset.n !== i + 1) out.nums = false;
                if (!q) { out.bad.push('missing ' + el.dataset.qid); return; }
                let printed;
                if (q.of) printed = [...el.querySelectorAll('.pp-pic')].findIndex((pc, k) => sameSvg(pc.querySelector('.ofig'), q.of[q.a]));
                else printed = [...el.querySelectorAll('.pp-opts li')].findIndex(li => norm(li.querySelector('.pp-ot').innerText) === norm(q.opts[q.a]));
                const letters = [...el.querySelectorAll('[data-l]')].map(x => x.dataset.l).join('');
                if (letters !== 'ABCDE'.slice(0, q.opts.length)) out.bad.push('letters ' + letters);
                const key = document.querySelector('.pp-key li[data-n="' + el.dataset.n + '"] .pp-kl');
                if (!key || printed < 0 || key.textContent !== 'ABCDE'[printed]) out.bad.push(el.dataset.n + ': key ' + (key && key.textContent) + ' printed ' + printed);
                if (q.p) { const prev = el.previousElementSibling; const first = !prev || !prev.classList.contains('pp-q') || (find(prev.dataset.qid) || {}).p !== q.p; if (first && !(prev && prev.classList.contains('pp-passage'))) out.passages = false; }
              });
              return out; }""")
            check(not res['bad'], f'print {kind}: key letters match printed option order ({res["bad"][:3]})')
            check(res['nums'], f'print {kind}: questions numbered 1..n in order')
            check(res['passages'], f'print {kind}: passages printed before their questions')
            if kind == 'english':
                check(await pg.locator('.pp-passage').count() >= 1, 'print english: passage included')
            pdf = f'{SHOTS}/paper_{kind}.pdf'
            await pg.emulate_media(media='print')
            check(await pg.locator('.top').is_hidden() and await pg.locator('.pp-bar').is_hidden(), f'print {kind}: app chrome hidden when printing')
            await pg.pdf(path=pdf, format='A4', margin={'top': '12mm', 'bottom': '12mm', 'left': '12mm', 'right': '12mm'})
            if kind == 'reasoning':
                await pg.locator('.pp-book').nth(1).screenshot(path=f'{SHOTS}/print_questions.png')
                await pg.locator('.pp-sheet').screenshot(path=f'{SHOTS}/answer_sheet.png')
                await pg.locator('.pp-keyp').screenshot(path=f'{SHOTS}/answer_key.png')
            await pg.emulate_media(media='screen')
        check(await pg.locator('.pp-bar a[href="#tests"]').count() == 1, 'print view has a Back link')

        # --- writing task
        await go('#writing')
        await pg.click('button[data-act=wstart]'); await pg.wait_for_timeout(300)
        check(await pg.locator('#clock').count() == 1 and 'Planning' in await pg.inner_text('#wphase'), 'writing: clock running in planning time')
        await pg.fill('#wplan', 'Opening: the key. Problem: the door is locked.')
        await pg.locator('#wtext').click(); await pg.keyboard.type('The key was not supposed to fit that door, but it did.')
        await pg.wait_for_timeout(700)
        check('11 words' in await pg.inner_text('#wcount') or '12 words' in await pg.inner_text('#wcount'), 'writing: word count ' + await pg.inner_text('#wcount'))
        await pg.reload(); await pg.wait_for_function("document.querySelector('#view') && document.querySelector('#view').children.length > 0", timeout=15000); await pg.wait_for_timeout(500)
        check((await pg.input_value('#wtext')).startswith('The key was not supposed'), 'writing: text survives a reload')
        check('Opening: the key' in await pg.input_value('#wplan'), 'writing: plan survives a reload')
        # move the clock on past the planning time
        await pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('elevenplus.v1')); s.wtask.start -= 601000; localStorage.setItem('elevenplus.v1', JSON.stringify(s)); }")
        await pg.reload(); await pg.wait_for_function("document.querySelector('#view') && document.querySelector('#view').children.length > 0", timeout=15000); await pg.wait_for_timeout(1500)
        toasts = await pg.locator('.toast').all_inner_texts()
        check(any('Planning time is up' in t for t in toasts), 'writing: announces when planning time is up')
        check('Writing time' in await pg.inner_text('#wphase'), 'writing: phase changes to writing')
        await pg.screenshot(path=f'{SHOTS}/writing.png', full_page=True)
        await pg.click('button[data-act=wfinish]'); await pg.wait_for_timeout(400)
        check('#writing/w' in pg.url, 'writing: finished piece opens')
        check(await pg.locator('input[data-change=wcheck]').count() >= 4, 'writing: self-check checklist shown')
        await pg.locator('input[data-change=wcheck]').first.check(); await pg.wait_for_timeout(200)
        s = await state()
        check(s['writing'][0]['text'].startswith('The key') and s['writing'][0]['checks'][0] is True and 'wtask' not in s, 'writing: piece saved with checklist ticks')
        await go('#history')
        check('Writing tasks' in await pg.inner_text('#view') and await pg.locator('a[href^="#writing/w"]').count() >= 1, 'writing: listed in History')
        await pg.click('a[href^="#writing/w"]'); await pg.wait_for_timeout(200)
        check('The key was not supposed' in await pg.inner_text('.wpiece >> nth=-1'), 'writing: parent can read the piece from History')
        # automatic end when the 40 minutes are up
        await go('#writing'); await pg.click('button[data-act=wstart]'); await pg.wait_for_timeout(200)
        await pg.evaluate("() => { const s = JSON.parse(localStorage.getItem('elevenplus.v1')); s.wtask.start -= 2401000; localStorage.setItem('elevenplus.v1', JSON.stringify(s)); }")
        await pg.reload(); await pg.wait_for_function("document.querySelector('#view') && document.querySelector('#view').children.length > 0", timeout=15000); await pg.wait_for_timeout(1500)
        check('#writing/w' in pg.url, 'writing: ends by itself after 40 minutes')

        check(not errs, f'no page errors {errs[:3]}')
        await b.close()
    print('\n%d failure(s)' % len(fails))
    sys.exit(1 if fails else 0)

asyncio.run(main())
