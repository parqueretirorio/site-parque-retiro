# Teste da Lojinha: cadastro, publicação no site público, custos/preço, venda com lançamento automático e planilha consolidada.
# Rodar a partir da pasta do site:  python3 tests/teste_lojinha.py
import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen(["python3","-m","http.server","8774","-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def aba(pg,t,**k):
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo').click()}",t)
    await pg.evaluate("t=>{const g=document.querySelector(`[data-tab=${t}]`).closest('.area-grupo');if(g&&!g.classList.contains('aberto'))g.querySelector('.area-grupo-bt').click()}",t)
    await pg.click(f'[data-tab="{t}"]',**k)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("dialog",lambda d:asyncio.ensure_future(d.accept("5")))
        await pg.goto("http://localhost:8774/login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Admin Teste'); await pg.fill('#e','a@t.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        # Lojinha fica dentro de Comissões (e não em Administração)
        ok(await pg.evaluate("!!document.querySelector('.area-col[data-area=com] [data-tab=lojinha]')"),"Lojinha está dentro de Comissões Parque Retiro")
        await aba(pg,'lojinha')
        # cadastro de produto, publicado
        await pg.fill('#j-n','Caderno de oficina'); await pg.fill('#j-d','Caderno artesanal'); await pg.select_option('#j-o','produzido'); await pg.fill('#j-p','20'); await pg.fill('#j-e','10'); await pg.check('#j-pub')
        await pg.click('#fj button.btn-large'); await pg.wait_for_selector('text=Produto cadastrado')
        # produto oculto
        await pg.fill('#j-n','Broche oculto'); await pg.fill('#j-p','5'); await pg.fill('#j-e','3'); await pg.click('#fj button.btn-large'); await pg.wait_for_selector('.doc-table tbody tr >> nth=1')
        # custos e preço: custo 100 num lote de 20 => R$ 5,00/un; margem 100% => sugerido R$ 10,00
        await pg.click('[data-lj="custo"]'); await pg.select_option('#cu-i',label='Caderno de oficina')
        await pg.fill('#cu-d','Papel e capa'); await pg.fill('#cu-v','100'); await pg.click('#fcu button')
        await pg.fill('#cu-l','20'); await pg.fill('#cu-m','100'); await pg.wait_for_function("document.querySelector('#cu-res').textContent.includes('10,00')")
        txt=await pg.inner_text('#cu-res'); print(txt.replace("\n"," | ")); ok('5,00' in txt and '10,00' in txt,"custo unitário R$ 5,00 e preço sugerido R$ 10,00")
        await pg.click('#cu-a'); await pg.wait_for_selector('text=atualizado para')
        # venda: 3 x 10,00 (preço aplicado) em PIX
        await pg.click('[data-lj="venda"]'); await pg.select_option('#v-i',value=await pg.evaluate("[...document.querySelectorAll('#v-i option')].find(o=>o.textContent.includes('Caderno')).value")); await pg.dispatch_event('#v-i','change'); await pg.fill('#v-q','3'); await pg.click('#fv button.btn-large'); await pg.wait_for_selector('text=Venda registrada')
        contas=await pg.evaluate("PR_DADOS.db.get('contas',[])"); print(contas)
        ok(len(contas)==1 and contas[0]['origem']=='Lojinha' and contas[0]['tipo']=='Entrada' and contas[0]['valor']==30,"venda lançada em Prestação de Contas (Lojinha, Entrada, R$ 30)")
        est=await pg.evaluate("PR_DADOS.db.get('loja_itens',[]).find(i=>i.nome=='Caderno de oficina').estoque"); ok(est==7,"estoque baixou para 7")
        # planilha consolidada
        await aba(pg,'relatorios'); await pg.wait_for_selector('.rf-tab')
        t=await pg.inner_text('.rf-tab'); ok('SUBTOTAL AJUDE O PARQUE' in t and 'Lojinha' in t,"planilha consolidada tem o bloco Ajude o Parque com Lojinha")
        linha=await pg.evaluate("[...document.querySelectorAll('.rf-tab tr')].filter(r=>r.textContent.includes('SUBTOTAL AJUDE'))[0].textContent")
        ok('30,00' in linha,"subtotal Ajude o Parque mostra 30,00 ("+linha[:80]+")")
        # site público: só o produto publicado
        pub=await ctx.new_page(); await pub.goto("http://localhost:8774/lojinha.html"); await pub.wait_for_selector('.loja-card')
        nomes=await pub.eval_on_selector_all('.loja-card h3','e=>e.map(x=>x.textContent)'); print(nomes)
        ok(nomes==['Caderno de oficina'],"site público mostra só o produto publicado")
        ok('Fazer pedido por e-mail' in await pub.inner_text('body'),"texto original da Lojinha pública continua")
        # estorno devolve estoque e remove lançamento
        await aba(pg,'lojinha'); await pg.click('[data-lj="rel"]'); await pg.click('[data-es]'); await pg.wait_for_selector('text=Venda estornada')
        ok(await pg.evaluate("PR_DADOS.db.get('contas',[]).length")==0 and await pg.evaluate("PR_DADOS.db.get('loja_itens',[]).find(i=>i.nome=='Caderno de oficina').estoque")==10,"estorno remove o lançamento e devolve o estoque")
        print("ERROS JS:",errs); ok(not errs,"sem erros de JavaScript")
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
