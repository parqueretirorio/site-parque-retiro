# Teste: menu Notícias (Blog + CONecta Retiro), página Notícias e página CONecta Retiro.
# Rodar a partir da pasta do site:  python3 tests/teste_noticias.py
import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT=8845
srv=subprocess.Popen(["python3","-m","http.server",str(PORT),"-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
OUT=os.environ.get('SHOTS','/tmp'); U=f"http://localhost:{PORT}/"
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':1280,'height':900}); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.goto(U+"index.html")
        ok(await pg.locator('nav a[href="noticias.html"]').count()==1,"menu tem Notícias")
        ok(await pg.locator('nav .nav-sub a[href="blogger.html"]').count()==1 and await pg.locator('nav .nav-sub a[href="noticias-conecta.html"]').count()==1,"Notícias tem Blog e CONecta Retiro")
        ok(await pg.locator('nav > a[href="blogger.html"]').count()==0,"Blog saiu do primeiro nível do menu")
        await pg.goto(U+"noticias.html"); await pg.wait_for_timeout(300)
        t=await pg.inner_text('#nc-destaque')
        ok('casa digital' in t and 'Ler a notícia completa' in t,"Notícias mostra o lide e o botão")
        await pg.screenshot(path=OUT+'/noticias.png',full_page=True)
        await pg.click('#nc-destaque a.btn-visit'); await pg.wait_for_timeout(400)
        ok('noticias-conecta.html' in pg.url and await pg.is_visible('#completa'),"botão abre a notícia completa")
        await pg.goto(U+"noticias-conecta.html"); await pg.wait_for_timeout(300)
        ok(not await pg.is_visible('#completa'),"página abre só com o lide")
        ok('próximas semanas' in await pg.inner_text('#nc-anteriores'),"lista lateral avisa que ainda não há anteriores")
        await pg.click('#nc-ler'); await pg.wait_for_timeout(300)
        ok(await pg.is_visible('#completa') and 'quintas-feiras' in await pg.inner_text('#completa'),"Ler a notícia completa abre o texto")
        await pg.screenshot(path=OUT+'/noticias-conecta.png',full_page=True)
        # simula a notícia da próxima quinta: a de hoje vai para Alterações anteriores, só com a data
        await pg.add_init_script("window.__extra=1")
        await pg.route("**/noticias-conecta.js", lambda r: r.continue_())
        await pg.evaluate("""()=>{}""")
        js=open(os.path.join(SITE,'noticias-conecta.js'),encoding='utf-8').read()
        js2=js.replace("window.PR_NOTICIAS_CONECTA = [","window.PR_NOTICIAS_CONECTA = [{id:'2026-11-19',data:'2026-11-19',pt:{titulo:'Novos ajustes',lide:'Lide da semana.',corpo:[{p:'Texto.'}]}},",1)
        await pg.route("**/noticias-conecta.js", lambda r: r.fulfill(body=js2, content_type="application/javascript"))
        await pg.goto(U+"noticias-conecta.html"); await pg.wait_for_timeout(300)
        ok('Novos ajustes' in await pg.inner_text('#nc-artigo'),"a mais nova fica em destaque")
        lat=await pg.inner_text('#nc-anteriores')
        ok('12 de novembro de 2026' in lat and 'casa digital' not in lat,"a anterior aparece na lateral só com a data")
        await pg.click("#nc-anteriores a"); await pg.wait_for_load_state(); await pg.wait_for_timeout(500)
        ok('casa digital' in await pg.inner_text('#nc-artigo') and 'mais recente' in await pg.inner_text('#nc-artigo'),"clicar na data abre a anterior, com volta para a mais recente")
        await pg.unroute("**/noticias-conecta.js")
        # espanhol
        await pg.goto(U+"noticias-conecta.html?lang=es"); await pg.wait_for_timeout(800)
        t=await pg.inner_text('#nc-artigo')
        ok('casa digital propia' in t and 'Leer la noticia completa' in t,"versão em espanhol ("+t[-40:].strip()+")")
        ok('12 de noviembre de 2026' in t.lower(),"data em espanhol")
        ok('Cambios anteriores' in await pg.inner_text('#nc-anteriores'),"lateral em espanhol")
        await pg.screenshot(path=OUT+'/noticias-conecta-es.png',full_page=True)
        m=await b.new_context(viewport={'width':390,'height':800}); mp=await m.new_page(); await mp.goto(U+"noticias-conecta.html?lang=pt"); await mp.wait_for_timeout(400)
        await mp.screenshot(path=OUT+'/noticias-conecta-cel.png',full_page=True)
        ok(not errs,"sem erros de JavaScript "+str(errs))
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
