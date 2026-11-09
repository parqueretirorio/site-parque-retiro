# Teste da Vaquinha Coletiva: cadastro da vaquinha (objetivo, meta, formas de ajuda), contribuição pública com valor livre e comprovante,
# conferência, gráfico (% e valores), lançamento em Prestação de Contas e planilha consolidada ("Ajude o Parque"), estorno, recusa,
# registro manual, renomeação, encerramento, prazo e meta superada.
# Rodar a partir da pasta do site:  python3 tests/teste_vaquinha.py
import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen(["python3","-m","http.server","8776","-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def aba(pg,t,**k):
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo').click()}",t)
    await pg.evaluate("t=>{const g=document.querySelector(`[data-tab=${t}]`).closest('.area-grupo');if(g&&!g.classList.contains('aberto'))g.querySelector('.area-grupo-bt').click()}",t)
    await pg.click(f'[data-tab="{t}"]',**k)
async def grafico(pub):
    return await pub.get_attribute('.vq-grafico','aria-label')
async def contribui(pub,nome,cel,email,valor,arq,moeda=None):
    await pub.click('[data-sel]'); await pub.wait_for_selector('#vq-form')
    await pub.fill('#q-n',nome); await pub.fill('#q-c',cel); await pub.check('#q-mesmo'); await pub.fill('#q-e',email); await pub.fill('#q-v',str(valor))
    if moeda: await pub.select_option('#q-m',moeda)
    await pub.set_input_files('#q-f',SITE+'/tests/imagens/'+arq); await pub.check('#q-ok')
    await pub.click('#vq-form button.btn-large'); await pub.wait_for_selector('.rifa-ok')
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page()  # sem a importação automática das planilhas de nov/2026 (o teste parte de um caixa vazio)
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("dialog",lambda x:asyncio.ensure_future(x.accept("motivo de teste")))
        await pg.goto("http://localhost:8776/login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Admin Teste'); await pg.fill('#e','a@t.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        ok(await pg.evaluate("!!document.querySelector('.area-col[data-area=com] [data-tab=vaquinha]')"),"Vaquinha Coletiva está dentro de Comissões Parque Retiro")
        await aba(pg,'vaquinha')
        # --- cadastro da vaquinha ---
        await pg.click('#fv button.btn-large'); ok('nome da vaquinha' in (await pg.inner_text('#v-er')).lower(),"valida nome da vaquinha")
        await pg.fill('#v-t','Vaquinha Manutenção da Grama'); await pg.click('#fv button.btn-large'); ok('objetivo' in (await pg.inner_text('#v-er')).lower(),"exige objetivo")
        await pg.fill('#v-o','Pagar o corte e a adubação da grama do Parque até dezembro.'); await pg.click('#fv button.btn-large'); ok('meta' in (await pg.inner_text('#v-er')).lower(),"exige meta")
        await pg.fill('#v-m','1000'); await pg.click('#fv button.btn-large'); ok('instruções' in (await pg.inner_text('#v-er')).lower(),"exige instruções de pagamento")
        await pg.fill('#v-i','PIX CNPJ 00.000.000/0001-00 Instituto Pangeia'); await pg.fill('#v-x','Também aceitamos dias de trabalho voluntário na horta.')
        await pg.check('[name=vm][value=MUMBUCA]')
        await pg.click('#fv button.btn-large'); await pg.wait_for_selector('text=Vaquinha cadastrada')
        v=await pg.evaluate("PR_DADOS.db.get('vaquinhas',[])[0]")
        ok(v['meta']==1000 and v['ativa'] and v['moedas']==['PIX','MUMBUCA'] and 'grama' in v['objetivo'],"vaquinha gravada com meta R$ 1.000, aberta, PIX e M$")
        # --- site público ---
        pub=await ctx.new_page(); pub.on("pageerror",lambda e:errs.append(str(e)))
        await pub.goto("http://localhost:8776/vaquinha-coletiva.html"); await pub.wait_for_selector('.vq-card')
        txt=await pub.inner_text('.vq-card')
        ok('Manutenção da Grama' in txt and 'adubação' in txt,"página pública mostra nome e objetivo")
        ok('PIX CNPJ' in txt and 'trabalho voluntário' in txt,"página pública mostra as formas de ajuda")
        g=await grafico(pub); ok('0%' in g and 'R$ 1.000,00' in g and 'faltam R$ 1.000,00' in g,"gráfico começa em 0% com meta e falta de R$ 1.000,00")
        await pub.click('[data-sel]'); await pub.wait_for_selector('#vq-form')
        await pub.click('#vq-form button.btn-large'); ok('nome completo' in (await pub.inner_text('#q-er')).lower(),"valida nome completo")
        await pub.fill('#q-n','Maria da Silva Souza'); await pub.click('#vq-form button.btn-large'); ok('celular' in (await pub.inner_text('#q-er')).lower(),"valida celular")
        await pub.fill('#q-c','(21) 99999-1111'); await pub.check('#q-mesmo'); await pub.click('#vq-form button.btn-large'); ok('e-mail' in (await pub.inner_text('#q-er')).lower(),"valida e-mail")
        await pub.fill('#q-e','maria@x.com'); await pub.click('#vq-form button.btn-large'); ok('valor' in (await pub.inner_text('#q-er')).lower(),"exige valor")
        await pub.fill('#q-v','250'); await pub.click('#vq-form button.btn-large'); ok('comprovante' in (await pub.inner_text('#q-er')).lower(),"exige comprovante")
        await pub.set_input_files('#q-f',SITE+'/tests/imagens/ok2.png'); await pub.click('#vq-form button.btn-large'); ok('concordar' in await pub.inner_text('#q-er'),"exige consentimento (LGPD)")
        await pub.check('#q-ok'); await pub.click('#vq-form button.btn-large'); await pub.wait_for_selector('.rifa-ok')
        part=await pub.evaluate("PR_DADOS.db.get('vaq_part',[])[0]")
        ok(part['valor']==250 and part['status']=='pendente' and part['comprovante'].startswith('data:image') and part['whatsapp']=='(21) 99999-1111' and part['email']=='maria@x.com',"contribuição gravou valor livre, comprovante, celular, WhatsApp e e-mail; fica pendente")
        ok(await pub.evaluate("PR_DADOS.db.get('contas',[]).length")==0,"pendente ainda NÃO entra na Prestação de Contas")
        g=await grafico(pub); ok('0%' in g,"pendente ainda NÃO entra no gráfico")
        await contribui(pub,'Joao Pereira','21988887777','joao@x.com',100,'ok1.jpg','MUMBUCA')
        ok(await pub.evaluate("PR_DADOS.db.get('vaq_part',[]).length")==2,"segunda pessoa contribuiu com valor diferente, em M$")
        await pub.fill('#k-e','maria@x.com'); await pub.fill('#k-c','21999991111'); await pub.click('#vq-cons button'); await pub.wait_for_selector('#vq-cons ~ table')
        ok('Aguardando conferência' in await pub.inner_text('#vq-cons ~ table'),"consulta pública mostra a situação")
        # --- painel: conferir ---
        await aba(pg,'vaquinha'); await pg.click('[data-vq="contr"]'); await pg.wait_for_selector('[data-ok]')
        ok('Baixar' in await pg.inner_text('.doc-table'),"painel oferece o comprovante para conferência")
        linhas=await pg.evaluate("[...document.querySelectorAll('.doc-table tbody tr')].map(r=>r.textContent)")
        i250=[i for i,l in enumerate(linhas) if 'Maria' in l][0]
        await pg.click(f'[data-ok] >> nth={i250}'); await pg.wait_for_selector('text=Contribuição confirmada')
        contas=await pg.evaluate("PR_DADOS.db.get('contas',[])")
        ok(len(contas)==1 and contas[0]['origem']=='Vaquinha Coletiva' and contas[0]['tipo']=='Entrada' and contas[0]['valor']==250 and contas[0]['centro']=='Campanhas' and contas[0]['vaquinha']=='Vaquinha Manutenção da Grama',"confirmação lança Entrada/Vaquinha Coletiva (centro Campanhas, com o nome da vaquinha)")
        ok('Maria' not in contas[0]['desc'] and 'Joao' not in contas[0]['desc'],"lançamento financeiro não carrega nome do participante")
        await pub.reload(); await pub.wait_for_selector('.vq-card'); g=await grafico(pub)
        ok('25%' in g and 'Arrecadado R$ 250,00' in g and 'faltam R$ 750,00' in g,"gráfico atualiza: 25%, arrecadado R$ 250,00, faltam R$ 750,00")
        await pg.click('[data-ok]'); await pg.wait_for_selector('text=Contribuição confirmada')
        await pub.reload(); await pub.wait_for_selector('.vq-card'); g=await grafico(pub)
        ok('35%' in g and 'Arrecadado R$ 350,00' in g and 'faltam R$ 650,00' in g,"M$ soma 1 para 1: 35%, arrecadado R$ 350,00, faltam R$ 650,00")
        # --- planilha consolidada ---
        await aba(pg,'relatorios'); await pg.wait_for_selector('.rf-tab')
        linha=await pg.evaluate("[...document.querySelectorAll('.rf-tab tr')].filter(r=>r.textContent.includes('SUBTOTAL AJUDE'))[0].textContent")
        lr=await pg.evaluate("[...document.querySelectorAll('.rf-tab tr')].filter(r=>r.querySelector('.rf-ex')&&r.querySelector('.rf-ex').textContent.includes('Vaquinha Coletiva'))[0].textContent")
        ok('350,00' in lr,"linha Vaquinha Coletiva da planilha consolidada mostra 350,00")
        ok('350,00' in linha,"subtotal Ajude o Parque inclui o arrecadado da vaquinha (350,00)")
        # --- estorno e recusa ---
        await aba(pg,'vaquinha'); await pg.click('[data-vq="contr"]'); await pg.wait_for_selector('[data-no]')
        await pg.click('[data-no] >> nth=0'); await pg.wait_for_selector('text=Contribuição estornada')
        ok(await pg.evaluate("PR_DADOS.db.get('contas',[]).length")==1,"estorno remove o lançamento da Prestação de Contas")
        await pub.reload(); await pub.wait_for_selector('.vq-card'); g=await grafico(pub); ok('25%' in g or '10%' in g,"estorno tira o valor do gráfico")
        await contribui(pub,'Ana Lima Costa','21977776666','ana@x.com',80,'ok1.jpg')
        await aba(pg,'vaquinha'); await pg.click('[data-vq="contr"]'); await pg.wait_for_selector('[data-no]')
        linhas=await pg.evaluate("[...document.querySelectorAll('.doc-table tbody tr')].map(r=>r.textContent)")
        ia=[i for i,l in enumerate(linhas) if 'Ana Lima' in l][0]
        await pg.click(f'[data-no] >> nth={ia}'); await pg.wait_for_selector('text=Contribuição recusada')
        ok(await pg.evaluate("PR_DADOS.db.get('vaq_part',[]).filter(p=>p.status==='recusado').length")>=2 and await pg.evaluate("PR_DADOS.db.get('contas',[]).length")==1,"recusa não gera lançamento")
        # --- registro manual ---
        await pg.click('summary:has-text("Registrar contribuição manual")')
        await pg.fill('#m-n','Carlos Alberto'); await pg.fill('#m-w','21966665555'); await pg.fill('#m-q','50'); await pg.select_option('#m-m','ESPECIE')
        await pg.click('#fm button.btn-large'); await pg.wait_for_selector('text=registrada e confirmada')
        contas=await pg.evaluate("PR_DADOS.db.get('contas',[])")
        ok(len(contas)==2 and any(c['valor']==50 and c['moeda']=='ESPECIE' and c['origem']=='Vaquinha Coletiva' for c in contas),"registro manual entra confirmado e lançado (dinheiro em espécie)")
        # --- renomear acompanha os lançamentos ---
        await pg.click('[data-vq="vaq"]'); await pg.click('[data-ed]'); await pg.fill('#v-t','Vaquinha Grama e Jardim'); await pg.click('#fv button.btn-large'); await pg.wait_for_selector('text=Vaquinha atualizada')
        contas=await pg.evaluate("PR_DADOS.db.get('contas',[])")
        ok(all(c['vaquinha']=='Vaquinha Grama e Jardim' and 'Grama e Jardim' in c['desc'] for c in contas),"renomear a vaquinha atualiza os lançamentos já feitos")
        # --- meta superada ---
        await pg.click('[data-vq="contr"]'); await pg.click('summary:has-text("Registrar contribuição manual")')
        await pg.fill('#m-n','Doador Generoso'); await pg.fill('#m-w','21955554444'); await pg.fill('#m-q','1000'); await pg.click('#fm button.btn-large'); await pg.wait_for_selector('text=registrada e confirmada')
        await pub.reload(); await pub.wait_for_selector('.vq-card'); g=await grafico(pub)
        ok('meta alcançada' in g and '%' in g and 'faltam' not in g,"meta superada: gráfico indica meta alcançada")
        # --- aba Arrecadação ---
        await pg.click('[data-vq="arrec"]'); await pg.wait_for_selector('.vq-grafico')
        ok('Conferência: todas' in await pg.inner_text('#vq-sub'),"aba Arrecadação confere com a Prestação de Contas")
        # --- privacidade na página pública ---
        pt=await pub.inner_text('body')
        ok('99999-1111' not in pt and 'maria@x.com' not in pt and 'Carlos Alberto' not in pt,"página pública não expõe dados pessoais de ninguém")
        # --- encerrar / prazo ---
        await pg.click('[data-vq="vaq"]'); await pg.click('[data-enc]'); await pg.wait_for_selector('text=foi encerrada')
        await pub.reload(); await pub.wait_for_selector('.vq-card')
        ok(await pub.query_selector('[data-sel]') is None and 'Encerrada' in await pub.inner_text('.vq-card'),"encerrada: some o botão de contribuir e o resultado continua visível")
        await pg.click('[data-enc]'); await pg.wait_for_selector('text=foi reaberta')
        await pg.evaluate("()=>{const l=PR_DADOS.db.get('vaquinhas',[]);l[0].prazo='2000-01-01';PR_DADOS.db.set('vaquinhas',l)}")
        await pub.reload(); await pub.wait_for_selector('.vq-card')
        ok(await pub.query_selector('[data-sel]') is None and 'Prazo encerrado' in await pub.inner_text('.vq-card'),"prazo vencido: não recebe mais contribuições")
        # --- cancelar esconde do site ---
        await pg.evaluate("()=>{const l=PR_DADOS.db.get('vaquinhas',[]);l[0].prazo='';PR_DADOS.db.set('vaquinhas',l)}")
        await aba(pg,'vaquinha'); await pg.click('[data-can]'); await pg.wait_for_selector('text=Vaquinha cancelada')
        await pub.reload(); await pub.wait_for_selector('#vaquinhas')
        ok(await pub.query_selector('.vq-card') is None,"vaquinha cancelada some do site")
        ok(errs==[],"sem erros de JavaScript"); print("ERROS JS:",errs)
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
