"""AI questions with a fake Anthropic API: the key is saved only on the device (never in progress or backups),
badly formed AI questions are dropped, AI exercises and an AI mock paper start, and review survives a reload."""
import asyncio, json, re
from playwright.async_api import async_playwright
from helpers import URL, launch_args, device, closepop, Checks

def fake_reply(body):
    if body is None: return {'data': [{'id': 'claude-sonnet-5-5', 'display_name': 'Claude Sonnet 5.5', 'max_tokens': 128000}]}
    req = json.loads(body); prompt = req['messages'][0]['content']
    m = re.search(r'Write (\d+) multiple-choice', prompt); n = int(m.group(1)) if m else 10
    qs = []
    for i in range(n):
        a = i % 5; opts = [str(10 + i * 5 + k) for k in range(5)]
        qs.append({'q': f'What is {10 + i * 5 + a - 3} + 3?', 'opts': opts, 'a': a, 'hint': 'Add the ones.', 'steps': ['Add 3.', f'The answer is {opts[a]}.'], 'd': 1 + i % 3, 'topic': 'four_ops'})
    qs.append({'q': 'broken', 'opts': ['1', '1', '2', '3', '4'], 'a': 0, 'hint': '', 'steps': ['x']})               # duplicate options: dropped
    qs.append({'q': 'mismatch', 'opts': ['1', '2', '3', '4', '5'], 'a': 0, 'hint': '', 'steps': ['The answer is 3.']})  # answer mismatch: dropped
    out = {'questions': qs}
    if 'First write an original' in prompt: out['passage'] = {'title': 'The Lost Kite', 'kind': 'story', 'text': 'Mia ran up the hill.\n\nThe kite flew away.'}
    return {'content': [{'type': 'tool_use', 'name': 'save_questions', 'input': out}]}

async def main():
    C = Checks('ai')
    async with async_playwright() as p:
        b = await p.chromium.launch(**launch_args())
        pg = await device(b)
        calls = []
        async def handle(route):
            calls.append(route.request.headers.get('x-api-key'))
            await route.fulfill(status=200, content_type='application/json', body=json.dumps(fake_reply(route.request.post_data)))
        await pg.route('https://api.anthropic.com/**', handle)
        await pg.goto(URL); await pg.wait_for_timeout(400)
        if await pg.locator('#hello').count(): await pg.fill('#hello', 'Arjun'); await pg.click('form[data-submit=hello] button'); await pg.wait_for_timeout(200)
        await pg.goto(URL + '#topic/maths/fractions'); await pg.wait_for_timeout(200)
        await pg.click('button[data-act=challenge]'); await pg.wait_for_timeout(200)
        C.ok('Challenge' in await pg.inner_text('.sess-head .pill'), 'Challenge practice starts without AI')
        await pg.goto(URL + '#home'); await pg.wait_for_timeout(100)
        if await pg.locator('button[data-act=endsession]').count(): await pg.click('button[data-act=endsession]')
        await pg.goto(URL + '#parent'); await pg.fill('#pin1', '1234'); await pg.click('form[data-submit=setpin] button'); await pg.wait_for_timeout(200)
        await pg.fill('#aikey', 'sk-ant-test-1234567890'); await pg.click('form[data-submit=aisave] button[type=submit]'); await pg.wait_for_timeout(200)
        await pg.click('button[data-act=aitest]'); await pg.wait_for_timeout(800)
        C.ok(len(calls) >= 1 and calls[-1] == 'sk-ant-test-1234567890', 'the key test calls the AI company with the key')
        C.ok('sk-ant' not in (await pg.evaluate("localStorage.getItem('elevenplus.v1') || ''")), 'the key is not in the saved progress (or backups)')
        await pg.goto(URL + '#topic/maths/four_ops'); await pg.wait_for_timeout(200)
        await pg.click('button[data-act=aiex][data-l="2"]'); await pg.wait_for_timeout(1200)
        C.ok('#session' in pg.url and 'AI' in await pg.inner_text('.sess-head .pill'), 'an AI exercise starts')
        total = await pg.evaluate("(() => { const m = /of (\\d+)/.exec(document.querySelector('.qnum').innerText); return m ? +m[1] : 10; })()")
        aiq = await pg.evaluate("Object.values(JSON.parse(localStorage.getItem('elevenplus.v1')).aiq || {})")
        C.ok(aiq and all(q['q'] not in ('broken', 'mismatch') for q in aiq), f'badly formed AI questions are dropped ({len(aiq)} kept)')
        for i in range(total):
            await pg.click('.opt >> nth=0'); await pg.wait_for_timeout(40); await pg.click('#next'); await pg.wait_for_timeout(40)
        await closepop(pg, 800)
        C.ok('#history/' in pg.url and await pg.locator('details.rev').count() >= 1, 'the AI exercise result can be reviewed')
        C.ok(await pg.locator('button[data-act=again]').count() == 1, 'it offers a new set of questions')
        await pg.reload(); await pg.wait_for_timeout(500)
        C.ok(await pg.locator('details.rev').count() >= 1, 'review of AI questions survives a reload')
        await pg.goto(URL + '#tests'); await pg.wait_for_timeout(100)
        await pg.evaluate("document.querySelectorAll('details.fold').forEach(d => d.open = true)")
        await pg.click('button[data-act=aimock][data-kind=full]'); await pg.wait_for_timeout(1500)
        C.ok('#session' in pg.url and await pg.locator('.passage').count() >= 1, 'an AI mock paper with a reading passage starts')
        C.ok(pg.errs == [], f'no page errors {pg.errs[:3]}')
        await b.close()
    C.done()

asyncio.run(main())
