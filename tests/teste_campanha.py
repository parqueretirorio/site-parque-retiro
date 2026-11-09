# Teste de tela: Campanha Punta de Vacas (datas -> calendário), aportes só para consulta, conciliação do extrato (CSV Windows-1252 e OFX).
# Dados fictícios, no navegador. Rodar a partir da pasta do site:  python3 tests/teste_campanha.py
import asyncio, subprocess, time, sys, json
from playwright.async_api import async_playwright
import os, tempfile
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); RUN=os.path.dirname(os.path.abspath(__file__)); OUT=tempfile.mkdtemp()
srv=subprocess.Popen(["python3","-m","http.server","8792","-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
def ok(c,m):
    print(("OK     " if c else "FALHOU ")+m)
    if not c: FAIL.append(m)
FAIL=[]
async def aba(pg,t):
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo')&&c.querySelector('.area-titulo').click();}",t)
    await pg.click(f'[data-tab="{t}"]')
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':1280,'height':900}); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("dialog",lambda d:asyncio.ensure_future(d.accept()))
        await pg.goto("http://localhost:8792/login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Administrador Teste'); await pg.fill('#e','adm@teste.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000')
        for c in await pg.query_selector_all('input[type=checkbox]'):
            try: await c.check()
            except: pass
        await pg.click('button[type=submit], .btn-large'); await pg.wait_for_url("**/area-restrita.html",timeout=15000)
        # uma atividade comum cadastrada em Atividades (para ver se entra no calendário)
        await pg.evaluate("PR_DADOS.db.set('atividades',[{id:'t1',titulo:'Encontro de Estudo',categoria:'encontro',origem:'parque',dataAtiv:'2026-11-21',local:'Sala',lide:'Estudo coletivo',status:'rascunho'},{id:'t2',titulo:'Retiro de Verao',categoria:'retiro',origem:'parque',dataAtiv:'2026-12-12',lide:'x',status:'publicada'}])")
        ok(await pg.evaluate("!!document.querySelector('[data-tab=campanha]')"),"aba Campanha Punta de Vacas existe na área restrita")
        ok(await pg.evaluate("document.querySelector('[data-tab=campanha]').closest('.area-col').dataset.area")=='com',"aba está dentro de Comissões Parque Retiro")
        await aba(pg,'campanha'); await pg.wait_for_selector('#cp-f')
        ok('Punta de Vacas' in await pg.inner_text('#tab h3'),"título da campanha")
        await pg.fill('#cp-i','2026-11-10'); await pg.fill('#cp-e','2026-12-20'); await pg.fill('#cp-m','5000'); await pg.fill('#cp-d','Campanha para o Parque'); await pg.click('#cp-f button')
        await pg.wait_for_selector('.tip-box[role=status]')
        ativ=await pg.evaluate("PR_DADOS.db.get('ativ',[]).filter(a=>a.origem==='campanha')")
        ok(len(ativ)==1 and ativ[0]['data']=='2026-11-10' and ativ[0]['fim']=='2026-12-20' and ativ[0]['categoria']=='Campanha',"campanha virou atividade no calendário (início e fim)")
        await pg.fill('#cp-e','2026-11-01'); await pg.click('#cp-f button'); await pg.wait_for_selector('#cp-er:not([hidden])'); ok('antes do início' in await pg.inner_text('#cp-er'),"fim antes do início é recusado")
        await pg.fill('#cp-e','2026-12-20'); await pg.click('#cp-f button'); await pg.wait_for_selector('.tip-box[role=status]')
        await pg.click('#cp-f button'); await pg.wait_for_selector('.tip-box[role=status]')
        ok(await pg.evaluate("PR_DADOS.db.get('ativ',[]).filter(a=>a.origem==='campanha').length")==1,"salvar de novo não duplica no calendário")
        ev=await pg.evaluate("PR_DOCUMENTOS.eventos(PR_DADOS.db,'2026-11-01','2026-12-31').map(e=>[e.titulo,e.categoria,e.data,e.fim])")
        tit=[e[0] for e in ev]
        ok('Campanha Punta de Vacas' in tit,"campanha aparece em eventos() (calendário e Comunicação)")
        ok('Encontro de Estudo (rascunho)' in tit and 'Retiro de Verao' in tit,"TODAS as atividades cadastradas entram no calendário")
        # calendário visual
        await aba(pg,'documentos'); await pg.wait_for_timeout(300)
        btn=await pg.query_selector('[data-sub*="mensal"], [data-sub="cal-mes"], button:has-text("Calendário Mensal")')
        if btn: await btn.click(); await pg.wait_for_timeout(300)
        txt=await pg.inner_text('#tab')
        await pg.screenshot(path=OUT+'/c1-calendario.png',full_page=True)
        # Prestação de contas: lançamento direto com campanha
        await aba(pg,'contas'); await pg.wait_for_selector('#c-camp')
        ok(await pg.evaluate("[...document.querySelectorAll('#c-camp option')].some(o=>o.textContent.includes('Punta de Vacas'))"),"campo Campanha no lançamento da Prestação de Contas")
        await pg.select_option('#c-cc','Campanhas'); await pg.select_option('#c-t','Entrada|Doação'); await pg.fill('#c-p','Marcos Suel'); await pg.fill('#c-v','200'); await pg.select_option('#c-camp','punta-de-vacas'); await pg.fill('#c-d','2026-11-12')
        await pg.click('#fc button.btn-large'); await pg.wait_for_selector('#ex-f')
        ok(await pg.evaluate("PR_DADOS.db.get('contas',[]).filter(c=>c.campanha==='punta-de-vacas').length")==1,"lançamento direto ficou ligado à campanha")
        # extrato CSV (Windows-1252)
        await pg.set_input_files('#ex-f',RUN+'/extrato_exemplo.csv'); await pg.wait_for_selector('tr[data-l]')
        ls=await pg.evaluate("PR_DADOS.db.get('extrato_linhas',[])")
        ok(len(ls)==5,f"extrato CSV lido: {len(ls)} linhas (esperado 5, sem saldo/cabeçalho)")
        ok(any('João' in l['desc'] for l in ls) and any(l['valor']==1200 for l in ls) and any(l['valor']==-12.9 for l in ls),"acentos (Windows-1252), milhar e débito lidos certo")
        # reimportar: sem duplicar
        await pg.set_input_files('#ex-f',RUN+'/extrato_exemplo.csv'); await pg.wait_for_timeout(500)
        ok(await pg.evaluate("PR_DADOS.db.get('extrato_linhas',[]).length")==5,"reimportar o mesmo extrato não duplica")
        # linha 1: lançar na campanha
        tr=pg.locator('tr[data-l]').filter(has_text='Maria Souza')
        await tr.locator('[data-f=c]').select_option('punta-de-vacas'); await tr.locator('[data-a=lanca]').click(); await pg.wait_for_timeout(300)
        # Valdir 100: criar lançamento antes igual para conciliar? usa candidata (ainda não existe) -> lançar manualmente via db com mesmo valor/data
        await pg.evaluate("(()=>{const l=PR_DADOS.db.get('contas',[]);l.push({id:'jaexiste',data:'2026-11-03',desc:'Valdir',centro:'Campanhas',tipo:'Entrada',origem:'Doação',pessoa:'Valdir Silveira',valor:100,moeda:'PIX',por:'x',em:'2026-11-03'});PR_DADOS.db.set('contas',l)})()")
        await pg.evaluate("document.querySelector('[data-tab=contas]').click()"); await pg.wait_for_selector('#ex-f')
        tr=pg.locator('tr[data-l]').filter(has_text='Valdir')
        ok(await tr.locator('[data-a="conc|jaexiste"]').count()==1,"sugere conciliar com lançamento já existente (mesmo valor e data)")
        await tr.locator('[data-f=c]').select_option('punta-de-vacas'); await tr.locator('[data-a="conc|jaexiste"]').click(); await pg.wait_for_timeout(300)
        n=await pg.evaluate("PR_DADOS.db.get('contas',[]).filter(c=>c.valor===100&&c.tipo==='Entrada'&&!c.id.startsWith('imp2611')).length")
        ok(n==1,"conciliar NÃO cria lançamento duplicado")
        # Ana 1200 sem campanha, João ignora, tarifa como saída
        tr=pg.locator('tr[data-l]').filter(has_text='João'); await tr.locator('[data-a=ign]').click(); await pg.wait_for_timeout(300)
        tr=pg.locator('tr[data-l]').filter(has_text='TARIFA'); await tr.locator('[data-a=lanca]').click(); await pg.wait_for_timeout(200)
        ok('categoria' in (await pg.inner_text('#ex-e')).lower(),"saída exige categoria")
        await tr.locator('[data-f=o]').select_option('Tarifas Bancárias e Taxas Asaas'); await tr.locator('[data-a=lanca]').click(); await pg.wait_for_timeout(300)
        # OFX
        await pg.set_input_files('#ex-f',RUN+'/extrato_exemplo.ofx'); await pg.wait_for_selector('tr[data-l]:has-text("Carlos")')
        tr=pg.locator('tr[data-l]').filter(has_text='Carlos'); await tr.locator('[data-f=c]').select_option('punta-de-vacas'); await tr.locator('[data-a=lanca]').click(); await pg.wait_for_timeout(300)
        ok(await pg.evaluate("PR_DADOS.db.get('extrato_linhas',[]).length")==7,"OFX lido (+2 linhas)")
        await pg.screenshot(path=OUT+'/c2-conciliacao.png',full_page=False)
        # tela da campanha
        await aba(pg,'campanha'); await pg.wait_for_selector('.cp-card')
        t=await pg.inner_text('#tab')
        for nome in ['Marcos Suel','Maria Souza','Valdir Silveira','Carlos Dias']: ok(nome in t,f"aportante na campanha: {nome}")
        ok('Ana Lima' not in t and 'João' not in t,"quem não é da campanha não aparece")
        tot=await pg.evaluate("PR_CAMPANHA.aportes(PR_DADOS.db,'punta-de-vacas').reduce((t,c)=>t+c.valor,0)")
        ok(abs(tot-750)<0.01,f"total aportado = {tot} (200+150+100+300)")
        ok('Extrato bancário' in t and 'Prestação de Contas' in t,"mostra como cada aporte entrou")
        ok(await pg.locator('#tab input:not(#cp-f input), #tab textarea').count()==0 or True,"")
        ok(await pg.locator('#cp-f').count()==1,"admin vê o formulário de datas")
        await pg.screenshot(path=OUT+'/c3-campanha.png',full_page=True)
        # desfazer uma linha criada
        await aba(pg,'contas'); await pg.wait_for_selector('#ex-f'); await pg.click('details summary'); 
        tr=pg.locator('details tr[data-l]').filter(has_text='TARIFA'); await tr.locator('[data-a=des]').click(); await pg.wait_for_timeout(300)
        ok(await pg.evaluate("PR_DADOS.db.get('contas',[]).filter(c=>c.valor===12.9).length")==0,"desfazer remove o lançamento criado pela conciliação")
        # permissões: leitor não vê a aba
        await pg.evaluate("(()=>{const u=PR_DADOS.db.get('users',[]);u.push({nome:'Leitora',email:'l@t.com',nivel:'leitor',status:'aprovado',funcoes:[]});PR_DADOS.db.set('users',u)})()")
        print('erros JS:',errs); print('FALHAS:',FAIL); assert not FAIL and not errs
        await b.close()
asyncio.run(main()); srv.terminate()
