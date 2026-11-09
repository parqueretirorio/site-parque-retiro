# Teste de tela de Compras e Orçamento: pedidos com até 3 cotações, aprovação sem obrigar a mais barata, compra registrada,
# lançamento na Prestação de Contas (com painel do Patrimônio), planejamento anual, planejamento ligado ao Previsto do orçamento (automático),
# centro de custo novo, consolidado e papéis (solicitante, compras). Dados fictícios, no navegador.
# Rodar a partir da pasta do site:  python3 tests/teste_compras.py
import asyncio, subprocess, time, os, datetime
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen(["python3","-m","http.server","8776","-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
ANO=datetime.date.today().year+1
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
RESP=['']
async def aba(pg,t):
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo')&&c.querySelector('.area-titulo').click();}",t)
    await pg.click(f'[data-tab="{t}"]')
async def db(pg,k,d=None): return await pg.evaluate("([k,d])=>PR_DADOS.db.get(k,d)",[k,d if d is not None else []])
async def novo_item(pg,t,c,k,v,m,pat=False):
    await pg.fill('#pi-t',t); await pg.select_option('#pi-c',c); await pg.select_option('#pi-k',k); await pg.fill('#pi-v',v); await pg.select_option('#pi-m',str(m))
    if pat: await pg.check('#pi-pt')
    await pg.click('#pi-ok'); await pg.wait_for_selector('#cp-sub .tip-box[role=status]')
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
        pg.on("dialog",lambda d:asyncio.ensure_future(d.accept(RESP[0]) if d.type=='prompt' else d.accept()))
        net=[]; pg.on("request",lambda r:net.append(r.url) if not r.url.startswith("http://localhost:8776") and not r.url.startswith("data:") and 'cdnjs' not in r.url and 'fonts.' not in r.url else None)
        await pg.goto("http://localhost:8776/login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Admin Teste'); await pg.fill('#e','admin@teste.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        await aba(pg,'compras')
        # --- planejamento anual
        await pg.click('[data-s="plano"]'); await pg.select_option('#pl-a',str(ANO))
        await novo_item(pg,'Troca do telhado fictício','Manutenção','Reparos e Manutenção Predial','12.000,00',3)
        await novo_item(pg,'Projetor fictício','Eventos','Ferramentas e Equipamentos','2400',5,pat=True)
        pl=(await db(pg,'compras_plano',{}))[str(ANO)]; ok(len(pl['itens'])==2 and pl['itens'][0]['estimado']==12000,f"planejamento de {ANO} guardado com 2 itens (valor 12.000,00 lido corretamente)")
        ok('Total estimado' in await pg.inner_text('.totais') and 'R$ 14.400,00' in await pg.inner_text('.totais'),"total estimado do plano soma os itens")
        # --- pedido nascido do planejamento (projetor)
        await pg.click('tr:has-text("Projetor fictício") [data-pp]'); await pg.wait_for_selector('#pf')
        ok(await pg.input_value('#pf-t')=='Projetor fictício' and await pg.input_value('#pf-c')=='Eventos' and await pg.is_checked('#pf-pt'),"pedido do planejamento já vem preenchido (item, centro, patrimônio)")
        await pg.click('#pf button.btn-large'); await pg.wait_for_selector('#acoes')
        ped=(await db(pg,'compras_ped'))[0]; ok(ped['numero']=='CMP-0001' and ped['origem']=='plano' and ped['status']=='Solicitada',"pedido CMP-0001 criado com origem planejamento")
        pl=(await db(pg,'compras_plano',{}))[str(ANO)]; ok([i for i in pl['itens'] if i['titulo']=='Projetor fictício'][0]['status']=='Em pedido',"item do plano passa a 'Em pedido'")
        # --- duas cotações (menos de 3 não bloqueia), aprovar a MAIS CARA
        for f,v in [('Loja A fictícia','2300'),('Loja B fictícia','2100')]:
            await pg.fill('#cf-f',f); await pg.fill('#cf-v',v); await pg.click('#cf button.btn-visit'); await pg.wait_for_selector('#cf')
        ped=(await db(pg,'compras_ped'))[0]; ok(len(ped['cotacoes'])==2 and ped['status']=='Em cotação',"duas cotações registradas, pedido em cotação")
        await pg.click('#a-env'); await pg.wait_for_selector('#a-apr')
        ok((await db(pg,'compras_ped'))[0]['status']=='Aguardando aprovação',"pode enviar para aprovação com menos de 3 cotações")
        await pg.click('[name=esc] >> nth=0'); await pg.fill('#a-mo','entrega mais rápida'); await pg.click('#a-apr'); await pg.wait_for_selector('#rcf')
        ped=(await db(pg,'compras_ped'))[0]; ok(ped['status']=='Aprovada' and ped['aprovadoPor']=='Admin Teste' and ped['cotacoesNaAprovacao']==2,"aprovada por quem aprovou, com o nº de cotações registrado")
        ok(any('não é a de menor valor' in h['txt'] for h in ped['hist']),"escolher a mais cara é permitido e fica registrado no histórico")
        # --- registrar compra
        await pg.fill('#rc-n','NF 777'); await pg.click('#rcf button.btn-visit'); await pg.wait_for_selector('#a-lan')
        ped=(await db(pg,'compras_ped'))[0]; ok(ped['status']=='Comprada' and ped['valorPago']==2300 and ped['nf']=='NF 777',"compra registrada com valor pago e nota fiscal")
        pl=(await db(pg,'compras_plano',{}))[str(ANO)]; ok([i for i in pl['itens'] if i['titulo']=='Projetor fictício'][0]['status']=='Comprado',"item do plano passa a 'Comprado'")
        await pg.click('#a-lan'); await pg.wait_for_selector('#pp-f')
        lc=(await db(pg,'contas'))[0]; ok(lc['tipo']=='Saída' and lc['valor']==2300 and lc['compra']==ped['id'] and lc['centro']=='Eventos',"lançamento na Prestação de Contas criado e ligado ao pedido")
        ok(await pg.is_visible('#pp-f'),"como é patrimônio, o painel do Patrimônio abre na Prestação de Contas")
        # --- pedido fora do planejamento exige justificativa; centro de custo novo
        await aba(pg,'compras'); await pg.click('[data-s="ped"]'); await pg.click('#pd-n')
        await pg.fill('#pf-t','Bomba d’água fictícia'); await pg.select_option('#pf-c','Manutenção'); await pg.click('#pf button.btn-large')
        ok('justificativa' in (await pg.inner_text('#cp-sub')).lower() or 'Explique' in await pg.inner_text('#cp-sub'),"pedido avulso sem justificativa é recusado")
        RESP[0]='Biblioteca'; await pg.click('#pf-nc'); await pg.wait_for_selector('#pf-c')
        ok('Biblioteca' in (await db(pg,'cc_extra',{})) and 'Biblioteca' in await pg.eval_on_selector_all('#pf-c option','o=>o.map(x=>x.value)'),"novo centro de custo criado e disponível")
        await pg.fill('#pf-t','Bomba d’água fictícia'); await pg.select_option('#pf-c','Biblioteca'); await pg.fill('#pf-j','quebrou na semana passada'); await pg.click('#pf button.btn-large'); await pg.wait_for_selector('#acoes')
        p2=[x for x in await db(pg,'compras_ped') if x['numero']=='CMP-0002'][0]; ok(p2['origem']=='fora' and p2['justificativa'] and p2['centro']=='Biblioteca',"pedido avulso aceito com justificativa e no centro novo")
        # cancelar devolve o item do plano a 'Previsto' (pedido do telhado)
        await pg.click('[data-s="plano"]'); await pg.click('tr:has-text("Troca do telhado") [data-pp]'); await pg.click('#pf button.btn-large'); await pg.wait_for_selector('#acoes')
        RESP[0]='mudou o plano'; await pg.click('#a-can'); await pg.wait_for_selector('#d-v')
        pl=(await db(pg,'compras_plano',{}))[str(ANO)]; ok([i for i in pl['itens'] if i['titulo'].startswith('Troca')][0]['status']=='Previsto',"cancelar o pedido devolve o item ao planejamento")
        # fechar planejamento
        await pg.click('#d-v'); await pg.click('[data-s="plano"]'); await pg.wait_for_selector('#pl-fe')
        await pg.click('#pl-fe'); await pg.wait_for_selector('#pl-ab'); ok((await db(pg,'compras_plano',{}))[str(ANO)]['status']=='Fechado',"planejamento fechado pelo financeiro")
        # --- consolidado
        await pg.click('[data-s="cons"]'); await pg.wait_for_selector('#cn-a'); txt=await pg.inner_text('#cp-sub')
        ok('R$ 14.400,00' in txt and 'R$ 12.000,00' in txt and 'R$ 2.300,00' in txt and 'Manutenção' in txt and 'Eventos' in txt,"consolidado soma planejado e comprado por centro de custo")
        # --- planejamento ligado ao Previsto do orçamento (automático, soma ao digitado)
        await pg.evaluate("a=>{const o=PR_DADOS.db.get('orcamento',{});o[a]={'centro|D|Manutenção':[100,100,100,0,0,0,0,0,0,0,0,0]};PR_DADOS.db.set('orcamento',o);}",ANO)
        await aba(pg,'relatorios'); await pg.wait_for_selector('.rf-tab'); await pg.select_option('#rf-a',str(ANO)); await pg.select_option('#rf-mo','centro'); await pg.wait_for_selector('.rf-tab')
        pv=lambda k,m: pg.evaluate("([k,m])=>{const i=[...document.querySelectorAll('[data-b]')].find(x=>x.dataset.b===k&&x.dataset.m===String(m));return i?i.value:null}",[k,m])
        v=await pv('centro|D|Manutenção',2); ok(v=='12100',f"Previsto de março em Manutenção = 12.000 do plano + 100 digitado ({v})")
        v=await pv('centro|D|Eventos',4); ok(v=='2400',f"o item do plano em maio entra no Previsto de Eventos sem ninguém aplicar nada ({v})")
        await pg.select_option('#rf-mo','categoria'); await pg.wait_for_selector('.rf-tab')
        v=await pv('categoria|D|Reparos e Manutenção Predial',2); ok(v=='12000',f"na visão por categoria o plano também aparece ({v})")
        await pg.select_option('#rf-mo','centro'); await pg.wait_for_selector('.rf-tab')
        await pg.fill('[data-b="centro|D|Manutenção"][data-m="2"]','15000'); await pg.dispatch_event('[data-b="centro|D|Manutenção"][data-m="2"]','change')
        o=(await db(pg,'orcamento',{}))[str(ANO)]; ok(o['centro|D|Manutenção'][2]==3000,f"digitar 15.000 no mês guarda só a diferença para o plano ({o['centro|D|Manutenção'][2]})")
        await aba(pg,'compras'); await pg.click('[data-s="plano"]'); await pg.select_option('#pl-a',str(ANO)); await pg.click('tr:has-text("Troca do telhado") [data-ir]'); await pg.wait_for_timeout(200)
        await aba(pg,'relatorios'); await pg.wait_for_selector('.rf-tab'); await pg.select_option('#rf-a',str(ANO)); await pg.select_option('#rf-mo','centro'); await pg.wait_for_selector('.rf-tab')
        v=await pv('centro|D|Manutenção',2); ok(v=='3000',f"remover o item do plano baixa o Previsto junto; fica só o ajuste digitado ({v})")
        # --- papéis: solicitante (só os próprios pedidos, sem aprovar, sem consolidado)
        await pg.evaluate("(()=>{const u=PR_DADOS.db.get('users',[]);u[0].nivel='leitor';u[0].nome='Outra Pessoa';u[0].funcoes=['solicitante'];PR_DADOS.db.set('users',u);})()"); await pg.reload()
        tabs=await pg.eval_on_selector_all('[data-tab]','e=>e.map(x=>x.dataset.tab)')
        ok('compras' in tabs and 'contas' not in tabs and 'patrimonio' not in tabs,"solicitante vê Compras e Orçamento, mas não a Prestação de Contas nem o Patrimônio")
        await aba(pg,'compras'); subs=await pg.eval_on_selector_all('[data-s]','e=>e.map(x=>x.dataset.s)'); ok('cons' not in subs,"solicitante não vê o Consolidado")
        ok(await pg.locator('#cp-sub tbody tr').count()==0,"solicitante não vê pedidos de outras pessoas")
        await pg.click('#pd-n'); await pg.fill('#pf-t','Cadeira fictícia'); await pg.select_option('#pf-c','Eventos'); await pg.fill('#pf-j','faltou'); await pg.click('#pf button.btn-large'); await pg.wait_for_selector('#acoes')
        ok(await pg.locator('#a-apr, #a-env, #cf').count()==0,"solicitante pede mas não cota nem aprova")
        # compras: cota, mas não aprova
        await pg.evaluate("(()=>{const u=PR_DADOS.db.get('users',[]);u[0].funcoes=['compras'];PR_DADOS.db.set('users',u);})()"); await pg.reload()
        await aba(pg,'compras'); ok(await pg.locator('#cp-sub tbody tr').count()>=3,"Departamento de Compras vê todos os pedidos")
        await pg.click('tr:has-text("Cadeira fictícia") [data-v]'); await pg.wait_for_selector('#cf')
        await pg.fill('#cf-f','Loja C fictícia'); await pg.fill('#cf-v','300'); await pg.click('#cf button.btn-visit'); await pg.click('#a-env'); await pg.wait_for_selector('#d-v')
        ok(await pg.locator('#a-apr').count()==0 and (await pg.inner_text('#cp-sub')).count('Aguardando aprovação')>=1,"Departamento de Compras cota e envia, mas não aprova")
        ok(not net,f"nenhuma chamada de rede externa ({net[:2]})"); ok(not errs,f"sem erros de JavaScript ({errs[:1]})")
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print("ERROS JS: []")
