# Teste: dica só aparece com o mouse parado (1,2 s nas páginas, 5 s no menu principal; no menu também segurando o botão esquerdo).
# Rodar a partir da pasta do site:  python3 tests/teste_dica_mouse.py
import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT=8837
srv=subprocess.Popen(["python3","-m","http.server",str(PORT),"-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':1300,'height':900}); errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.goto(f"http://localhost:{PORT}/index.html"); await pg.wait_for_timeout(1200)
        tip=pg.locator('#pr-aj-tip')
        vis=lambda: tip.evaluate("e=>!e.hidden")
        # menu: parar sobre itens do menu não mostra dica
        for sel in ['nav > .nav-dropdown > a[href="o-parque.html"]','nav > .nav-dropdown > a[href="silo.html"]']:
            await pg.hover(sel); await pg.wait_for_timeout(3000)
            ok(not await vis(),f"menu: sem caixinha com 3 s parado ({sel})")
            await pg.wait_for_timeout(2500)
            ok(await vis(),f"menu: caixinha aparece depois de 5 s parado ({sel})")
            await pg.mouse.move(5,890); await pg.wait_for_timeout(400)
        await pg.hover('nav > .nav-dropdown > a[href="silo.html"]'); await pg.hover('nav a[href="biblioteca-silo.html"]'); await pg.wait_for_timeout(5600)
        ok(await vis(),"submenu: caixinha depois de 5 s parado")
        await pg.mouse.move(5,890); await pg.wait_for_timeout(400)
        # segurar o botão esquerdo sobre um item do menu mostra a caixinha e não abre a página
        await pg.mouse.move(5,890); await pg.wait_for_timeout(300)
        m=pg.locator('nav > .nav-dropdown > a[href="o-parque.html"]'); bb=await m.bounding_box()
        await pg.mouse.move(bb['x']+bb['width']/2,bb['y']+bb['height']/2); await pg.mouse.down(); await pg.wait_for_timeout(800)
        ok(await vis(),"segurar o botão esquerdo no menu mostra a caixinha")
        await pg.mouse.up(); await pg.wait_for_timeout(500)
        ok(pg.url.endswith('index.html'),"soltar depois de segurar não abre a página")
        await pg.mouse.move(5,890); await pg.wait_for_timeout(400)
        await pg.click('nav > .nav-dropdown > a[href="o-parque.html"]'); await pg.wait_for_timeout(600)
        ok(pg.url.endswith('o-parque.html'),"clique normal no menu continua abrindo a página")
        await pg.goto(f"http://localhost:{PORT}/index.html"); await pg.wait_for_timeout(1200)
        alvo=pg.locator('main .pr-aj-tem:visible, .container .pr-aj-tem:visible, section .pr-aj-tem:visible').first
        await alvo.scroll_into_view_if_needed(); bx=await alvo.bounding_box()
        x,y=bx['x']+bx['width']/2,bx['y']+bx['height']/2
        await pg.mouse.move(x-3,y); await pg.wait_for_timeout(600)
        ok(not await vis(),"não aparece antes de 1,2 s")
        # mexendo o mouse sobre o item, a contagem recomeça
        for i in range(6):
            await pg.mouse.move(x+(i%2)*4-2,y); await pg.wait_for_timeout(300)
        ok(not await vis(),"não aparece enquanto o mouse se mexe")
        await pg.wait_for_timeout(1500)
        ok(await vis(),"aparece quando o mouse para sobre o item")
        await pg.mouse.move(5,890); await pg.wait_for_timeout(500)
        ok(not await vis(),"some ao tirar o mouse")
        ok(not errs,"sem erros de JavaScript "+str(errs))
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
