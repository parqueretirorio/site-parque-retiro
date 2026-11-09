# Teste: Produções de Escola: menu flutuante de Parques e catálogo de cada Parque.
# Rodar a partir da pasta do site:  python3 tests/teste_producoes_escola.py
import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT=8836
srv=subprocess.Popen(["python3","-m","http.server",str(PORT),"-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
U=f"http://localhost:{PORT}/producoes-de-escola.html"
OUT=os.environ.get('SHOTS','/tmp')
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':1300,'height':900}); errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.goto(U); await pg.wait_for_timeout(400)
        ok(await pg.locator('#prod-busca').count()==0,"sem caixa de busca")
        ok(await pg.locator('#prod-parques .prod-op').count()==19,"menu: Repetidas + 18 Parques")
        ok(await pg.evaluate("getComputedStyle(document.getElementById('prod-parques')).position")=='sticky',"no computador o menu acompanha a rolagem")
        total=await pg.evaluate("PR_PRODUCOES.repetidas.length")
        ok(await pg.locator('#prod-area .prod-item').count()==total,"abre mostrando as repetidas")
        await pg.click('.prod-op[data-ir=pdv]'); await pg.wait_for_timeout(500)
        n=await pg.evaluate("PR_PRODUCOES_CATALOGO.pdv.length")
        ok(await pg.locator('#prod-area .prod-lista-parque .prod-item').count()==n,f"Punta de Vacas mostra todas as {n} produções")
        ok(await pg.locator('#prod-area .prod-lista-parque .prod-selo').count()>50,"marca as que se repetem")
        ok('#parque=pdv' in pg.url,"endereço guarda o Parque escolhido")
        ok(await pg.locator('#prod-area .prod-links-parque a').count()==1,"botão para a página do Parque")
        await pg.screenshot(path=OUT+'/prod-parque.png')
        await pg.click('#prod-area a[data-ir=lbi] >> nth=0'); await pg.wait_for_timeout(400)
        ok('#parque=lbi' in pg.url and await pg.locator('.prod-op.ativo[data-ir=lbi]').count()==1,"tocar no nome de outro Parque leva a ele")
        ok('outros Parques publicadas aqui' in await pg.inner_text('#prod-area'),"mostra produções de outros Parques publicadas na página")
        await pg.click('.prod-op[data-ir=nav]'); await pg.wait_for_timeout(300)
        ok('Não foi possível ler' in await pg.inner_text('#prod-area'),"Parque sem lista: aviso e links")
        await pg.goto(U+'#parque=car'); await pg.wait_for_timeout(400)
        ok(await pg.locator('.prod-op.ativo[data-ir=car]').count()==1 and await pg.locator('.prod-cats a').count()==3,"abrir pelo endereço; atalhos de categoria")
        m=await b.new_page(viewport={'width':390,'height':800}); m.on("pageerror",lambda e:errs.append(str(e)))
        await m.goto(U); await m.wait_for_timeout(300)
        ok(not await m.locator('#prod-parques').is_visible() and await m.locator('#prod-abrir').is_visible(),"celular: menu fechado e botão Escolher Parque")
        await m.click('#prod-abrir'); ok(await m.locator('#prod-parques').is_visible(),"botão abre o menu")
        await m.screenshot(path=OUT+'/prod-celular.png')
        await m.click('.prod-op[data-ir=lr]'); await m.wait_for_timeout(600)
        ok(not await m.locator('#prod-parques').is_visible() and 'La Reja' in await m.inner_text('#prod-titulo-vista'),"ao escolher, o menu fecha e mostra o Parque")
        await m.screenshot(path=OUT+'/prod-celular-parque.png')
        ok(not errs,"sem erros de JavaScript "+str(errs))
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
