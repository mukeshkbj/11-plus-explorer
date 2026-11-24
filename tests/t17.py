# Copy of /home/claude/t17.py for this worktree (guest mode added so the sign-in page is skipped).
# Every topic in every subject: lesson page, an exercise (answer 3 questions), and the quiz start. Then every mock and the Tests page.
import asyncio, json, time
from playwright.async_api import async_playwright
URL='file:///home/claude/wt-mocks/index.html'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        ctx=await b.new_context(viewport={'width':1100,'height':900}); await ctx.add_init_script("localStorage.setItem('elevenplus.guest','1')"); pg=await ctx.new_page(); errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        t0=time.time(); await pg.goto(URL); await pg.wait_for_selector('#view h1'); print('load %.2fs'%(time.time()-t0)); await pg.add_style_tag(content='#pop{display:none!important}')
        topics = await pg.evaluate("Object.fromEntries(['maths','english','vr','nvr'].map(s=>[s, window.BANK[s].topics.filter(t=>!t.extra).map(t=>t.id)]))")
        counts = await pg.evaluate("Object.fromEntries(['maths','english','vr','nvr'].map(s=>[s, window.BANK[s].questions.length]))"); print('pool sizes', counts)
        async def cp():
            for _ in range(3):
                if await pg.query_selector('#pop'): await pg.keyboard.press('Escape'); await pg.wait_for_timeout(60)
        bad=[]
        for sid, ts in topics.items():
            for tid in ts:
                await pg.goto(URL+f'#lesson/{sid}/{tid}'); await pg.wait_for_timeout(60)
                if await pg.query_selector('#pop'): await pg.keyboard.press('Escape')
                if not await pg.locator('.box.method').count(): bad.append(('no method', sid, tid))
                await pg.goto(URL+f'#topic/{sid}/{tid}'); await pg.wait_for_timeout(60)
                btn = pg.locator('button[data-act=exercise]').first
                if not await btn.count(): bad.append(('no exercise btn', sid, tid)); continue
                await cp(); await btn.click(); await pg.wait_for_timeout(120)
                for k in range(3):
                    if not await pg.locator('.opt').count(): bad.append(('no options', sid, tid)); break
                    await cp(); await pg.locator('.opt').first.click(); await pg.wait_for_timeout(40)
                    nx = pg.locator('#next')
                    await cp()
                    if await nx.count(): await nx.click(); await pg.wait_for_timeout(40)
                await pg.goto(URL+'#home'); await pg.wait_for_timeout(40)
                await cp()
                if await pg.locator('button[data-act=endsession]').count(): await pg.locator('button[data-act=endsession]').click(); await pg.wait_for_timeout(80)
                if await pg.query_selector('#pop'): await pg.keyboard.press('Escape')
        print('topics checked', sum(len(v) for v in topics.values()), 'problems', bad)
        for k in ['english','maths','reasoning','full']:
            await pg.goto(URL+'#tests'); await pg.wait_for_timeout(80)
            await pg.evaluate("document.querySelectorAll('details.fold').forEach(d=>d.open=true)")
            await cp(); await pg.click(f'button[data-act=mock][data-kind="{k}"]'); await pg.wait_for_timeout(250)
            print('mock', k, await pg.inner_text('.qnum'))
            await pg.goto(URL+'#home'); await cp(); await pg.click('button[data-act=endsession]'); await pg.wait_for_timeout(200)
            if await pg.query_selector('#pop'): await pg.keyboard.press('Escape')
        print('errors', errs[:5])
        await b.close()
asyncio.run(main())
