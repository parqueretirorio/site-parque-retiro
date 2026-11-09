# Teste de tela: Prestação de Contas -> Patrimônio (criar bens da compra, vincular a bens já cadastrados, lançamento removido,
# função Responsável Financeiro). Dados fictícios, no navegador.
# Rodar a partir da pasta do site:  python3 tests/teste_patrimonio_compras.py
import asyncio, subprocess, time, os, datetime
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen(["python3","-m","http.server","8775","-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
HOJE=datetime.date.today().isoformat()
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def aba(pg,t):
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo')&&c.querySelector('.area-titulo').click();}",t)
    await pg.click(f'[data-tab="{t}"]')
async def lanca(pg,desc,valor,pat=False,tipo='Saída|Ferramentas e Equipamentos'):
    await pg.select_option('#c-t',tipo); await pg.select_option('#c-cc','Manutenção'); await pg.fill('#c-v',str(valor)); await pg.fill('#c-d',HOJE); await pg.fill('#c-s',desc)
    if pat: await pg.check('#c-pt')
    await pg.click('#fc button.btn-large')
async def itens(pg): return await pg.evaluate("PR_DADOS.db.get('inv_itens',[])")
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("dialog",lambda d:asyncio.ensure_future(d.accept()))
        net=[]; pg.on("request",lambda r:net.append(r.url) if not r.url.startswith("http://localhost:8775") and not r.url.startswith("data:") and 'cdnjs' not in r.url and 'fonts.' not in r.url else None)
        await pg.goto("http://localhost:8775/login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Admin Teste'); await pg.fill('#e','admin@teste.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        # bens já cadastrados antes (compras antigas): um já no patrimônio sem nota fiscal, outro com nota diferente, outro fora do patrimônio
        await aba(pg,'inventario')
        for nome,pat in [('Armário antigo fictício',True),('Estante antiga fictícia',False)]:
            await pg.click('[data-s="cad"]'); await pg.fill('#f-n',nome); await pg.fill('#f-l','Depósito')
            if pat: await pg.check('#f-pc')
            await pg.click('#fi button.btn-large'); await pg.wait_for_selector('.tip-box')
        await pg.evaluate("(()=>{const l=PR_DADOS.db.get('inv_itens',[]);const a=l.find(i=>i.nome.startsWith('Armário'));a.patNF='NF ANTIGA';PR_DADOS.db.set('inv_itens',l);})()")
        await pg.click('[data-s="cad"]'); await pg.fill('#f-n','Banco antigo fictício'); await pg.fill('#f-l','Depósito'); await pg.check('#f-pc'); await pg.click('#fi button.btn-large'); await pg.wait_for_selector('.tip-box')
        antes=len(await itens(pg)); ok(antes==3,"3 bens antigos cadastrados")
        # compra nova com 6 unidades
        await aba(pg,'contas'); await lanca(pg,'Compra de cadeiras fictícias',600,pat=True)
        await pg.wait_for_selector('#pp-f')
        await pg.fill('#pp-n','Cadeira fictícia'); await pg.fill('#pp-q','6'); await pg.fill('#pp-l','Sala'); await pg.fill('#pp-nf','NF 555'); await pg.click('#pp-f button.btn-visit')
        await pg.wait_for_selector('#pt-painel .tip-box')
        its=await itens(pg); ch=[i for i in its if i['nome']=='Cadeira fictícia']
        ok(len(ch)==6 and all(i['patrimonio'] for i in ch),"6 unidades viraram 6 bens, todos no patrimônio")
        ok(len({i['patNumero'] for i in ch})==6 and len({i['codigo'] for i in ch})==6,"cada bem tem código e número de patrimônio próprios")
        ok(all(i['patNF']=='NF 555' and i['patValor']==100 and i['patOrigem']=='Compra' and i['patAquisicao']==HOJE for i in ch),"nota fiscal, valor (600/6), origem e data gravados em cada bem")
        lanc=(await pg.evaluate("PR_DADOS.db.get('contas',[])"))[0]
        ok(all(i['patLancamento']==lanc['id'] for i in ch),"cada bem guarda o vínculo com o lançamento")
        # arredondamento: 100 / 3
        await pg.click('#pp-x'); await lanca(pg,'Compra de bancos fictícios',100,pat=True); await pg.wait_for_selector('#pp-f')
        await pg.fill('#pp-n','Banco novo fictício'); await pg.fill('#pp-q','3'); await pg.fill('#pp-l','Jardim'); await pg.click('#pp-f button.btn-visit'); await pg.wait_for_selector('#pt-painel .tip-box')
        bn=sorted(i['patValor'] for i in await itens(pg) if i['nome']=='Banco novo fictício'); ok(bn==[33.33,33.33,33.34] and round(sum(bn),2)==100,f"valor dividido fecha o centavo ({bn})")
        # compra antiga: vincular sem duplicar
        await pg.click('#pp-x'); await lanca(pg,'Compra antiga do armário e do banco',90); 
        await pg.click('tr:has-text("Compra antiga do armário") [data-pt]'); await pg.wait_for_selector('[data-pm="vinc"]'); await pg.click('[data-pm="vinc"]')
        await pg.fill('#pp-b','antigo'); n_antes=len(await itens(pg))
        await pg.check('[data-pc] >> nth=0'); await pg.check('[data-pc] >> nth=1'); await pg.fill('#pp-nf2','NF 900'); await pg.click('#pp-vb'); await pg.wait_for_selector('#pt-painel .tip-box')
        its=await itens(pg); ok(len(its)==n_antes,"vincular não cria bem duplicado")
        lg=[i for i in its if i.get('patLancamento') and i['nome'].endswith('antigo fictício')]; ok(len(lg)==2,f"dois bens antigos vinculados ({len(lg)})")
        arm=[i for i in its if i['nome'].startswith('Armário')][0]; ban=[i for i in its if i['nome'].startswith('Banco antigo')][0]
        ok(arm['patNF']=='NF ANTIGA',"nota fiscal já existente não é sobrescrita")
        ok(ban["patNF"]=="NF 900" and ban['patValor']==45 and ban['patAquisicao']==HOJE,"nota fiscal, valor (90/2) e data preenchidos onde estavam em aberto")
        ok('mantida' in await pg.inner_text('#pt-painel .tip-box'),"o aviso diz o que foi mantido")
        # bem fora do patrimônio vinculado vira patrimônio
        await pg.click('#pp-x'); await lanca(pg,'Compra antiga da estante',50); await pg.click('tr:has-text("Compra antiga da estante") [data-pt]'); await pg.click('[data-pm="vinc"]'); await pg.fill('#pp-b','Estante')
        await pg.check('[data-pc] >> nth=0'); await pg.fill('#pp-nf2','NF 901'); await pg.click('#pp-vb'); await pg.wait_for_selector('#pt-painel .tip-box')
        est=[i for i in await itens(pg) if i['nome'].startswith('Estante')][0]; ok(est['patrimonio'] and est['patNumero'] and est['patNF']=='NF 901',f"bem que não era patrimônio entra com número ({est.get('patNumero')})")
        # desvincular
        await pg.click('[data-dv] >> nth=0'); est=[i for i in await itens(pg) if i['nome'].startswith('Estante')][0]
        ok(not est.get('patLancamento') and est['patrimonio'] and est['patNF']=='NF 901',"desvincular mantém o bem e a nota fiscal")
        await pg.click('#pp-x')
        # excluir lançamento da compra das cadeiras: bens ficam
        total=len(await itens(pg)); await pg.click(f'[data-del="{lanc["id"]}"]'); await pg.wait_for_timeout(300)
        its=await itens(pg); ch=[i for i in its if i['nome']=='Cadeira fictícia']
        ok(len(its)==total and len(ch)==6 and all(i['patrimonio'] and i.get('patLancRemovido') for i in ch),"excluir o lançamento não apaga os bens: ficam marcados 'lançamento removido'")
        # função Responsável Financeiro: vê Prestação de Contas e lança patrimônio, sem ser responsável pelo Inventário nem ver a aba Patrimônio
        await pg.evaluate("(()=>{const u=PR_DADOS.db.get('users',[]);u[0].nivel='leitor';u[0].funcoes=['financeiro'];PR_DADOS.db.set('users',u);})()"); await pg.reload()
        await pg.wait_for_selector('[data-tab]'); tabs=await pg.eval_on_selector_all('[data-tab]','e=>e.map(x=>x.dataset.tab)')
        ok('contas' in tabs and 'patrimonio' not in tabs,f"Responsável Financeiro vê Prestação de Contas e não vê a aba Patrimônio")
        await aba(pg,'contas'); await lanca(pg,'Compra pelo financeiro',30,pat=True); await pg.wait_for_selector('#pp-f')
        await pg.fill('#pp-n','Ventilador fictício'); await pg.fill('#pp-l','Sala'); await pg.click('#pp-f button.btn-visit'); await pg.wait_for_selector('#pt-painel .tip-box')
        ok(any(i['nome']=='Ventilador fictício' and i['patrimonio'] for i in await itens(pg)),"o financeiro cria bem no patrimônio a partir da compra")
        ok(not net,f"nenhuma chamada de rede externa ({net[:2]})"); ok(not errs,f"sem erros de JavaScript ({errs[:1]})")
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print("ERROS JS: []")
