"""Shared helpers for the Playwright smoke tests. Paths are relative to the repo root.
CHROME=/path/to/chrome picks the browser; when it is unset (or missing) Playwright's own Chromium is used."""
import os, sys, json, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
TESTS = ROOT / 'tests'
URL = os.environ.get('APP_URL') or (ROOT / 'index.html').as_uri()   # run_all.sh serves the app over http: Chrome sometimes drops file:// storage on reload
FAKE = TESTS / 'fake-firebase'
sys.path.insert(0, str(FAKE))

def launch_args():
    c = os.environ.get('CHROME', '/usr/bin/google-chrome')
    return {'executable_path': c} if c and os.path.exists(c) else {}

HIDE_POP = "document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '#pop{display:none!important}'; document.head.appendChild(s); });"
GUEST = "try { if (!localStorage.getItem('elevenplus.guest')) localStorage.setItem('elevenplus.guest', '1'); } catch (e) {}"

async def device(browser, guest=True, viewport=(1100, 900)):
    """A new browser profile (its own localStorage). Firebase is served by the fake modules, nothing goes to the internet.
    guest=True skips the sign-in page ("Use without an account")."""
    ctx = await browser.new_context(viewport={'width': viewport[0], 'height': viewport[1]})
    async def fake(route):
        u = route.request.url; m = 'app' if 'firebase-app' in u else 'auth' if 'firebase-auth' in u else 'firestore'
        await route.fulfill(status=200, content_type='application/javascript', body=(FAKE / f'{m}.js').read_text(), headers={'Access-Control-Allow-Origin': '*'})
    async def offline(route):
        u = route.request.url
        if u.startswith('file:') or u.startswith('data:') or u.startswith('http://127.0.0.1'): await route.continue_()
        else: await route.abort()
    await ctx.route('**/*', offline)   # nothing leaves the machine (registered first, so the routes below win)
    await ctx.route('https://www.gstatic.com/**', fake)
    await ctx.add_init_script(HIDE_POP)
    if guest: await ctx.add_init_script(GUEST)
    pg = await ctx.new_page(); pg.errs = []
    pg.on('pageerror', lambda e: pg.errs.append(str(e)))
    return pg

async def closepop(pg, wait=300):
    await pg.wait_for_timeout(wait)
    for _ in range(3):
        if await pg.query_selector('#pop'): await pg.keyboard.press('Escape'); await pg.wait_for_timeout(60)

async def state(pg, key='elevenplus.v1'):
    return await pg.evaluate(f"JSON.parse(localStorage.getItem({json.dumps(key)}) || 'null')")

class Checks:
    """Collects failures so one run reports all of them; exit code 1 if any failed."""
    def __init__(self, name): self.name, self.fails, self.n = name, [], 0
    def ok(self, cond, what):
        self.n += 1
        print(('  ok   ' if cond else '  FAIL ') + what, flush=True)
        if not cond: self.fails.append(what)
    def done(self):
        print(f'{self.name}: {self.n - len(self.fails)}/{self.n} checks passed', flush=True)
        sys.exit(1 if self.fails else 0)
