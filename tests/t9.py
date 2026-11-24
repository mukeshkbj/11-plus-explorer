# Copy of /home/claude/t9.py for this worktree (guest mode added so the sign-in page is skipped).
import asyncio
from playwright.async_api import async_playwright
URL='file:///home/claude/wt-mocks/index.html'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome'); ctx=await b.new_context(viewport={'width':1100,'height':900}); await ctx.add_init_script("localStorage.setItem('elevenplus.guest','1')"); pg=await ctx.new_page()
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(500)
        counts = await pg.evaluate("Object.fromEntries(['maths','english','vr','nvr'].map(s=>[s,window.BANK[s].questions.length]))"); print('bank', counts)
        bad=0
        for sid in ['maths','english','vr','nvr']:
            tids = await pg.evaluate(f"window.BANK.{sid}.topics.map(t=>t.id)")
            for t in tids:
                await pg.goto(URL+f'#lesson/{sid}/{t}'); await pg.wait_for_timeout(60)
                if await pg.query_selector('#pop'): await pg.keyboard.press('Escape')
                ok = await pg.locator('.box.method').count() and await pg.locator('#tryone').count()
                if not ok: bad+=1; print('missing on', sid, t)
        print('lessons checked, problems:', bad)
        await pg.goto(URL+'#lesson/maths/percentages'); await pg.wait_for_timeout(300)
        if await pg.query_selector('#pop'): await pg.keyboard.press('Escape')
        await pg.screenshot(path='/home/claude/shots_agentA/m_lesson.png', full_page=True)
        # mock exams all build
        for k in ['english','maths','reasoning','full']:
            await pg.goto(URL+'#tests'); await pg.wait_for_timeout(100)
            await pg.click('[data-fold=t-mock] > summary') if not await pg.locator('button[data-act=mock][data-kind="%s"]' % k).is_visible() else None
            await pg.click('button[data-act=mock][data-kind="%s"]' % k); await pg.wait_for_timeout(300)
            print('mock', k, await pg.inner_text('.qnum'))
            await pg.goto(URL+'#home'); await pg.click('button[data-act=endsession]'); await pg.wait_for_timeout(300)
            if await pg.query_selector('#pop'): await pg.keyboard.press('Escape')
        print('errors', errs)
        await b.close()
asyncio.run(main())
