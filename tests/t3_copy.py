import asyncio
from playwright.async_api import async_playwright
URL='file:///home/claude/wt-plan/index.html'
async def closepop(pg):
    await pg.wait_for_timeout(700)
    if await pg.query_selector('#pop'): await pg.keyboard.press('Escape'); await pg.wait_for_timeout(100)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome'); pg = await b.new_page(viewport={'width':1200,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(URL); await pg.evaluate("localStorage.setItem('elevenplus.guest','1')"); await pg.goto(URL+'#home'); await pg.reload()
        await pg.goto(URL); await pg.wait_for_timeout(900)
        await pg.screenshot(path='/home/claude/shots_agentB/u_home0.png', full_page=True)
        # set name
        await pg.goto(URL+'#settings'); await pg.fill('#kidname','Arjun'); await pg.press('#kidname','Tab'); await pg.wait_for_timeout(100)
        # exercise: answer a few
        await pg.goto(URL+'#topic/maths/fractions'); await pg.click('button[data-act=exercise]'); await pg.wait_for_timeout(200)
        for i in range(10):
            qid = await pg.get_attribute('#qcard','data-qid')
            ans = await pg.evaluate(f"() => {{ const q = window.BANK.maths.questions.find(x=>x.id=='{qid}'); return q.opts[q.a]; }}")
            opts = [''.join(c for c in o.split('\n',1)[-1] if c.isalnum()) for o in await pg.locator('.opt').all_inner_texts()]
            await pg.click(f'.opt >> nth={opts.index(''.join(c for c in ans if c.isalnum())) if i!=3 else (opts.index(''.join(c for c in ans if c.isalnum()))+1)%5}')
            await pg.wait_for_timeout(120)
            if i==2: await pg.screenshot(path='/home/claude/shots_agentB/u_right.png')
            if i==3: await pg.screenshot(path='/home/claude/shots_agentB/u_wrong.png')
            await pg.click('#next')
        await pg.wait_for_timeout(900)
        await pg.screenshot(path='/home/claude/shots_agentB/u_award.png')
        await closepop(pg)
        await pg.screenshot(path='/home/claude/shots_agentB/u_result.png')
        # quiz fully right to earn topic star
        await pg.goto(URL+'#topic/maths/fractions'); await pg.click('button[data-act=quiz]'); await pg.wait_for_timeout(200)
        for i in range(10):
            qid = await pg.get_attribute('#qcard','data-qid')
            ans = await pg.evaluate(f"() => {{ const q = window.BANK.maths.questions.find(x=>x.id=='{qid}'); return q.opts[q.a]; }}")
            opts = [''.join(c for c in o.split('\n',1)[-1] if c.isalnum()) for o in await pg.locator('.opt').all_inner_texts()]
            await pg.click(f'.opt >> nth={opts.index(''.join(c for c in ans if c.isalnum()))}'); await pg.click('#next')
        await closepop(pg)
        await pg.goto(URL+'#home'); await pg.wait_for_timeout(1300); await pg.screenshot(path='/home/claude/shots_agentB/u_home.png', full_page=True)
        await pg.goto(URL+'#learn/maths'); await pg.wait_for_timeout(300); await pg.screenshot(path='/home/claude/shots_agentB/u_subject.png')
        await pg.goto(URL+'#learn'); await pg.wait_for_timeout(300); await pg.screenshot(path='/home/claude/shots_agentB/u_learn.png')
        await pg.goto(URL+'#trophies'); await pg.wait_for_timeout(300); await pg.screenshot(path='/home/claude/shots_agentB/u_trophies.png', full_page=True)
        await pg.goto(URL+'#cert/'+'t%3Amaths%2Ffractions'); await pg.wait_for_timeout(2500); await pg.screenshot(path='/home/claude/shots_agentB/u_cert.png')
        # timed test still works
        await pg.goto(URL+'#tests'); await pg.click('button[data-act=test][data-sid=vr]'); await pg.wait_for_timeout(200)
        for i in range(10):
            await pg.click('.opt >> nth=0')
            if i<9: await pg.click('.row button[data-act=next]')
        await pg.click('.sess-head button[data-act=finish]'); await closepop(pg)
        print('timed ->', pg.url.split('#')[1])
        print('awards', await pg.evaluate("() => Object.keys(JSON.parse(localStorage.getItem('elevenplus.v1')).badges)"))
        print('errors', errs)
        await b.close()
asyncio.run(main())
