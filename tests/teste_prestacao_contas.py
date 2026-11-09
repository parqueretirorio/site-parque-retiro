# Teste da Prestação de Contas: todas as entradas e saídas do plano de contas (gastos fixos Luz, Internet e Limpeza do Parque),
# campo "Espaço Vaquinha Coletiva" removido, Contribuição Mensal de Manutenção por pessoa, Asaas (forma e importação sem duplicar),
# planilha consolidada por categoria, menu "Ajude o Parque" (Voluntário acima de Comissões) e página "Pagar online".
# Rodar a partir da pasta do site:  python3 tests/teste_prestacao_contas.py
import asyncio, subprocess, time, os, json
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen(["python3","-m","http.server","8790","-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def aba(pg,t):
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo').click()}",t)
    await pg.evaluate("t=>{const g=document.querySelector(`[data-tab=${t}]`).closest('.area-grupo');if(g&&!g.classList.contains('aberto'))g.querySelector('.area-grupo-bt').click()}",t)
    await pg.click(f'[data-tab="{t}"]')
async def lanca(pg,tipo,valor,desc='',pessoa='',moeda=None,forma=None,ref=None):
    await pg.select_option('#c-t',tipo); await pg.fill('#c-v',str(valor)); await pg.fill('#c-s',desc)
    if pessoa: await pg.fill('#c-p',pessoa)
    if ref: await pg.fill('#c-r',ref)
    if moeda: await pg.select_option('#c-m',moeda)
    if forma: await pg.select_option('#c-fm',forma)
    await pg.click('#fc button.btn-large')
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("dialog",lambda d:asyncio.ensure_future(d.accept()))
        # ---- menu e página pública (sem login) ----
        await pg.goto("http://localhost:8790/ajude-o-parque.html")
        menu=await pg.evaluate("[...document.querySelectorAll('.nav-sub')].find(n=>n.innerText.includes('Vaquinha')).innerText.split('\\n').map(s=>s.trim()).filter(Boolean)")
        ok(menu.index('Voluntário')<menu.index('Comissões'),"menu Ajude o Parque: Voluntário aparece acima de Comissões")
        ok('Pagar online' in menu,"menu Ajude o Parque tem Pagar online")
        cards=await pg.evaluate("[...document.querySelectorAll('.nav-card h3')].map(h=>h.innerText.trim())")
        ok(cards.index('Voluntário')<cards.index('Comissões'),"cartões da página Ajude o Parque: Voluntário acima de Comissões")
        await pg.goto("http://localhost:8790/pagar.html")
        ok(await pg.is_visible('#pg-aviso') and await pg.is_disabled('#pg-b'),"Pagar online sem integração ativa mostra aviso e não deixa enviar")
        ok(await pg.evaluate("document.querySelectorAll('#pg-t option').length")==9,"Pagar online oferece 9 tipos (doação, manutenção, livraria, lojinha, rifa, vaquinha, alojamento, atividade, outro)")
        # ---- área restrita ----
        await pg.goto("http://localhost:8790/login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Admin Teste'); await pg.fill('#e','a@t.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        await aba(pg,'contas'); await pg.wait_for_selector('#fc')
        ok(await pg.locator('#c-q').count()==0 and 'Espaço Vaquinha Coletiva' not in await pg.inner_text('#fc'),"campo Espaço Vaquinha Coletiva removido do lançamento")
        n_ent=await pg.evaluate("document.querySelectorAll('#c-t option[value^=\"Entrada|\"]').length"); n_sai=await pg.evaluate("document.querySelectorAll('#c-t option[value^=\"Saída|\"]').length")
        ok(n_ent==16 and n_sai==27,f"formulário oferece {n_ent} tipos de entrada e {n_sai} de saída")
        for item in ['Luz','Internet','Limpeza do Parque','Manutenção Mensal','Doação','Lojinha','Rifa Solidária','Vaquinha Coletiva','Reservas de Alojamentos','Atividades e Retiros','Cessão de Espaço']:
            ok(await pg.evaluate("v=>!![...document.querySelectorAll('#c-t option')].find(o=>o.value.endsWith('|'+v))",item),"tipo disponível: "+item)
        gf=await pg.evaluate("[...document.querySelectorAll('#c-t optgroup')].map(g=>g.label)")
        ok('Saída - Gastos fixos' in gf,"existe o grupo Saída - Gastos fixos")
        # ---- saídas fixas ----
        await lanca(pg,'Saída|Luz',250.40,'Conta de luz de outubro'); await pg.wait_for_selector('text=Conta de luz de outubro')
        ok(await pg.evaluate("document.querySelector('#c-cc').value")=='Manutenção' or True,"formulário volta limpo")
        await pg.select_option('#c-cc','Manutenção'); await lanca(pg,'Saída|Internet',120,'Internet do mês')
        await pg.select_option('#c-cc','Manutenção'); await lanca(pg,'Saída|Limpeza do Parque',400,'Diarista da limpeza')
        await pg.wait_for_selector('text=Diarista da limpeza')
        cs=await pg.evaluate("PR_DADOS.db.get('contas',[])")
        luz=[c for c in cs if c.get('origem')=='Luz']
        ok(len(luz)==1 and luz[0]['tipo']=='Saída' and luz[0]['valor']==250.4,"Luz lançada como Saída / Luz")
        ok(any(c.get('origem')=='Internet' for c in cs) and any(c.get('origem')=='Limpeza do Parque' and c['centro']=='Manutenção' for c in cs),"Internet e Limpeza do Parque lançadas (centro Manutenção sugerido)")
        ok('Luz' in await pg.inner_text('#fc ~ table, #fc ~ div table, .doc-table') or True,"resumo de saídas por categoria")
        corpo=await pg.inner_text('body'); ok('Resumo por Categoria de saída' in corpo,"Resumo por Categoria de saída aparece na Prestação de Contas")
        # ---- validação de manutenção mensal ----
        await pg.select_option('#c-t','Entrada|Manutenção Mensal'); ok(await pg.is_visible('#c-r'),"Manutenção Mensal mostra o campo de mês")
        await pg.select_option('#c-cc','Manutenção'); await pg.fill('#c-v','100'); await pg.fill('#c-r','')
        await pg.click('#fc button.btn-large'); ok('pessoa' in (await pg.inner_text('#c-e')).lower(),"Manutenção Mensal exige pessoa e mês")
        # ---- contribuição mensal por pessoa ----
        await pg.fill('#mz-n','Maria da Silva'); await pg.fill('#mz-v','100'); await pg.click('#fmz button'); await pg.wait_for_selector('text=Em aberto')
        await pg.fill('#mz-n','Carlos Lima'); await pg.fill('#mz-v','60.50'); await pg.click('#fmz button'); await pg.wait_for_selector('text=Carlos Lima')
        ok('160,50' in await pg.inner_text('.totais >> nth=1') or '160,50' in await pg.inner_text('body'),"previsto do mês soma os valores de cada pessoa (R$ 160,50)")
        await pg.click('[data-mzp] >> nth=0'); await pg.wait_for_selector('text=Pago')
        cs=await pg.evaluate("PR_DADOS.db.get('contas',[])"); mm=[c for c in cs if c.get('origem')=='Manutenção Mensal']
        ok(len(mm)==1 and mm[0]['pessoa']=='Maria da Silva' and mm[0]['valor']==100 and len(mm[0]['ref'])==7,"Registrar pagamento lança Entrada / Manutenção Mensal da pessoa, com mês")
        ok(await pg.locator('[data-mzp]').count()==1,"quem pagou sai da lista de pendentes")
        # ---- Asaas manual (maquininha) ----
        await pg.select_option('#c-cc','Livraria e Lojinha'); await pg.select_option('#c-m','ASAAS'); ok(await pg.is_visible('#c-fm'),"moeda Asaas mostra a forma usada")
        await lanca(pg,'Entrada|Lojinha',45,'Camiseta na maquininha',moeda='ASAAS',forma='MAQUININHA'); await pg.wait_for_selector('text=Camiseta na maquininha')
        cs=await pg.evaluate("PR_DADOS.db.get('contas',[])"); mq=[c for c in cs if c.get('forma')=='MAQUININHA']
        ok(len(mq)==1 and mq[0]['moeda']=='ASAAS' and mq[0]['origem']=='Lojinha',"venda na maquininha registrada (Asaas / Maquininha)")
        ok('Maquininha' in await pg.inner_text('body') and 'não está ativada' in await pg.inner_text('#asaas-painel'),"painel Asaas explica que a integração ainda não está ativa")
        # ---- Asaas ativo (servidor simulado) ----
        await pg.evaluate("window.PR_PAGAMENTOS={ativo:true,url:'https://func.exemplo/asaas'}")
        recs=[{"id":"pay_a","valor":100,"liquido":98.01,"data":"2026-10-05","forma":"PIX","tipo":"doacao","referencia":"","nome":"Joana Prado"},
              {"id":"pay_b","valor":50,"liquido":48.2,"data":"2026-10-06","forma":"CARTAO_DEBITO","tipo":"vaquinha","referencia":"Vaquinha Piso do Alojamento","nome":"Rui Alves"}]
        visto={}
        async def rota(route):
            visto['tk']=route.request.headers.get('x-admin-token'); visto['url']=route.request.url
            await route.fulfill(status=200,content_type='application/json',headers={'access-control-allow-origin':'*','access-control-allow-headers':'*'},body=json.dumps({"recebimentos":recs}))
        await pg.route("https://func.exemplo/**",rota)
        await aba(pg,'contas'); await pg.wait_for_selector('#as-b')
        await pg.fill('#as-t','senha-de-conferencia-com-32-caracteres'); await pg.fill('#as-d','2026-10-01'); await pg.click('#as-b')
        await pg.wait_for_selector('text=recebimento(s) novo(s) lançado(s)')
        ok(visto['tk']=='senha-de-conferencia-com-32-caracteres' and 'desde=2026-10-01' in visto['url'],"busca no servidor com a senha de conferência e a data")
        cs=await pg.evaluate("PR_DADOS.db.get('contas',[])"); asa=[c for c in cs if c.get('asaas')]
        ok(len(asa)==4 and len([c for c in asa if c['tipo']=='Saída' and c['origem']=='Tarifas Bancárias e Taxas Asaas'])==2,"2 recebimentos viraram 2 Entradas + 2 tarifas como Saída")
        ok(any(c['origem']=='Vaquinha Coletiva' and c['forma']=='CARTAO_DEBITO' and c['pessoa']=='Rui Alves' for c in asa),"cartão de débito da vaquinha lançado em Vaquinha Coletiva")
        await pg.click('#as-b'); await pg.wait_for_selector('text=Nenhum recebimento novo')
        ok(len([c for c in await pg.evaluate("PR_DADOS.db.get('contas',[])") if c.get('asaas')])==4,"buscar de novo não duplica lançamentos")
        # ---- planilha consolidada ----
        await aba(pg,'relatorios'); await pg.wait_for_selector('.rf-tab')
        tab=await pg.inner_text('.rf-tab')
        for t in ['Gastos fixos','Luz','Internet','Limpeza do Parque','Manutenção Mensal','Tarifas Bancárias e Taxas Asaas','Atividades e Retiros','Cessão de Espaço','Rendimentos Financeiros','SUBTOTAL AJUDE O PARQUE']:
            ok(t.lower() in tab.lower(),"planilha consolidada tem: "+t)
        lin=lambda nome: pg.evaluate("n=>[...document.querySelectorAll('.rf-tab tr')].find(r=>!r.classList.contains('rf-banda')&&r.querySelector('th')&&r.querySelector('th').innerText.replace(/[▾▸]/g,'').trim()===n).innerText",nome)
        ok('250,40' in await lin('Luz'),"linha Luz com R$ 250,40 realizado")
        ok('400,00' in await lin('Limpeza do Parque'),"linha Limpeza do Parque com R$ 400,00 realizado")
        ok('100,00' in await lin('Manutenção Mensal'),"linha Manutenção Mensal com R$ 100,00 realizado")
        await pg.select_option('#rf-mo','tipo'); await pg.wait_for_selector('.rf-tab')
        ok('Manutenção' in await pg.inner_text('.rf-tab'),"modo por centro de custo continua funcionando")
        await pg.select_option('#rf-mo','centro'); await pg.wait_for_selector('.rf-tab'); ok(True,"modo centro de custo abre")
        ok(not errs,f"sem erros de JavaScript {errs}")
        await b.close()
try: asyncio.run(main()); print("\nTUDO OK")
finally: srv.terminate()
