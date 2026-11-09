# Teste de tela do Patrimônio: marcar no Inventário (cadastro e botão rápido), campos opcionais, aba Patrimônio,
# número permanente e não reutilizado, categorias de consumo fora, retirada com motivo, histórico. Dados fictícios.
# Rodar a partir da pasta do site:  python3 tests/teste_patrimonio.py
import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen(["python3","-m","http.server","8774","-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def aba(pg,t):
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo')&&c.querySelector('.area-titulo').click();}",t)
    await pg.click(f'[data-tab="{t}"]')
async def cadastra(pg,nome,cat='mov',pat=False,valor='',plaq='',data=''):
    await pg.click('[data-s="cad"]'); await pg.select_option('#f-c',cat); await pg.fill('#f-n',nome); await pg.fill('#f-l','Sala fictícia')
    if pat:
        await pg.check('#f-pc')
        if valor: await pg.fill('#f-pv',valor)
        if plaq: await pg.fill('#f-pn2',plaq)
        if data: await pg.fill('#f-pda',data)
    await pg.click('#fi button.btn-large')
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
        pg.on("dialog",lambda d:asyncio.ensure_future(d.accept('lançado por engano') if d.type=='prompt' else d.accept()))
        net=[]; pg.on("request",lambda r:net.append(r.url) if not r.url.startswith("http://localhost:8774") and not r.url.startswith("data:") and 'cdnjs' not in r.url and 'fonts.' not in r.url else None)
        await pg.goto("http://localhost:8774/login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Admin Teste'); await pg.fill('#e','admin@teste.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        await aba(pg,'inventario')
        await cadastra(pg,'Cadeira comum fictícia')
        await pg.wait_for_selector('.tip-box')
        its=await pg.evaluate("PR_DADOS.db.get('inv_itens',[])"); ok(len(its)==1 and not its[0].get('patrimonio'),"item cadastrado sem marcar não vira patrimônio")
        await pg.click('[data-s="cad"]')
        await cadastra(pg,'Projetor fictício',pat=True,valor='1.250,50')
        await pg.wait_for_selector('.tip-box')
        it=[i for i in await pg.evaluate("PR_DADOS.db.get('inv_itens',[])") if i['nome']=='Projetor fictício'][0]
        ok(it['patrimonio'] and it['patNumero']=='PAT-0001',f"marcado no cadastro recebe PAT-0001 ({it.get('patNumero')})")
        ok(it['patValor']==1250.5 and not it.get('patAquisicao') and not it.get('patNF'),"valor gravado; data e nota fiscal ficam em aberto")
        # botão rápido na lista
        await pg.click('[data-s="consulta"]'); await pg.wait_for_selector('[data-pat]')
        await pg.click('[data-pat]'); await pg.wait_for_selector('.tip-box')
        c1=[i for i in await pg.evaluate("PR_DADOS.db.get('inv_itens',[])") if i['nome']=='Cadeira comum fictícia'][0]
        ok(c1['patrimonio'] and c1['patNumero']=='PAT-0002',f"botão + Patrimônio marca o item existente ({c1.get('patNumero')})")
        # consumo não entra
        await pg.click('[data-s="cad"]'); await pg.select_option('#f-c','lim')
        ok(await pg.is_disabled('#f-pc'),"material de limpeza e consumo não pode ser patrimônio")
        # plaqueta duplicada é recusada
        await pg.select_option('#f-c','mov'); await pg.fill('#f-n','Mesa fictícia'); await pg.fill('#f-l','Sala'); await pg.check('#f-pc'); await pg.fill('#f-pn2','PAT-0001'); await pg.click('#fi button.btn-large')
        er=await pg.inner_text('#f-er'); ok('já foi usado' in er,"número de patrimônio repetido é recusado")
        ok(len(await pg.evaluate("PR_DADOS.db.get('inv_itens',[])"))==2,"recusa não deixou item pela metade nem queimou código")
        # data futura recusada
        await pg.fill('#f-pn2','PLAQ-77'); await pg.evaluate("document.querySelector('#f-pda').removeAttribute('max')"); await pg.fill('#f-pda','2999-01-01'); await pg.click('#fi button.btn-large')
        ok('futuro' in await pg.inner_text('#f-er'),"data de aquisição no futuro é recusada")
        await pg.fill('#f-pda','2026-05-10'); await pg.fill('#f-pnf','NF 123'); await pg.click('#fi button.btn-large'); await pg.wait_for_selector('.tip-box')
        m=[i for i in await pg.evaluate("PR_DADOS.db.get('inv_itens',[])") if i['nome']=='Mesa fictícia'][0]
        ok(m['patNumero']=='PLAQ-77' and m['patAquisicao']=='2026-05-10' and m['patNF']=='NF 123',"plaqueta digitada, data e nota fiscal gravadas")
        # aba Patrimônio
        await aba(pg,'patrimonio'); await pg.wait_for_selector('#p-l .doc-table')
        n=await pg.locator('#p-l tbody tr').count(); ok(n==3,f"aba Patrimônio lista os 3 bens marcados ({n})")
        tot=await pg.inner_text('.totais'); ok('Sem valor informado' in tot,"totais da aba Patrimônio aparecem")
        await pg.select_option('#p-p','1'); n=await pg.locator('#p-l tbody tr').count(); ok(n==3,f"filtro 'dados em aberto' mostra os 3 bens, todos com algo em aberto ({n})")
        mesa=await pg.inner_text('#p-l tbody tr:has-text("Mesa fictícia")'); ok('valor' in mesa and 'nota fiscal' not in mesa,"a coluna 'Em aberto' diz só o que falta (mesa: só o valor)")
        await pg.select_option('#p-p',''); await pg.fill('#p-q','projetor'); n=await pg.locator('#p-l tbody tr').count(); ok(n==1,"busca por nome")
        await pg.fill('#p-q','')
        # Completar leva ao formulário de edição no Inventário
        await pg.click('[data-pe] >> nth=0'); await pg.wait_for_selector('#fi #f-pv')
        ok(await pg.is_checked('#f-pc'),"Completar abre a edição do item no Inventário com patrimônio marcado")
        # retirar do patrimônio com motivo; número fica reservado
        await pg.click('[data-s="consulta"]'); await pg.select_option('#i-pa','s')
        await pg.click('[data-ver] >> nth=0'); await pg.wait_for_selector('#d-pr'); await pg.click('#d-pr')
        its=await pg.evaluate("PR_DADOS.db.get('inv_itens',[])"); fora=[i for i in its if not i.get('patrimonio') and i.get('patNumero')]
        ok(len(fora)==1 and fora[0]['patSaiuMotivo']=='lançado por engano',"retirada exige motivo e fica registrada")
        reg=await pg.evaluate("PR_DADOS.db.get('inv_pat_cod',[])"); ok(len(reg)==3,"os números emitidos continuam no registro permanente")
        await pg.click('[data-s="cad"]'); await cadastra(pg,'Notebook fictício',pat=True); await pg.wait_for_selector('.tip-box')
        nb=[i for i in await pg.evaluate("PR_DADOS.db.get('inv_itens',[])") if i['nome']=='Notebook fictício'][0]
        ok(nb['patNumero']=='PAT-0003',f"número retirado não é reutilizado ({nb['patNumero']})")
        mov=[x for x in await pg.evaluate("PR_DADOS.db.get('inv_mov',[])") if x['tipo']=='Patrimônio']; ok(len(mov)>=5,f"histórico registra as marcações e a retirada ({len(mov)})")
        ok(not net,f"nenhuma chamada de rede externa ({net[:2]})"); ok(not errs,f"sem erros de JavaScript ({errs[:1]})")
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print("ERROS JS: []")
