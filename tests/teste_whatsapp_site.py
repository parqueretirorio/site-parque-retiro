# Teste: Canal e Comunidade do WhatsApp no site público (proposta do WhatsApp do Parque Retiro).
# Canal: página inicial (bloco + cartão nas redes), Atividades e rodapé de todas as páginas. Comunidade: só em Voluntário.
# Links dos grupos: em nenhuma página. Botão flutuante: continua só para contato.
# Rodar a partir da pasta do site:  python3 tests/teste_whatsapp_site.py
import asyncio, subprocess, time, os, glob, re
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT=8834
srv=subprocess.Popen(["python3","-m","http.server",str(PORT),"-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
U=f"http://localhost:{PORT}/"
CANAL='https://whatsapp.com/channel/0029VbDmMh9ElagzPYbsg22t'; COM='https://chat.whatsapp.com/HaH1ShGH9VUKVrs1QX25At'
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def main():
    # ---------- arquivos ----------
    pags={os.path.basename(f):open(f,encoding='utf-8').read() for f in glob.glob(os.path.join(SITE,'*.html'))}
    com_rodape=[f for f,s in pags.items() if 'class="social-links"' in s]
    ok(all(f'href="{CANAL}"' in pags[f] and 'data-wz="canal"' in pags[f] for f in com_rodape),f"Canal no rodapé de todas as {len(com_rodape)} páginas com redes sociais")
    ok([f for f,s in pags.items() if 'chat.whatsapp.com' in s]==['voluntario.html'],"Comunidade aparece só em Voluntário")
    ok(all(len(re.findall(r'chat\.whatsapp\.com/',s))<=1 for s in pags.values()),"nenhum link de grupo além do convite da Comunidade")
    ok('BuHW4GY2R183cEBbvoLCXb' not in ''.join(pags.values()),"o link antigo de grupo saiu do site")
    ok('voluntario.html#comunidade-whatsapp' in pags['comece-aqui.html'],"Quem somos: Opinião e Participação leva ao convite da Comunidade")
    ok('data-wz="contato"' in pags['comece-aqui.html'] and 'data-wz="contato"' in pags['como-fazer.html'],"Como Apoiar e dúvidas sobre reservas levam ao WhatsApp oficial")
    js=open(os.path.join(SITE,'script.js'),encoding='utf-8').read()
    ok(f"canal: '{CANAL}'" in js and f"comunidade: '{COM}'" in js and "numero: '552128881830'" in js,"links e número num lugar só (PR_WHATSAPP em script.js)")
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(); errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
        # ---------- página inicial ----------
        await pg.goto(U+"index.html"); 
        ok(await pg.locator('#canal-whatsapp h2').inner_text()=='Fique por dentro do Parque Retiro',"página inicial: bloco Fique por dentro")
        ok(await pg.locator('#canal-whatsapp a[data-wz=canal]').get_attribute('href')==CANAL,"botão Seguir o Canal leva ao Canal")
        ok(await pg.locator('#canal-whatsapp a').get_attribute('target')=='_blank' and 'noopener' in await pg.locator('#canal-whatsapp a').get_attribute('rel'),"abre em nova aba com segurança")
        ok(await pg.locator('.social-card.whatsapp a[data-wz=canal]').count()==1,"cartão do Canal junto das redes sociais")
        ok(await pg.locator('footer a[data-wz=canal][aria-label]').count()==1,"ícone do Canal no rodapé, com nome acessível")
        ok(await pg.locator('a[href*="chat.whatsapp.com"]').count()==0,"página inicial não mostra a Comunidade")
        ok((await pg.locator('.whatsapp-float').get_attribute('href')).startswith('https://wa.me/552128881830'),"botão flutuante continua só para contato")
        ok(await pg.evaluate("(()=>{const e=document.querySelector('#canal-whatsapp');const r=e.getBoundingClientRect();return r.height>0&&r.width>0})()"),"bloco visível")
        cor=await pg.evaluate("getComputedStyle(document.querySelector('#canal-whatsapp .wz-btn')).backgroundColor"); ok(cor=='rgb(11, 112, 101)',"botão no verde do WhatsApp com bom contraste: "+cor)
        # ---------- celular ----------
        await pg.set_viewport_size({'width':390,'height':800}); await pg.goto(U+"index.html")
        ok(await pg.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"),"no celular, sem rolagem lateral")
        await pg.set_viewport_size({'width':1280,'height':900})
        # ---------- Atividades ----------
        await pg.goto(U+"atividades.html")
        ok(await pg.locator('.wz-bloco a[data-wz=canal]').get_attribute('href')==CANAL,"Atividades: chamada Receba os avisos pelo Canal")
        ok('Receba os avisos pelo Canal' in await pg.locator('.wz-bloco').inner_text(),"texto da chamada em Atividades")
        # ---------- Voluntário ----------
        await pg.goto(U+"voluntario.html")
        ok(await pg.locator('#comunidade-whatsapp a[data-wz=comunidade]').get_attribute('href')==COM,"Voluntário: Entrar na Comunidade")
        ok('Faça parte da Comunidade do Parque Retiro' in await pg.locator('#comunidade-whatsapp').inner_text(),"título do convite da Comunidade")
        # ---------- link central: trocar em PR_WHATSAPP muda as páginas ----------
        await pg.route("**/script.js", lambda r: asyncio.ensure_future(r.fulfill(status=200, content_type='application/javascript', body=js.replace(COM,'https://chat.whatsapp.com/NovoLink123'))))
        await pg.goto(U+"voluntario.html"); ok(await pg.locator('#comunidade-whatsapp a').get_attribute('href')=='https://chat.whatsapp.com/NovoLink123',"trocar o link em script.js atualiza a página")
        await pg.route("**/script.js", lambda r: asyncio.ensure_future(r.fulfill(status=200, content_type='application/javascript', body=js.replace(COM,'https://site-falso.com/x'))))
        await pg.goto(U+"voluntario.html"); ok(await pg.locator('#comunidade-whatsapp a').get_attribute('href')==COM,"link que não é do WhatsApp é ignorado")
        await pg.unroute("**/script.js")
        # ---------- idiomas ----------
        ctx2=await b.new_context(); await ctx2.add_init_script("try{localStorage.setItem('pr_idioma','es')}catch(e){}"); p2=await ctx2.new_page()
        await p2.goto(U+"index.html"); await p2.wait_for_timeout(600)
        if await p2.evaluate("PR_IDIOMA.atual()")!='es': await p2.evaluate("PR_IDIOMA.aplica('es')"); await p2.wait_for_timeout(300)
        t=await p2.locator('#canal-whatsapp').inner_text(); ok('Seguir el Canal' in t and 'Entérate' in t,"traduzido em espanhol")
        await ctx2.close()
        ok(not errs,"sem erros de JavaScript: "+"; ".join(errs))
        await b.close()
try: asyncio.run(main()); print("\nTODOS OS TESTES PASSARAM")
finally: srv.terminate()
