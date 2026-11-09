# Teste: Biblioteca de Silo (biblioteca-silo.html) e o novo item "Biblioteca de Silo" no menu Silo.
# Rodar a partir da pasta do site:  python3 tests/teste_biblioteca_silo.py
import asyncio, subprocess, time, os, glob
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT=8835
srv=subprocess.Popen(["python3","-m","http.server",str(PORT),"-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
U=f"http://localhost:{PORT}/"
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def main():
    pags={os.path.basename(f):open(f,encoding='utf-8').read() for f in glob.glob(os.path.join(SITE,'*.html'))}
    com_silo=[f for f,s in pags.items() if 'href="organismos.html">Organismos do Movimento' in s]
    ok(all('href="biblioteca-silo.html">Biblioteca de Silo' in pags[f] for f in com_silo),f"menu Silo > Biblioteca de Silo em todas as {len(com_silo)} páginas")
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':1200,'height':900}); errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.goto(U+"index.html"); await pg.hover('nav a[href="silo.html"]')
        ok(await pg.locator('nav a[href="biblioteca-silo.html"]').is_visible(),"item aparece ao passar o mouse em Silo")
        await pg.click('nav a[href="biblioteca-silo.html"]'); await pg.wait_for_url("**/biblioteca-silo.html")
        total=await pg.evaluate("PR_BIBLIOTECA_SILO.itens.length")
        ok(f'{total} documentos encontrados' in await pg.inner_text('#bib-cont'),f"mostra os {total} documentos")
        ok(await pg.locator('.bib-grupo').count()>=8,"agrupada por seção, como o Arquivo Silo")
        anos=await pg.evaluate("[...document.querySelectorAll('#bib-g-livros + ul .bib-data')].map(e=>e.textContent)")
        ok(anos[0]=='1972',"livros em ordem cronológica: "+', '.join(anos[:4]))
        await pg.fill('#bib-q','punta vacas'); await pg.wait_for_timeout(300)
        t=await pg.inner_text('#bib-res'); n=await pg.locator('.bib-item').count()
        ok(n>=2 and 'Cura do Sofrimento' in t,f"busca 'punta vacas' encontra {n} documentos")
        ok(await pg.locator('.bib-item mark').count()>0,"destaca o termo encontrado")
        ok('q=punta' in pg.url,"busca fica no endereço para compartilhar")
        await pg.fill('#bib-q','sofrimento curacion'); await pg.wait_for_timeout(300)
        ok(await pg.locator('.bib-item').count()==1,"busca sem acento e por título original")
        await pg.fill('#bib-q',''); await pg.wait_for_timeout(300)
        await pg.click('[data-sec=entrevistas]'); ok(await pg.locator('.bib-item').count()==await pg.evaluate("PR_BIBLIOTECA_SILO.itens.filter(i=>i.secao=='entrevistas').length"),"filtro por seção")
        await pg.click('[data-sec=""]'); await pg.select_option('#bib-formato','audio'); await pg.wait_for_timeout(200)
        ok(await pg.locator('.bib-item').count()==await pg.evaluate("PR_BIBLIOTECA_SILO.itens.filter(i=>i.formatos.includes('audio')).length"),"filtro por formato")
        await pg.select_option('#bib-formato',''); await pg.select_option('#bib-idioma','en'); await pg.wait_for_timeout(200)
        ok(await pg.locator('.bib-item').count()==await pg.evaluate("PR_BIBLIOTECA_SILO.itens.filter(i=>i.idiomas.includes('en')).length"),"filtro por idioma")
        await pg.select_option('#bib-ordem','recentes'); await pg.wait_for_timeout(200)
        await pg.click('#bib-limpar'); await pg.fill('#bib-q','xyzxyz'); await pg.wait_for_timeout(300)
        ok('Nenhum documento' in await pg.inner_text('#bib-res'),"mensagem quando não encontra nada")
        await pg.goto(U+"biblioteca-silo.html#secao=livros&q=leao"); await pg.wait_for_timeout(300)
        ok(await pg.input_value('#bib-q')=='leao' and await pg.locator('.bib-item').count()==1,"abre uma pesquisa pelo endereço")
        hrefs=await pg.evaluate("PR_BIBLIOTECA_SILO.itens.map(i=>i.link)")
        ok(all(h.startswith('http') for h in hrefs),"todos os itens têm link http(s)")
        ok(await pg.locator('a.bib-abrir[target=_blank][rel*=noopener]').count()==1,"links externos abrem em nova aba com segurança")
        ok('13.334' in await pg.inner_text('#bib-totais'),"totais do acervo completo")
        await pg.set_viewport_size({'width':390,'height':800}); await pg.goto(U+"biblioteca-silo.html"); await pg.wait_for_timeout(300)
        ok(await pg.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"),"no celular, sem rolagem lateral")
        await pg.goto(U+"silo.html"); ok(await pg.locator('main a[href="biblioteca-silo.html"], .container a[href="biblioteca-silo.html"]').count()>=1,"página Silo tem o cartão da Biblioteca")
        ok(not errs,"sem erros de JavaScript: "+"; ".join(errs))
        await b.close()
try: asyncio.run(main()); print("\nTODOS OS TESTES PASSARAM")
finally: srv.terminate()
