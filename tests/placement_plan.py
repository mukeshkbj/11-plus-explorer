# Starting test (placement) and the week-by-week study plan.
# Run: python3 tests/placement_plan.py   (screenshots go to /home/claude/shots_agentB/)
import asyncio, json, os, re, datetime
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
URL = 'file://' + os.path.join(os.path.dirname(HERE), 'index.html')
SHOTS = os.environ.get('SHOTS', '/tmp/11plus-shots')
os.makedirs(SHOTS, exist_ok=True)
KEY = 'elevenplus.v1'
fails = []
def check(ok, msg):
    print(('PASS ' if ok else 'FAIL ') + msg)
    if not ok: fails.append(msg)

# Index of the right option on screen, worked out from the question bank (options are shuffled on screen).
RIGHT_JS = """() => {
  const card = document.querySelector('#qcard'); if (!card) return -1;
  const id = card.dataset.qid; let q = null;
  for (const s of ['maths','english','vr','nvr']) { q = window.BANK[s].questions.find(x => x.id === id); if (q) break; }
  if (!q) return -2;
  if (q.of) return q.a;
  const norm = t => String(t).replace(/[^A-Za-z0-9]/g, '');
  const want = norm(q.opts[q.a]);
  const opts = [...document.querySelectorAll('#qcard .opt')].map(b => norm(b.querySelector('span:last-child').innerText));
  const hits = opts.map((o, i) => o === want ? i : -1).filter(i => i >= 0);
  return hits.length === 1 ? hits[0] : -3;
}"""

async def state(pg): return await pg.evaluate(f"() => JSON.parse(localStorage.getItem('{KEY}'))")
async def closepop(pg):
    for _ in range(3):
        if await pg.query_selector('#pop'): await pg.keyboard.press('Escape'); await pg.wait_for_timeout(60)

async def answer_feedback(pg, right):
    """Answer the question on screen in an untimed session (feedback shown), then press Next."""
    r = await pg.evaluate(RIGHT_JS)
    n = await pg.locator('#qcard .opt').count()
    i = r if r >= 0 else 0
    if not right and r >= 0: i = (r + 1) % n
    await pg.locator('#qcard .opt').nth(i).click()
    await pg.wait_for_timeout(30)
    await pg.click('#next'); await pg.wait_for_timeout(40)
    return r >= 0 and right

async def run_feedback_session(pg, pattern=lambda k: True, limit=80, on_q=None):
    k = 0
    while '#session' in pg.url and k < limit:
        if not await pg.locator('#qcard .opt').count(): break
        if on_q: await on_q(k)
        await answer_feedback(pg, pattern(k)); k += 1
    return k

async def unlock_parent(pg):
    await pg.goto(URL + '#parent'); await pg.wait_for_timeout(150)
    if await pg.locator('#pin1').count():
        await pg.fill('#pin1', '1234'); await pg.press('#pin1', 'Enter'); await pg.wait_for_timeout(150)
    elif await pg.locator('#pin2').count():
        await pg.fill('#pin2', '1234'); await pg.press('#pin2', 'Enter'); await pg.wait_for_timeout(150)

async def set_exam(pg, d):
    await pg.evaluate(f"() => {{ const o = JSON.parse(localStorage.getItem('{KEY}')); o.settings.examDate = {json.dumps(d)}; localStorage.setItem('{KEY}', JSON.stringify(o)); }}")
    await pg.goto(URL + '#home'); await pg.reload(); await pg.wait_for_function("document.querySelector('#view') && document.querySelector('#view').children.length > 0", timeout=15000); await pg.wait_for_timeout(300)
    await pg.add_style_tag(content='#pop{display:none!important}')

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**({'executable_path': os.environ.get('CHROME', '/usr/bin/google-chrome')} if os.path.exists(os.environ.get('CHROME', '/usr/bin/google-chrome')) else {}))
        ctx = await b.new_context(viewport={'width': 1100, 'height': 900})
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_selector('#view h1')
        # use the app without an account (the sign-in page is shown first otherwise)
        await pg.evaluate("() => { localStorage.setItem('elevenplus.guest', '1'); }"); await pg.goto(URL + '#home'); await pg.reload(); await pg.wait_for_function("document.querySelector('#view') && document.querySelector('#view').children.length > 0", timeout=15000); await pg.wait_for_selector('#view h1')
        await pg.add_style_tag(content='#pop{display:none!important}')

        # ---- 1. fresh child: the starting test is offered on home
        check(await pg.locator('.placecard [data-act=placement]').count() == 1, 'home offers the starting test to a new child')
        check(await pg.locator('.weekplan').count() == 1, 'home shows the This week card')
        await pg.screenshot(path=f'{SHOTS}/home_new.png', full_page=True)
        await pg.click('.placecard [data-act=placement]'); await pg.wait_for_timeout(200)
        check('#session' in pg.url, 'starting test opens a session')
        qn = await pg.inner_text('.qnum'); m = re.search(r'Question 1 of (\d+)', qn)
        check(bool(m), f'question counter shows the planned length ({qn.strip()[:30]})')
        total = int(m.group(1)) if m else 40
        check(30 <= total <= 50, f'about 40 questions in the starting test (got {total})')
        pill = await pg.inner_text('.sess-head .pill'); check('Starting test' in pill, 'session is labelled Starting test')

        # adaptive: right on the first of a group -> second is level 3, wrong -> level 1
        levels = []
        async def note(k):
            qid = await pg.get_attribute('#qcard', 'data-qid')
            d = await pg.evaluate(f"() => {{ for (const s of ['maths','english','vr','nvr']) {{ const q = window.BANK[s].questions.find(x => x.id === {json.dumps(qid)}); if (q) return [q.d, q.subject, q.topic]; }} return null; }}")
            levels.append(d)
        pattern = lambda k: (k // 2) % 3 != 2 if k % 2 == 0 else (k % 4 == 1)   # some right, some wrong
        # answer 7 questions, then reload mid-test
        done = 0
        for k in range(7):
            await note(k); await answer_feedback(pg, pattern(k)); done += 1
        before = await pg.inner_text('.qnum')
        await pg.reload(); await pg.wait_for_function("document.querySelector('#view') && document.querySelector('#view').children.length > 0", timeout=15000); await pg.wait_for_timeout(400); await pg.add_style_tag(content='#pop{display:none!important}')
        after = await pg.inner_text('.qnum') if await pg.locator('.qnum').count() else ''
        check(before.split('·')[0].strip() == after.split('·')[0].strip(), f'reload mid-test resumes at the same question ({before.split(chr(10))[0][:20]} / {after.split(chr(10))[0][:20]})')
        await pg.goto(URL + '#home'); await pg.wait_for_timeout(200)
        check(await pg.locator('.resume').count() == 1, 'home shows Carry on bar during the starting test')
        check('Carry on' in await pg.inner_text('.placecard'), 'starting test card says Carry on')
        await pg.click('.placecard a[href="#session"]'); await pg.wait_for_timeout(200)
        async def note2(k): await note(k + done)
        n = await run_feedback_session(pg, lambda k: pattern(k + done), on_q=note2)
        check('#placement/done' in pg.url, f'finishing lands on the summary (answered {done + n})')
        await closepop(pg)
        firsts = [levels[i][0] for i in range(0, len(levels), 2) if levels[i]]
        check(sum(1 for d in firsts if d == 2) >= len(firsts) - 2, f'first question of each group is mostly level 2 ({firsts})')
        ok_adapt = 0; bad_adapt = []
        for i in range(1, len(levels), 2):
            exp = 3 if pattern(i - 1) else 1
            if levels[i] and levels[i][0] == exp: ok_adapt += 1
            else: bad_adapt.append((i, levels[i], exp))
        check(ok_adapt >= (len(levels) // 2) - 2, f'follow-up level adapts (ok {ok_adapt}, off {bad_adapt[:3]})')
        txt = await pg.inner_text('#view')
        check('You finished your starting test' in txt and 'Your plan is ready' in txt and 'strengths' in txt.lower() and 'Topics to work on' in txt, 'summary shows strengths, topics to work on and plan ready')
        await pg.screenshot(path=f'{SHOTS}/placement_summary.png', full_page=True)
        s = await state(pg)
        pl = s.get('placement') or {}
        check(len(pl.get('groups', [])) >= 18 and not pl.get('partial'), f"baseline stored ({len(pl.get('groups', []))} groups, score {pl.get('score')}/{pl.get('total')})")
        mism = [(g['name'], t) for g in pl.get('groups', []) for t in g['all'] if s['topic'].get(g['sid'] + '/' + t, {}).get('level') != g['level']]
        check(not mism, f'every topic level set from its group ({mism[:3]})')
        check(len(set(g['level'] for g in pl['groups'])) >= 2, f"levels vary: {sorted(set(g['level'] for g in pl['groups']))}")
        h = s['history'][0]
        check(h['mode'] == 'placement' and h['total'] == done + n, 'starting test saved in history with every answer')
        seen = sum(v.get('seen', 0) for v in s['topic'].values())
        check(seen == done + n, f'answers feed topic accuracy ({seen})')
        await pg.goto(URL + '#home'); await pg.wait_for_timeout(200)
        check(await pg.locator('.placecard').count() == 0, 'home no longer nags about the starting test')
        await pg.goto(URL + f"#history/{h['id']}"); await pg.wait_for_timeout(200)
        check('Starting test' in await pg.inner_text('#view'), 'history review page opens for the starting test')

        # ---- 2. plan with no exam date
        await unlock_parent(pg)
        check(await pg.locator('#planexam').count() >= 1 and 'Add the exam date' in await pg.inner_text('#view'), 'parent plan asks for the exam date when missing')
        check('Starting test:' in await pg.inner_text('#view'), 'parent view shows the starting-test baseline')
        await pg.goto(URL + '#home'); await pg.wait_for_timeout(150)
        check('exam date' in (await pg.inner_text('.weekplan')).lower(), 'home week card asks for a date')

        today = datetime.date.today()
        def plus(days): return (today + datetime.timedelta(days=days)).isoformat()
        scen = {'far': plus(305), 'medium': plus(91), 'close': plus(21), 'past': plus(-10)}
        # set the first date through the parent view's date box
        await unlock_parent(pg)
        await pg.fill('#planexam', scen['far']); await pg.dispatch_event('#planexam', 'change'); await pg.wait_for_timeout(250)
        s = await state(pg); check(s['settings'].get('examDate') == scen['far'], 'exam date can be entered on the plan')

        for name, d in scen.items():
            await set_exam(pg, d)
            home = await pg.inner_text('.weekplan')
            nitems = await pg.locator('.weekplan .plan li').count()
            await unlock_parent(pg)
            view = await pg.inner_text('#view')
            if name == 'past':
                check('has passed' in view and await pg.locator('#planexam').count() >= 1, 'past date: plan says so and asks for a new date')
                check(3 <= nitems <= 5, f'past date: home still lists {nitems} items')
                continue
            rows = await pg.locator('.plantable tbody tr').count()
            phases = await pg.locator('.phasebar > div').all_inner_texts()
            cur = await pg.inner_text('.plantable tr.curweek')
            print(f'  {name}: {rows} weeks, phases {[x.replace(chr(10), " ") for x in phases]}, now: {cur[:90]!r}')
            check(3 <= nitems <= 5, f'{name}: home This week has {nitems} items')
            check(await pg.locator('.plancard .plan li').count() >= 3, f'{name}: parent plan lists this week')
            if name == 'far':
                check(40 <= rows <= 46 and len(phases) == 4 and 'Foundations' in phases[0], f'far: ~44 weeks with all four phases')
                found = [await pg.locator('.plantable tbody tr').nth(i).inner_text() for i in range(rows)]
                ft = ', '.join(r.split('\t')[3] for r in found if 'Foundations' in r)
                allt = await pg.evaluate("[].concat(...['maths','english','vr','nvr'].map(s => window.BANK[s].topics.filter(t => !t.extra).map(t => t.name)))")
                miss = [t for t in allt if t not in ft]
                check(not miss, f'far: every topic appears in Foundations (missing {miss[:4]})')
                check('Foundations' in home or 'Learning every topic' in home, 'far: home says this is the learning phase')
                await pg.screenshot(path=f'{SHOTS}/parent_plan_far.png', full_page=True)
            if name == 'medium':
                check(11 <= rows <= 15 and len(phases) == 4, f'medium: ~13 weeks with four phases')
                await pg.screenshot(path=f'{SHOTS}/parent_plan_medium.png', full_page=True)
            if name == 'close':
                check(3 <= rows <= 5 and not any('Foundations' in x for x in phases), f'close: {rows} weeks, no Foundations')
                check('not time to learn every topic' in view, 'close: plan explains the short time')
                check('Weakest' in view or len(cur.split('\t')[3]) > 2, 'close: current week has focus topics')
                await pg.screenshot(path=f'{SHOTS}/parent_plan_close.png', full_page=True)

        # ---- 3. Go buttons start activities and items get ticked
        # close date: Build week -> Quiz items, weak-spot test, 10-minute test
        await set_exam(pg, scen['close'])
        lis = pg.locator('.weekplan .plan li')
        labels = await lis.all_inner_texts()
        print('  close items:', [l.split('\n')[0] for l in labels])
        qi = next((i for i, l in enumerate(labels) if l.startswith('Quiz')), None)
        check(qi is not None, 'close: a quiz item is offered')
        if qi is not None:
            await lis.nth(qi).locator('button').click(); await pg.wait_for_timeout(200)
            check('#session' in pg.url and 'Quiz' in await pg.inner_text('.sess-head .pill'), 'Go on a quiz item starts that quiz')
            await run_feedback_session(pg); await closepop(pg)
            await pg.goto(URL + '#home'); await pg.wait_for_timeout(200)
            check('done' in await pg.locator('.weekplan .plan li').nth(qi).locator('.tick').get_attribute('class'), 'quiz item ticked after doing the quiz')
        ti = next((i for i, l in enumerate(labels) if '10-minute' in l), None)
        if ti is not None:
            await pg.locator('.weekplan .plan li').nth(ti).locator('button').click(); await pg.wait_for_timeout(200)
            check('#session' in pg.url and await pg.locator('#clock').count() == 1, 'Go on the 10-minute test starts a timed test')
            for _ in range(40):
                await pg.locator('#qcard .opt').first.click()
                if await pg.locator('.row button[data-act=next]').count(): await pg.click('.row button[data-act=next]')
                else: break
            await pg.click('.sess-head button[data-act=finish]'); await pg.wait_for_timeout(200)
            if '#session' in pg.url: await pg.click('.sess-head button[data-act=finish]'); await pg.wait_for_timeout(200)
            await closepop(pg)
            await pg.goto(URL + '#home'); await pg.wait_for_timeout(200)
            check('done' in await pg.locator('.weekplan .plan li').nth(ti).locator('.tick').get_attribute('class'), '10-minute test item ticked after the test')
        wi = next((i for i, l in enumerate(labels) if 'weak-spot' in l), None)
        if wi is not None:
            await pg.locator('.weekplan .plan li').nth(wi).locator('button').click(); await pg.wait_for_timeout(200)
            check('#session' in pg.url and 'Weak' in await pg.inner_text('.sess-head'), 'Go on the weak-spot item starts a weak-spot test')
            await pg.goto(URL + '#home'); await pg.click('button[data-act=endsession]'); await pg.wait_for_timeout(200); await closepop(pg)

        # medium/far date: Foundations week -> Learn items open lessons and tick after an exercise
        await set_exam(pg, scen['far'])
        lis = pg.locator('.weekplan .plan li'); labels = await lis.all_inner_texts()
        print('  far items:', [l.split('\n')[0] for l in labels])
        li = next((i for i, l in enumerate(labels) if l.startswith('Learn')), None)
        check(li is not None, 'far: Learn items offered')
        if li is not None:
            await lis.nth(li).locator('a').click(); await pg.wait_for_timeout(200)
            check('#lesson/' in pg.url, 'Go on a Learn item opens the lesson')
            await pg.click('button.big[data-act=exercise]'); await pg.wait_for_timeout(200)
            await run_feedback_session(pg, limit=12); await closepop(pg)
            await pg.goto(URL + '#home'); await pg.wait_for_timeout(200)
            check('done' in await pg.locator('.weekplan .plan li').nth(li).locator('.tick').get_attribute('class'), 'Learn item ticked after the exercise')
            await pg.screenshot(path=f'{SHOTS}/home_plan.png', full_page=True)

        # exam-practice phase items (set a date ~10 weeks away, forcing a plan made 6 weeks ago)
        await set_exam(pg, plus(30))
        await pg.evaluate(f"() => {{ const o = JSON.parse(localStorage.getItem('{KEY}')); o.planBase.start = (() => {{ const d = new Date(o.planBase.start + 'T12:00:00'); d.setDate(d.getDate() - 70); return d.toISOString().slice(0, 10); }})(); localStorage.setItem('{KEY}', JSON.stringify(o)); }}")
        await pg.reload(); await pg.wait_for_function("document.querySelector('#view') && document.querySelector('#view').children.length > 0", timeout=15000); await pg.wait_for_timeout(300); await pg.add_style_tag(content='#pop{display:none!important}')
        labels = await pg.locator('.weekplan .plan li').all_inner_texts()
        print('  exam-phase items:', [l.split('\n')[0] for l in labels], (await pg.inner_text('.weekplan p.small'))[:80])
        check(any('mock' in l.lower() for l in labels) and any('Fix my mistakes' in l for l in labels), 'exam practice week offers a mock and Fix my mistakes')
        mi = next((i for i, l in enumerate(labels) if 'Full mock' in l), None)
        if mi is not None:
            await pg.locator('.weekplan .plan li').nth(mi).locator('button').click(); await pg.wait_for_timeout(300)
            check('#session' in pg.url and (await pg.locator('#clock').count() == 1 or await pg.locator('button[data-act=warmdone]').count() >= 1), 'Go on the mock item starts the mock exam (clock or practice warm-up)')
            await pg.goto(URL + '#home'); await pg.click('button[data-act=endsession]'); await pg.wait_for_timeout(200); await closepop(pg)
        await unlock_parent(pg); await pg.screenshot(path=f'{SHOTS}/parent_plan_exam.png', full_page=True)

        # plan is deterministic for the same state and date
        await set_exam(pg, scen['medium'])
        a1 = await pg.inner_text('.weekplan'); await pg.reload(); await pg.wait_for_function("document.querySelector('#view') && document.querySelector('#view').children.length > 0", timeout=15000); await pg.wait_for_timeout(300)
        a2 = await pg.inner_text('.weekplan')
        check(a1 == a2, 'home plan is the same after a reload')
        await pg.screenshot(path=f'{SHOTS}/home_medium.png', full_page=True)
        # retake link in settings
        await pg.goto(URL + '#settings'); await pg.wait_for_timeout(150)
        check(await pg.locator('a[href="#placement"]').count() == 1, 'settings has the Retake starting test link')
        await pg.click('a[href="#placement"]'); await pg.wait_for_timeout(150)
        check('Take it again' in await pg.inner_text('#view'), 'retake page offers a new starting test')
        # print layout of the parent plan
        await unlock_parent(pg); await pg.emulate_media(media='print'); await pg.screenshot(path=f'{SHOTS}/parent_plan_print.png', full_page=True); await pg.emulate_media(media='screen')

        check(not errs, f'no page errors {errs[:3]}')
        await b.close()
    print('\nFAILURES:', fails if fails else 'none')
    return fails

import sys
sys.exit(1 if asyncio.run(main()) else 0)
