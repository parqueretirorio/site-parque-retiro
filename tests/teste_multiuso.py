# Teste do Multiuso (páginas públicas das Comissões e aba na área restrita).
# Rodar a partir da pasta do site:  python3 tests/teste_multiuso.py
import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen(["python3","-m","http.server","8784","-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
U="http://localhost:8784/"
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await (await b.new_context()).new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("dialog",lambda d:asyncio.ensure_future(d.accept()))
        await pg.goto(U+"index.html"); nav=await pg.text_content('header nav')
        ok('Multiuso' in nav,"menu Ajude o Parque > Comissões inclui Multiuso")
        await pg.goto(U+"comissoes.html"); ok(await pg.is_visible('a.card[href="comissao-multiuso.html"]'),"página Comissões tem o cartão Multiuso")
        await pg.goto(U+"comissao-multiuso.html"); ok('Multiuso' in await pg.inner_text('.page-hero'),"página Multiuso abre")
        await pg.click('a.btn-visit[href*="area=multiuso"]'); await pg.wait_for_selector('#vl-form')
        ok(await pg.evaluate("[...document.querySelectorAll('[name=va]:checked')].map(i=>i.value).join()")=='Multiuso',"botão de voluntário abre o formulário com Multiuso marcado")
        await pg.goto(U+"login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Admin Teste'); await pg.fill('#e','a@t.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        ok(await pg.evaluate("!!document.querySelector('.area-col[data-area=com] [data-tab=multiuso]') && !document.querySelector('[data-tab=multiuso]').closest('.area-grupo')"),"Multiuso direto em Comissões Parque Retiro")
        await pg.evaluate("(()=>{const c=document.querySelector('.area-col[data-area=com] .area-titulo');if(!document.querySelector('.area-col[data-area=com].aberta'))c.click()})()")
        await pg.click('[data-tab=multiuso]'); await pg.wait_for_selector('#mu-f')
        await pg.click('#mu-f button.btn-large'); ok('data' in (await pg.inner_text('#m-er')).lower() or 'atividade' in (await pg.inner_text('#m-er')).lower(),"agenda valida campos")
        await pg.fill('#m-a','Oficina de arte'); await pg.fill('#m-q','Grupo de jovens'); await pg.fill('#m-i','14:00'); await pg.fill('#m-fi','16:00'); await pg.click('#mu-f button.btn-large')
        ok(len(await pg.evaluate("PR_DADOS.db.get('multiuso_agenda',[])"))==1 and 'Oficina de arte' in await pg.inner_text('#mu-sub'),"uso registrado na agenda")
        await pg.click('[data-s=planos]'); await pg.fill('#p-t','Compra de cadeiras'); await pg.fill('#p-v','4'); await pg.click('#mu-f button.btn-large')
        ok(await pg.evaluate("PR_DADOS.db.get('multiuso_planos',[])[0].voluntarios")==4,"planejamento gravado")
        await pg.click('[data-s=info]'); await pg.fill('#i-r','Maria'); await pg.fill('#i-g','Deixar limpo.'); await pg.click('#mu-f button.btn-large')
        ok(await pg.evaluate("PR_DADOS.db.get('multiuso_info',{}).regras")=='Deixar limpo.',"regras e informações salvas")
        await pg.click('[data-s=docs]'); await pg.fill('#d-t','Regras'); await pg.fill('#d-l','https://exemplo.org/r'); await pg.click('#mu-f button.btn-large')
        ok(len(await pg.evaluate("PR_DADOS.db.get('multiuso_docs',[])"))==1,"documento adicionado")
        await pg.evaluate("(()=>{const l=PR_DADOS.db.get('users',[]);l[0].nivel='leitor';l[0].funcoes=[];PR_DADOS.db.set('users',l)})()"); await pg.reload()
        ok(not await pg.evaluate("!!document.querySelector('[data-tab=multiuso]')"),"leitor sem função não vê a aba Multiuso")
        ok(not errs,"sem erros de JavaScript "+str(errs))
        await b.close()
try: asyncio.run(main()); print("TUDO OK")
finally: srv.terminate()
