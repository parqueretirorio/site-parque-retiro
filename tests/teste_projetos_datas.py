# Teste: novos projetos/campanhas, tipo "Data comemorativa" no Briefing e datas do Projeto 4 Estações no Calendário Anual.
import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT=8843
srv=subprocess.Popen(["python3","-m","http.server",str(PORT),"-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def aba(pg,t):
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo').click()}",t)
    await pg.click(f'[data-tab="{t}"]')
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':412,'height':900}); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.goto(f"http://localhost:{PORT}/login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Admin Teste'); await pg.fill('#e','a@t.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        # simula dados antigos já gravados
        await pg.evaluate("""()=>{PR_DADOS.db.set('com_projetos',[{id:'p1',nome:'Celebração dos 15 anos',ativa:true},{id:'p2',nome:'Marcha Mundial',ativa:true}]);PR_DADOS.db.set('datas_fixas',[{id:'fx-10-02',dia:'10-02',titulo:'Dia Internacional da Não-Violência',descricao:''},{id:'fx-05-04',dia:'05-04',titulo:'4 de maio',descricao:''}])}""")
        await aba(pg,'comunicacao'); await pg.click('[data-s="brief"]'); await pg.click('#bf-novo')
        opts=await pg.eval_on_selector_all('#bf-proj option','os=>os.map(o=>o.textContent)')
        ok(len(opts)==10 and 'Marcha Mundial' not in opts,"lista nova de projetos")
        v=await pg.evaluate("[...document.querySelectorAll('#bf-proj option')].find(o=>o.textContent=='Dia do Testemunho').value")
        await pg.select_option('#bf-proj',v); await pg.wait_for_timeout(200)
        ok(await pg.input_value('#bf-tipo')=='data',"Dia do Testemunho -> Data comemorativa")
        ok(await pg.input_value('#bf-nome')=='Dia do Testemunho' and await pg.input_value('#bf-dataEvento')=='04/05',"nome e data preenchidos")
        ok(await pg.locator('#bf-sentido').count()==1,"pergunta própria da data comemorativa")
        await pg.screenshot(path='/tmp/brief-proj.png',full_page=False)
        fx=await pg.evaluate("PR_DADOS.db.get('datas_fixas').map(f=>f.dia+' '+f.titulo)"); ok('05-04 Dia do Testemunho' in fx and '12-21 Início do verão · Festival de Verão' in fx,'datas fixas do calendário anual')
        at=await pg.evaluate("PR_DADOS.db.get('ativ',[]).map(a=>a.data+' '+a.titulo)"); ok('2026-12-20 Festival de Verão' in at,'Festival de Verão 20/12/2026 no Calendário Anual')
        ok(not errs,'sem erros '+str(errs)); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
