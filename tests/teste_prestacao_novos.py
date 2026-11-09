# Teste de tela da Prestação de Contas: novo centro de custo, novo tipo de operação, nome da pessoa e "lançado por".
# Dados fictícios, no navegador. Rodar a partir da pasta do site:  python3 tests/teste_prestacao_novos.py
import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen(["python3","-m","http.server","8776","-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def aba(pg,t):
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo')&&c.querySelector('.area-titulo').click();}",t)
    await pg.click(f'[data-tab="{t}"]')
RESP=['Cozinha']
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
        pg.on("dialog",lambda d:asyncio.ensure_future(d.accept(RESP[0]) if d.type=='prompt' else d.accept()))
        net=[]; pg.on("request",lambda r:net.append(r.url) if not r.url.startswith("http://localhost:8776") and not r.url.startswith("data:") and 'cdnjs' not in r.url and 'fonts.' not in r.url else None)
        await pg.goto("http://localhost:8776/login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Maria Tesoureira'); await pg.fill('#e','maria@teste.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        await aba(pg,'contas'); await pg.wait_for_selector('#c-ncc')
        # centro de custo novo
        await pg.click('#c-ncc'); await pg.wait_for_function("document.querySelector('#c-cc').value==='Cozinha'")
        ok('Cozinha' in await pg.evaluate("PR_DADOS.db.get('cc_extra',{})"),"novo centro de custo criado e já selecionado")
        RESP[0]='cozinha'; await pg.click('#c-ncc'); ok(len(await pg.evaluate("Object.keys(PR_DADOS.db.get('cc_extra',{}))"))==1,"centro de custo repetido é recusado")
        # novo tipo de operação (saída, grupo novo, centro sugerido)
        await pg.click('#c-nt'); await pg.select_option('#nt-t','Saída'); await pg.select_option('#nt-g','__novo'); await pg.fill('#nt-gn','Cozinha e refeitório'); await pg.fill('#nt-n','Gás de cozinha extra'); await pg.select_option('#nt-c','Cozinha'); await pg.click('#nt-s')
        await pg.wait_for_function("document.querySelector('#c-t').value==='Saída|Gás de cozinha extra'")
        ex=await pg.evaluate("PR_DADOS.db.get('plano_extra',[])"); ok(len(ex)==1 and ex[0]['grupo']=='Cozinha e refeitório' and ex[0]['por']=='Maria Tesoureira',"novo tipo de operação guardado com grupo e quem criou")
        ok(await pg.evaluate("document.querySelector('#c-cc').value")=='Cozinha',"centro de custo sugerido foi preenchido")
        await pg.click('#c-nt'); await pg.select_option('#nt-t','Saída'); await pg.fill('#nt-n','gás de cozinha extra'); await pg.click('#nt-s')
        ok('Já existe' in await pg.inner_text('#nt-e'),"tipo repetido é recusado")
        await pg.click('#nt-x')
        # novo tipo de entrada em grupo existente
        await pg.click('#c-nt'); await pg.select_option('#nt-t','Entrada'); await pg.select_option('#nt-g','Outras entradas'); await pg.fill('#nt-n','Venda de sucata'); await pg.click('#nt-s')
        await pg.wait_for_function("document.querySelector('#c-t').value==='Entrada|Venda de sucata'")
        ok('Venda de sucata' in await pg.evaluate("PR_PLANO.ENTRADAS.flatMap(g=>g.itens)"),"tipo novo entra no plano de contas")
        # pessoa: sugere o nome de quem está logado
        ok(await pg.evaluate("[...document.querySelectorAll('#c-pl option')].map(o=>o.value).includes('Maria Tesoureira')"),"o nome de quem está logado é sugerido no campo Pessoa / contribuinte")
        await pg.click('#c-eu'); ok(await pg.input_value('#c-p')=='Maria Tesoureira',"botão 'Sou eu' preenche o nome")
        # lança a entrada com o tipo novo e confere 'lançado por'
        await pg.fill('#c-v','75'); await pg.click('#fc button.btn-large'); await pg.wait_for_selector('.doc-table')
        c=(await pg.evaluate("PR_DADOS.db.get('contas',[])"))[-1]; ok(c['origem']=='Venda de sucata' and c['por']=='Maria Tesoureira' and c['pessoa']=='Maria Tesoureira',"lançamento guarda o tipo novo, a pessoa e quem lançou")
        ok('Lançado por Maria Tesoureira' in await pg.inner_text('body'),"a lista mostra 'Lançado por'")
        # recarrega: tipos e centro continuam
        await pg.reload(); await aba(pg,'contas'); await pg.wait_for_selector('#c-nt')
        ok(await pg.evaluate("[...document.querySelectorAll('#c-t option')].some(o=>o.value==='Saída|Gás de cozinha extra')") and await pg.evaluate("[...document.querySelectorAll('#c-cc option')].some(o=>o.value==='Cozinha')"),"depois de recarregar, o centro e os tipos criados continuam")
        # aparece no Orçamento e Fluxo
        await aba(pg,'relatorios'); await pg.wait_for_selector('.rf-tab'); tab=(await pg.inner_text('.rf-tab')).lower()
        ok('gás de cozinha extra' in tab and 'venda de sucata' in tab and 'cozinha e refeitório' in tab,"os tipos criados aparecem no Orçamento e Fluxo Financeiro")
        lin=await pg.evaluate("n=>{const r=[...document.querySelectorAll('.rf-tab tr')].find(r=>r.querySelector('th')&&r.querySelector('th').innerText.replace(/[▾▸]/g,'').trim()===n);return r?r.innerText:''}",'Venda de sucata')
        ok('75' in lin,"a entrada lançada no tipo novo entra no realizado do Orçamento")
        ok(not net,f"nenhuma chamada de rede externa ({net[:2]})"); ok(not errs,f"sem erros de JavaScript ({errs[:1]})")
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print("ERROS JS: []")
