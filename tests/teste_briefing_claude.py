# Teste: Comunicação > "Briefing para o Claude" (com-briefing.js).
# Rodar a partir da pasta do site:  python3 tests/teste_briefing_claude.py
import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT=8839
srv=subprocess.Popen(["python3","-m","http.server",str(PORT),"-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
OUT=os.environ.get('SHOTS','/tmp')
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def aba(pg,t):
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo').click()}",t)
    await pg.click(f'[data-tab="{t}"]')
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(permissions=['clipboard-read','clipboard-write']); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("dialog",lambda d:asyncio.ensure_future(d.accept()))
        await pg.goto(f"http://localhost:{PORT}/login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Admin Teste'); await pg.fill('#e','a@t.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        await aba(pg,'comunicacao'); await pg.click('[data-s="brief"]')
        ok('Briefing para o Claude' in await pg.inner_text('#com-sub'),"sub-aba Briefing para o Claude abre")
        await pg.click('#bf-novo')
        await pg.select_option('#bf-tipo','evento'); await pg.wait_for_timeout(200)
        ok(await pg.locator('#bf-alojamento').count()==1,"tipo Evento mostra a pergunta de alojamento")
        await pg.fill('#bf-nome','Festival de Verão do Parque Retiro'); await pg.dispatch_event('#bf-nome','change')
        await pg.fill('#bf-dataEvento','20/12/2026'); await pg.dispatch_event('#bf-dataEvento','change')
        await pg.check('input[data-c="canais"][value="Instagram"]'); await pg.check('input[data-c="pecas"][value="Stories (vertical)"]')
        await pg.screenshot(path=OUT+'/briefing-form.png',full_page=True)
        await pg.click('#bf-gerar')
        t=await pg.input_value('#bf-saida')
        ok('Festival de Verão do Parque Retiro' in t and '20/12/2026' in t and 'Instagram' in t and 'Stories (vertical)' in t,"texto inclui as respostas")
        ok('"publicacoes"' in t,"texto pede o pacote da campanha em JSON")
        ok(await pg.get_attribute('#bf-abrir','href')=='https://claude.ai/new',"botão Abrir o Claude")
        await pg.click('#bf-copiar'); await pg.wait_for_timeout(200)
        ok(await pg.is_visible('#bf-ok'),"copiar mostra confirmação")
        clip=await pg.evaluate("navigator.clipboard.readText()"); ok('Festival de Verão' in clip,"texto foi para a área de transferência")
        await pg.screenshot(path=OUT+'/briefing-texto.png',full_page=True)
        await pg.click('#bf-editar'); await pg.click('#bf-voltar')
        txt=await pg.inner_text('#com-sub'); ok('Festival de Verão do Parque Retiro' in txt,"briefing salvo na lista")
        salvos=await pg.evaluate("PR_DADOS.db.get('com_briefings',[])"); ok(len(salvos)==1 and salvos[0]['enviadoEm'],"registra quando foi enviado ao Claude")
        ok(not errs,"sem erros de JavaScript "+str(errs))
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
