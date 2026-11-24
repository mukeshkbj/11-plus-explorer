# Speed drills: every drill type and option, keyboard and on-screen buttons, right and wrong answers,
# the timer running out, personal bests, trophies, leaving part-way. Mobile and desktop widths.
# Run: python3 tests/drills.py   (needs Playwright for Python and Chrome at /usr/bin/google-chrome)
import asyncio, json, os, re, sys
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = os.environ.get('APP_URL') or 'file://' + ROOT + '/index.html'
SHOTS = os.environ.get('SHOTS', '/tmp/11plus-shots')
AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
fails = []

def check(cond, msg):
    if not cond: fails.append(msg); print('FAIL', msg)

def num(s): return float(s.replace(',', '').replace('£', ''))
def out(x):
    if isinstance(x, str): return x
    x = round(x, 6)
    return str(int(x)) if x == int(x) else ('%g' % x)

def solve(t):
    """Works out the answer from the question text alone."""
    t = t.replace('−', '-').strip()
    m = re.match(r'^([\d,.]+)\s*×\s*([\d,.]+) =$', t)
    if m: return out(num(m[1]) * num(m[2]))
    m = re.match(r'^([\d,.]+)\s*÷\s*([\d,.]+) =$', t)
    if m: return out(num(m[1]) / num(m[2]))
    m = re.match(r'^([\d,.]+) \+ \? = ([\d,.]+)$', t)
    if m: return out(num(m[2]) - num(m[1]))
    m = re.match(r'^([\d,.]+) \+ ([\d,.]+) =$', t)
    if m: return out(num(m[1]) + num(m[2]))
    m = re.match(r'^([\d,.]+) - ([\d,.]+) =$', t)
    if m: return out(num(m[1]) - num(m[2]))
    m = re.match(r'^Double ([\d,.]+)$', t)
    if m: return out(2 * num(m[1]))
    m = re.match(r'^Half of ([\d,.]+)$', t)
    if m: return out(num(m[1]) / 2)
    m = re.match(r'^([\d.]+)% of (£?[\d,.]+)$', t)
    if m: return out(num(m[1]) * num(m[2]) / 100)
    m = re.match(r'^([A-Z]) is letter number…$', t)
    if m: return out(AZ.index(m[1]) + 1)
    m = re.match(r'^Letter number (\d+) is…$', t)
    if m: return AZ[int(m[1]) - 1]
    m = re.match(r'^(\d) letters? after ([A-Z])$', t)
    if m: return AZ[AZ.index(m[2]) + int(m[1])]
    m = re.match(r'^(\d) letters? before ([A-Z])$', t)
    if m: return AZ[AZ.index(m[2]) - int(m[1])]
    m = re.match(r'^Opposite \(mirror\) of ([A-Z])$', t)
    if m: return AZ[25 - AZ.index(m[1])]
    m = re.match(r'^(\d+)/(\d+) = \?%$', t)
    if m: return out(100 * int(m[1]) / int(m[2]))
    m = re.match(r'^(\d+)/(\d+) as a decimal$', t)
    if m: return out(int(m[1]) / int(m[2]))
    m = re.match(r'^([\d.]+) = \?%$', t)
    if m: return out(100 * num(m[1]))
    m = re.match(r'^([\d.]+)% as a decimal$', t)
    if m: return out(num(m[1]) / 100)
    raise ValueError('cannot read question: ' + t)

QTEXT = "() => { const el = document.querySelector('#dqt'); if (!el) return null; const c = el.cloneNode(true); c.querySelectorAll('.frac').forEach(f => { f.textContent = f.children[0].textContent + '/' + f.children[1].textContent; }); return c.textContent.replace(/\\s+/g, ' ').trim(); }"

async def run(b, w, h, tag):
    ctx = await b.new_context(viewport={'width': w, 'height': h}, has_touch=w < 500)
    await ctx.add_init_script("try { localStorage.setItem('elevenplus.guest', '1'); } catch (e) {}")
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'net::' not in m.text and 'Failed to load' not in m.text else None)
    await pg.goto(URL + '#home'); await pg.wait_for_selector('#view h1')
    await pg.add_style_tag(content='#pop{display:none!important}')
    st = lambda: pg.evaluate("JSON.parse(localStorage.getItem('elevenplus.v1') || '{}')")
    hist0 = len((await st()).get('history', []))

    # entry points: home card, Learn card, More list
    check(await pg.locator('#view a[href="#drills"]').count() >= 1, tag + ' home card')
    await pg.goto(URL + '#learn'); check(await pg.locator('#view a[href="#drills"]').count() == 1, tag + ' learn card')
    await pg.goto(URL + '#more'); check(await pg.locator('#view a[href="#drills"]').count() == 1, tag + ' more entry')
    await pg.click('#view a[href="#drills"]'); await pg.wait_for_selector('.dtype')
    check((await pg.inner_text('#view h1')).strip() == '⚡ Speed drills', tag + ' title')

    async def choose(t, s, d=60):
        await pg.goto(URL + '#drills'); await pg.wait_for_selector('.dtype')
        await pg.click(f'.dtype[data-t="{t}"]')
        await pg.click(f'[data-dr="sub"][data-s="{s}"]')
        await pg.click(f'[data-dr="dur"][data-d="{d}"]')

    async def answer(ans, via):
        if via == 'keys':
            if len(ans) == 1 and ans.isalpha(): await pg.keyboard.press(ans.lower())
            else: await pg.keyboard.type(ans); await pg.keyboard.press('Enter')
        else:
            for ch in ans: await pg.click(f'.dk[data-k="{ch}"]')
            if not (len(ans) == 1 and ans.isalpha()): await pg.click('.dk.go')

    def wrong_of(a):
        if a.isalpha(): return 'A' if a != 'A' else 'B'
        return out(num(a) + 1)

    async def drill(t, s, via, n_right, n_wrong, secs, d=60, shot=None):
        await choose(t, s, d)
        await pg.evaluate(f'window.DRILLS.setTestDuration({secs})')
        await pg.click('[data-dr="start"]'); await pg.wait_for_selector('#dqt')
        check(pg.url.endswith('#drills/run'), tag + ' run url')
        right = wrong = 0; seen = []
        total = n_right + n_wrong; wpos = set(list(range(1, total, max(2, total // max(1, n_wrong))))[:n_wrong])
        plan = ['w' if i in wpos else 'r' for i in range(total)]
        for kind in plan:
            if not await pg.locator('#dqt').count(): break
            q = await pg.evaluate(QTEXT); a = solve(q); seen.append(q)
            real = await pg.evaluate('window.DRILLS._state().q.a')
            check(a == real, f'{tag} answer from text {q!r}: {a} vs {real}')
            if kind == 'r': await answer(a, via); right += 1
            else: await answer(wrong_of(a), via); wrong += 1
            if shot and right == 4: await pg.screenshot(path=shot)
        await pg.wait_for_url('**#drills/done', timeout=(secs + 5) * 1000)
        await pg.wait_for_selector('.dres')
        tiles = await pg.locator('.dres .tile b').all_inner_texts()
        check(tiles[0] == str(right), f'{tag} {t}/{s} score tile {tiles[0]} != {right}')
        check(tiles[1] == f'{round(100 * right / (right + wrong)) if right + wrong else 0}%', f'{tag} {t}/{s} accuracy {tiles[1]}')
        rows = await pg.locator('.dwrong tbody tr').count()
        check(rows == wrong, f'{tag} {t}/{s} wrong list {rows} != {wrong}')
        return right, wrong, seen

    # every drill and option once, alternating keyboard and buttons, with some wrong answers
    TYPES = await pg.evaluate("Object.fromEntries([...document.querySelectorAll('.dtype')].map(b => [b.dataset.t, 1]))")
    subs = {'tables': ['mix', '7', '12'], 'mental': ['mix', 'add100', 'add1000', 'dbl', 'x10', 'pct'], 'alpha': ['mix', 'pos', 'let', 'shift', 'mirror'], 'bonds': ['mix', 'bond', 'fdp']}
    check(sorted(TYPES) == sorted(subs), tag + ' drill types ' + str(TYPES))
    i = 0
    for t, ss in subs.items():
        for s in ss:
            via = 'keys' if i % 2 == 0 else 'buttons'; i += 1
            shot = f'{SHOTS}/{tag}_run_{t}.png' if s == 'mix' and t in ('tables', 'alpha', 'bonds') else None
            r, wr, seen = await drill(t, s, via, 6, 2, 6 if via == 'buttons' else 4, shot=shot)
            data = (await st())['drills'][f'{t}-{s}-60']
            check(data['runs'][-1]['score'] == r and data['best'] >= r, f'{tag} saved {t}/{s}')
            if t == 'tables' and s == '7': check(all('7' in q for q in seen), f'{tag} 7x table only: {seen}')
            if t == 'alpha' and s == 'mix': await pg.screenshot(path=f'{SHOTS}/{tag}_results.png', full_page=True)
    s1 = await st()
    check('drill1' in s1['badges'] and 'drillall' in s1['badges'], tag + ' drill1/drillall trophies ' + str([k for k in s1['badges'] if k.startswith('drill')]))
    check(len(s1.get('history', [])) == hist0, tag + ' drills kept out of history')
    check(sum(s1.get('time', {}).values()) > 0, tag + ' minutes counted')
    check(not any(k.startswith('g') and 'drill' in k for k in s1.get('q', {})), tag + ' no drill questions in st.q')

    # personal best: a low score, then a higher one on the same drill
    await drill('tables', '3', 'keys', 2, 0, 3)
    r, _, _ = await drill('tables', '3', 'buttons', 5, 1, 6)
    s2 = await st(); d = s2['drills']['tables-3-60']
    check(d['best'] == 5 and len(d['runs']) == 2, f'{tag} PB stored {d}')
    check('drillpb' in s2['badges'], tag + ' PB trophy')
    check('🎉' in (await pg.locator('.dres .tile').nth(3).inner_text()), tag + ' PB shown')
    check(await pg.locator('.dbars > div').count() == 2, tag + ' recent chart bars')
    if tag == 'mobile': await pg.screenshot(path=f'{SHOTS}/{tag}_results_pb.png', full_page=True)

    # 30 right in a 60-second drill (timer shortened for the test, the drill still counts as one minute)
    await drill('tables', '2', 'keys', 31, 0, 25)
    check('drill30' in (await st())['badges'], tag + ' 30-right trophy')

    # the real timer is 60 s / 120 s by default
    await pg.evaluate('window.DRILLS.setTestDuration(null)')
    await choose('alpha', 'pos', 120); await pg.click('[data-dr="start"]'); await pg.wait_for_selector('#dsecs')
    secs = int(await pg.inner_text('#dsecs')); check(118 <= secs <= 120, f'{tag} 2-minute default {secs}')
    # leaving part-way: navigate away -> discarded, nothing saved, no errors
    q = await pg.evaluate(QTEXT); await answer(solve(q), 'keys')
    await pg.goto(URL + '#home'); await pg.wait_for_timeout(300)
    check(not await pg.evaluate('window.DRILLS.running()'), tag + ' discarded on leave')
    check('alpha-pos-120' not in (await st())['drills'], tag + ' nothing saved on leave')
    # the Stop button
    await choose('mental', 'mix'); await pg.click('[data-dr="start"]'); await pg.wait_for_selector('#dqt')
    secs = int(await pg.inner_text('#dsecs')); check(58 <= secs <= 60, f'{tag} 1-minute default {secs}')
    await pg.click('[data-dr="stop"]'); await pg.wait_for_timeout(200)
    check(pg.url.endswith('#drills') and not await pg.evaluate('window.DRILLS.running()'), tag + ' stop button')
    # the app being hidden part-way
    await pg.click('[data-dr="start"]'); await pg.wait_for_selector('#dqt')
    await pg.evaluate("Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange'))")
    await pg.wait_for_timeout(300)
    await pg.evaluate("Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange'))")
    check(not await pg.evaluate('window.DRILLS.running()') and pg.url.endswith('#drills'), tag + ' discarded when hidden')
    # back button mid drill, and a stale #drills/run or #drills/done link
    await pg.click('[data-dr="start"]'); await pg.wait_for_selector('#dqt')
    await pg.go_back(); await pg.wait_for_timeout(300)
    check(not await pg.evaluate('window.DRILLS.running()'), tag + ' back button')
    await pg.goto(URL + '#drills/run'); await pg.wait_for_timeout(300)
    check(pg.url.endswith('#drills'), tag + ' stale run link ' + pg.url)
    await pg.reload(); await pg.wait_for_function("document.querySelector('#view') && document.querySelector('#view').children.length > 0", timeout=15000); await pg.goto(URL + '#drills/done'); await pg.wait_for_timeout(300)
    check(pg.url.endswith('#drills'), tag + ' stale done link ' + pg.url)
    # bests table and trophy room
    await pg.wait_for_timeout(300); await pg.wait_for_selector('.dbest tr', state='attached')
    check(await pg.locator('.dbest tr').count() == 8, tag + ' bests table (8 most recent) %d' % await pg.locator('.dbest tr').count())
    await pg.goto(URL + '#trophies'); txt = await pg.inner_text('#view')
    check(all(n in txt for n in ['Quick off the mark', 'Lightning brain', 'Personal best', 'Drill explorer']), tag + ' trophies listed')
    # keyboard does nothing outside a drill
    await pg.goto(URL + '#drills'); await pg.keyboard.type('12'); await pg.keyboard.press('Enter')
    # the rest of the app still works
    for hsh in ['#home', '#learn', '#tests', '#revise', '#progress', '#history', '#settings', '#more']:
        await pg.goto(URL + hsh); await pg.wait_for_selector('#view h1')
    if tag == 'mobile':
        await pg.goto(URL + '#drills'); await pg.wait_for_selector('.dtype'); await pg.screenshot(path=f'{SHOTS}/{tag}_setup.png', full_page=True)
    check(not errs, tag + ' page errors: ' + str(errs[:5]))
    print(tag, 'done, errors:', errs[:3])
    await ctx.close()

async def main():
    os.makedirs(SHOTS, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(**({'executable_path': os.environ.get('CHROME', '/usr/bin/google-chrome')} if os.path.exists(os.environ.get('CHROME', '/usr/bin/google-chrome')) else {}))
        await run(b, 390, 844, 'mobile')
        await run(b, 1200, 900, 'desktop')
        await b.close()
    print('FAILURES:', len(fails))
    for f in fails: print(' -', f)
    sys.exit(1 if fails else 0)

asyncio.run(main())
