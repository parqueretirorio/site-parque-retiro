# Teste: idiomas do site público (ES, IT, FR, EN, DE) a partir do português: seletor flutuante, troca na hora, volta ao português,
# memória da escolha, datas formatadas, sem chamadas externas, área restrita sem o seletor, e cobertura das tabelas de tradução.
# Rodar a partir da pasta do site:  python3 tests/teste_idiomas.py
import asyncio, subprocess, time, os, json
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT=8797
srv=subprocess.Popen(["python3","-m","http.server",str(PORT),"-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
U=f"http://localhost:{PORT}/"
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
NOMES={'es':'Español','it':'Italiano','fr':'Français','en':'English','de':'Deutsch'}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page(); errs=[]; net=[]
        pg.on("pageerror",lambda e:errs.append(str(e)))
        pg.on("request",lambda r:net.append(r.url) if not r.url.startswith(U) and not r.url.startswith("data:") and 'cdnjs' not in r.url and 'fonts.' not in r.url and 'maps.google' not in r.url and 'google.com/maps' not in r.url and not r.url.lower().split('?')[0].endswith(('.jpg','.jpeg','.png','.gif','.webp','.svg','.ico')) else None)  # imagens de outros sites já existiam nas páginas; aqui vale: nada de tradutor ou serviço externo
        await pg.goto(U+"index.html",wait_until="domcontentloaded"); await pg.wait_for_selector('#pr-idioma')
        pt_menu=await pg.evaluate("document.querySelector('header nav').textContent.replace(/\\s+/g,' ')"); pt_titulo=await pg.title()
        ok(await pg.locator('#pr-idioma').count()==1,"seletor flutuante presente")
        box=await pg.locator('#pr-idioma .pri-bt').bounding_box(); vp=pg.viewport_size
        en=await pg.evaluate("document.querySelector('.btn-entrar').getBoundingClientRect().top"); ok(box['x']<100 and abs(box['y']-en)<3,"fica no alto, à esquerda, alinhado em altura com o botão Entrar")
        ok(await pg.locator('#pr-idioma .pri-lista').is_hidden(),"lista fechada por padrão (discreto)")
        await pg.click('#pr-idioma .pri-bt'); ok(await pg.locator('#pr-idioma .pri-lista').is_visible(),"abre ao clicar")
        ok([await b_.get_attribute('data-l') for b_ in await pg.locator('#pr-idioma [data-l]').all()]==['pt','es','it','fr','en','de'],"seis idiomas na lista")
        esperado={'es':'Cómo llegar','it':'Come arrivare','fr':'Comment venir','en':'How to get here','de':'Anreise'}
        for l,t in esperado.items():
            await pg.click('#pr-idioma .pri-bt') if await pg.locator('#pr-idioma .pri-lista').is_hidden() else None
            await pg.click(f'#pr-idioma [data-l="{l}"]'); await pg.wait_for_timeout(300)
            menu=await pg.evaluate("document.querySelector('header nav').textContent.replace(/\\s+/g,' ')")
            ok(t in menu and 'Como Chegar' not in menu,f"{l}: menu traduzido ({t})")
            ok(await pg.evaluate("document.documentElement.lang")==l or (await pg.evaluate("document.documentElement.lang")).startswith(l),f"{l}: atributo lang atualizado")
            ok('Parque de Estudo e Reflexão Retiro' in await pg.inner_text('.brand-name') if await pg.locator('.brand-name').count() else True,f"{l}: nome próprio do Parque mantido")
            ok(await pg.locator('#pr-idioma .pri-cod').inner_text()==l.upper(),f"{l}: botão mostra o código")
        await pg.click('#pr-idioma .pri-bt') if await pg.locator('#pr-idioma .pri-lista').is_hidden() else None
        await pg.click('#pr-idioma [data-l="pt"]'); await pg.wait_for_timeout(300)
        ok(await pg.evaluate("document.querySelector('header nav').textContent.replace(/\\s+/g,' ')")==pt_menu and await pg.title()==pt_titulo,"voltar ao português restaura menu e título exatamente")
        # memória da escolha e ?lang=
        await pg.click('#pr-idioma .pri-bt'); await pg.click('#pr-idioma [data-l="fr"]'); await pg.goto(U+"como-chegar.html",wait_until="domcontentloaded"); await pg.wait_for_timeout(500)
        ok('Comment venir' in await pg.evaluate("document.querySelector('header nav').textContent.replace(/\\s+/g,' ')"),"a escolha fica lembrada ao mudar de página")
        await pg.goto(U+"index.html?lang=de",wait_until="domcontentloaded"); await pg.wait_for_timeout(500)
        ok('Anreise' in await pg.evaluate("document.querySelector('header nav').textContent.replace(/\\s+/g,' ')"),"endereço com ?lang=de abre em alemão")
        await pg.evaluate("localStorage.clear()")
        # datas por regra (calendário)
        await pg.goto(U+"calendario.html?lang=en",wait_until="domcontentloaded"); await pg.wait_for_timeout(800)
        corpo=await pg.inner_text('body'); ok('October' in corpo or 'November' in corpo,"mês do calendário aparece em inglês")
        await pg.evaluate("localStorage.clear()")
        # área restrita e login: seletor presente e tabela própria em espanhol (i18n/area-es.js)
        for f in ('area-restrita.html','login.html'):
            await pg.goto(U+f,wait_until="domcontentloaded"); ok(await pg.locator('#pr-idioma').count()==1,f"{f} com seletor de idioma")
        await pg.goto(U+"login.html?lang=es",wait_until="domcontentloaded"); await pg.wait_for_timeout(800)
        corpo=await pg.inner_text('body'); ok('Crear cuenta' in corpo and 'Contraseña' in corpo,"login abre em espanhol (tabela da área restrita)")
        await pg.evaluate("localStorage.clear()")
        # cobertura: quantos textos de cada página pública têm tradução
        await pg.goto(U+"index.html",wait_until="domcontentloaded"); await pg.wait_for_selector('#pr-idioma')
        import glob
        pgs=[f for f in sorted(os.listdir(SITE)) if f.endswith('.html') and f not in ('area-restrita.html','login.html') and 'idioma.js' in open(os.path.join(SITE,f),encoding='utf-8').read()]
        falt={}
        for l in ('es','it','fr','en','de'):
            txt=open(os.path.join(SITE,'i18n',l+'.js'),encoding='utf-8').read(); tab=json.loads(txt[txt.index('||{}).'+l+'=')+len('||{}).'+l+'='):].rsplit(';',1)[0])
            tot=0; sem=0
            for f in pgs:
                await pg.goto(U+f,wait_until="domcontentloaded"); await pg.wait_for_timeout(120)
                ks=await pg.evaluate("PR_IDIOMA.coletar()")
                tot+=len(ks); sem+=sum(1 for k in ks if k not in tab)
            falt[l]=(tot,sem)
        print("COBERTURA (textos únicos por página, soma):",{l:f"{100-100*s//max(t,1)}%" for l,(t,s) in falt.items()})
        ok(all(s==falt['es'][1] for t,s in falt.values()),"as cinco tabelas cobrem os mesmos textos")
        ok(not errs,f"sem erros de JavaScript ({errs[:1]})"); ok(not net,f"nenhuma requisição externa ({net[:2]})")
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
