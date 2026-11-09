# Teste de Reservas de Alojamento + ASSEFAZ: encaminhar após o pedido, alinhamento (aceitou / não quis), liberação da cama,
# ocupação, recebimentos do Parque e da ASSEFAZ lançados em Prestação de Contas, linha "Reservas de Alojamentos" na planilha consolidada,
# relatório da aba, bloqueio de exclusão com recebimentos e estorno.
# Rodar a partir da pasta do site:  python3 tests/teste_assefaz.py
import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen(["python3","-m","http.server","8779","-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def aba(pg,t):
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo').click()}",t)
    await pg.evaluate("t=>{const g=document.querySelector(`[data-tab=${t}]`).closest('.area-grupo');if(g&&!g.classList.contains('aberto'))g.querySelector('.area-grupo-bt').click()}",t)
    await pg.click(f'[data-tab="{t}"]')
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); dlg=[]
        pg.on("dialog",lambda d:(dlg.append(d.message),asyncio.ensure_future(d.accept())))
        await pg.goto("http://localhost:8779/login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Admin Teste'); await pg.fill('#e','a@t.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        hoje=await pg.evaluate("new Date().toISOString().slice(0,10)")
        add=lambda k:f"(()=>{{const d=new Date('{hoje}T12:00:00');d.setDate(d.getDate()+{k});return d.toISOString().slice(0,10)}})()"
        c=await pg.evaluate(add(3)); s=await pg.evaluate(add(5))
        await aba(pg,'reservas')
        ok(await pg.is_visible('text=Relatório e recebimentos'),"aba Relatório e recebimentos existe")
        # pedido de 3 pessoas
        await pg.click('[data-s="novo"]')
        await pg.fill('#n-n','Maria Silva'); await pg.fill('#n-c',c); await pg.fill('#n-s',s); await pg.fill('#n-p','3'); await pg.click('#fn button.btn-large')
        await pg.wait_for_selector('.pedido')
        # ocupação: ASSEFAZ aparece abaixo dos quartos
        await pg.click('[data-s="ocup"]'); await pg.fill('#o-d',c); await pg.dispatch_event('#o-d','change')
        ok(await pg.evaluate("document.querySelector('.quartos').nextElementSibling.id==='o-as'"),"seção ASSEFAZ fica logo abaixo dos quartos da Ocupação")
        # encaminhar -> alinhamento
        await pg.select_option('#as-r',index=1); ok(await pg.input_value('#as-p')=='Maria Silva',"nome do solicitante vem sugerido")
        await pg.fill('#as-p','Joana Costa'); await pg.fill('#as-o','combinado por telefone'); await pg.click('#fas button')
        t=await pg.inner_text('#o-as'); ok('Joana Costa' in t and 'Em alinhamento' in t,"pessoa registrada em alinhamento")
        n=await pg.evaluate("PR_DADOS.db.get('pedidos',[])[0].assefaz.filter(a=>a.status==='confirmada').length"); ok(n==0,"em alinhamento NÃO conta como hospedado")
        # não quis
        await pg.click('[data-asno]'); ok(await pg.evaluate("PR_DADOS.db.get('pedidos',[])[0].assefaz[0].status")=='recusada',"'Não quis' grava recusada")
        # reencaminha e aceita
        await pg.select_option('#as-r',index=1); await pg.fill('#as-p','Joana Costa'); await pg.click('#fas button'); await pg.click('[data-asok]')
        a=await pg.evaluate("PR_DADOS.db.get('pedidos',[])[0].assefaz"); ok(len(a)==1 and a[0]['status']=='confirmada',"'Aceitou' confirma e reaproveita o registro")
        t=await pg.inner_text('#o-as'); ok('Na ASSEFAZ em' in t,"totais da ASSEFAZ aparecem")
        ok('Joana Costa' in await pg.inner_text('#o-as table'),"aparece em 'Hospedados na ASSEFAZ nesta data'")
        # confirma o pedido: só 2 linhas de cama
        await pg.click('[data-s="ped"]')
        ok(await pg.locator('.pedido [data-c]').count()==2,"pedido pede cama só para quem não vai à ASSEFAZ (2 de 3)")
        await pg.fill('.pedido [data-p="1"]','Pedro Lima')
        await pg.select_option('.pedido [data-c="0"]',index=1); await pg.select_option('.pedido [data-c="1"]',index=2); await pg.click('[data-ok]')
        t=await pg.inner_text('.doc-table'); ok('ASSEFAZ (externo)' in t and 'Joana Costa' in t,"reserva confirmada mostra quem está na ASSEFAZ")
        # recebimentos
        await pg.click('[data-s="rel"]')
        await pg.select_option('#g-r',index=1); await pg.select_option('#g-l','parque'); await pg.fill('#g-v','200'); await pg.click('#fr button')
        await pg.select_option('#g-r',index=1); await pg.select_option('#g-l','assefaz'); await pg.fill('#g-v','150.50'); await pg.select_option('#g-m','MUMBUCA'); await pg.click('#fr button')
        cs=await pg.evaluate("PR_DADOS.db.get('contas',[])")
        ok(len(cs)==2 and all(x['origem']=='Reservas de Alojamentos' and x['centro']=='Alojamento' and x['tipo']=='Entrada' for x in cs),"2 recebimentos lançados em Prestação de Contas (Alojamento / Reservas de Alojamentos)")
        ok(any('ASSEFAZ' in x['desc'] for x in cs) and any('Parque Retiro' in x['desc'] for x in cs),"descrição identifica o local")
        t=await pg.inner_text('#sub'); ok('200,00' in t and 'M$ 150,50' in t and 'Total' in t,"relatório soma por moeda")
        # validação: assefaz sem confirmado
        # bloqueio de exclusão
        await pg.click('[data-s="ped"]'); await pg.click('[data-del]'); 
        ok(len(await pg.evaluate("PR_DADOS.db.get('pedidos',[])"))==1 and any('recebimentos' in m for m in dlg),"não exclui pedido com recebimentos")
        # planilha consolidada
        await aba(pg,'relatorios'); await pg.wait_for_selector('.rf-tab')
        tab=await pg.inner_text('.rf-tab'); ok('Reservas de Alojamentos' in tab,"planilha consolidada tem a linha Reservas de Alojamentos")
        linha=await pg.evaluate("[...document.querySelectorAll('.rf-tab tr')].find(r=>r.querySelector('th')&&r.querySelector('th').innerText.includes('Reservas de Alojamentos')&&!r.classList.contains('rf-banda')).innerText")
        ok('350,50' in linha,"valor somado na planilha (200,00 + 150,50 = 350,50): "+linha[:60].replace('\n',' '))
        sub=await pg.evaluate("[...document.querySelectorAll('.rf-tab tr')].find(r=>r.innerText.includes('SUBTOTAL AJUDE O PARQUE')).innerText")
        ok('350,50' not in sub,"alojamento NÃO entra no subtotal Ajude o Parque")
        rt=await pg.evaluate("[...document.querySelectorAll('.rf-tab tr')].find(r=>r.innerText.includes('RECEITAS TOTAIS')).innerText"); ok('350,50' in rt,"entra nas Receitas totais")
        # estorno
        await aba(pg,'reservas'); await pg.click('[data-s="rel"]'); await pg.click('[data-gdel]')
        ok(await pg.evaluate("PR_DADOS.db.get('contas',[]).length")==1,"excluir recebimento remove o lançamento da Prestação de Contas")
        # módulo de relatórios por módulo
        ok(not errs,"sem erros de JavaScript "+str(errs))
        await b.close()
try: asyncio.run(main()); print("TUDO OK")
finally: srv.terminate()
