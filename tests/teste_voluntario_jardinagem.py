# Teste de Voluntário (página pública Ajude o Parque) e Jardinagem / Área Externa (direto em Comissões Parque Retiro, na área restrita).
# Rodar a partir da pasta do site:  python3 tests/teste_voluntario_jardinagem.py
import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen(["python3","-m","http.server","8781","-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def aba(pg,t):
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo').click()}",t)
    await pg.evaluate("t=>{const g=document.querySelector(`[data-tab=${t}]`).closest('.area-grupo');if(g&&!g.classList.contains('aberto'))g.querySelector('.area-grupo-bt').click()}",t)
    await pg.click(f'[data-tab="{t}"]')
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("dialog",lambda d:asyncio.ensure_future(d.accept()))
        # ---------- público ----------
        await pg.goto("http://localhost:8781/ajude-o-parque.html")
        ok(await pg.is_visible('.content-grid a[href="voluntario.html"]'),"Ajude o Parque tem o cartão Voluntário")
        ok(await pg.evaluate("!!document.querySelector('.nav-sub a[href=\"voluntario.html\"]')"),"menu Ajude o Parque tem o link Voluntário")
        await pg.goto("http://localhost:8781/voluntario.html"); await pg.wait_for_selector('#vl-form')
        ok('sem precisar de dinheiro' in await pg.inner_text('.page-hero'),"página explica ajuda sem dinheiro")
        await pg.click('#vl-form button.btn-large'); ok('nome completo' in (await pg.inner_text('#v-er')).lower(),"valida nome completo")
        await pg.fill('#v-n','Ana Souza'); await pg.click('#vl-form button.btn-large'); ok('celular' in (await pg.inner_text('#v-er')).lower(),"valida celular")
        await pg.fill('#v-c','21999990000'); await pg.click('#vl-form button.btn-large'); ok('colaborar' in (await pg.inner_text('#v-er')).lower(),"exige ao menos uma forma de colaborar")
        await pg.check('#va-0'); await pg.check('#va-1'); await pg.click('#vl-form button.btn-large'); ok('concordar' in (await pg.inner_text('#v-er')).lower(),"exige consentimento")
        await pg.fill('#v-e','email-errado'); await pg.check('#v-ok'); await pg.click('#vl-form button.btn-large'); ok('e-mail' in (await pg.inner_text('#v-er')).lower(),"valida e-mail")
        await pg.fill('#v-e','ana@t.com'); await pg.select_option('#v-d',index=1); await pg.click('#vl-form button.btn-large'); await pg.wait_for_selector('.rifa-ok')
        v=await pg.evaluate("PR_DADOS.db.get('voluntarios',[])"); ok(len(v)==1 and v[0]['status']=='novo' and len(v[0]['areas'])==2 and v[0]['consentimento'],"inscrição gravada (novo, 2 áreas, consentimento)")
        ok('Ana' in await pg.inner_text('.rifa-ok'),"mensagem de agradecimento")
        # ---------- área restrita ----------
        await pg.goto("http://localhost:8781/login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Admin Teste'); await pg.fill('#e','a@t.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        ok(await pg.evaluate("!!document.querySelector('.area-col[data-area=com] [data-tab=jardinagem]')"),"Jardinagem / Área Externa está dentro de Comissões Parque Retiro")
        ok(await pg.evaluate("!document.querySelector('[data-tab=jardinagem]').closest('.area-grupo')"),"e direto em Comissões (não dentro de um grupo, nem de Voluntário)")
        ok(await pg.evaluate("!!document.querySelector('.area-col[data-area=com] [data-tab=comunicacao]')") and 'Site' in await pg.inner_text('[data-tab=comunicacao]'),"Comunicação, Redes Sociais e Site está direto em Comissões")
        ok(await pg.evaluate("!!document.querySelector('.area-grupo [data-tab=el_sala]')"),"grupo Elementos continua funcionando")
        # inscrições
        await aba(pg,'voluntarios'); t=await pg.inner_text('#tab'); ok('Ana Souza' in t and 'Jardinagem e área externa' in t,"inscrição aparece para o responsável")
        await pg.select_option('[data-st]','contato'); ok(await pg.evaluate("PR_DADOS.db.get('voluntarios',[])[0].status")=='contato',"muda a situação para Em contato")
        await pg.fill('[data-nt]','Ligar sábado'); await pg.dispatch_event('[data-nt]','change'); ok(await pg.evaluate("PR_DADOS.db.get('voluntarios',[])[0].nota")=='Ligar sábado',"grava anotação")
        # jardinagem
        await aba(pg,'jardinagem')
        await pg.click('#fp button.btn-large'); ok('título' in (await pg.inner_text('#p-er')).lower(),"planejamento exige título")
        await pg.fill('#p-t','Poda do jardim da Sala'); await pg.fill('#p-l','Entorno da Sala'); await pg.fill('#p-i','2026-11-10'); await pg.fill('#p-f','2026-11-01'); await pg.click('#fp button.btn-large')
        ok('fim' in (await pg.inner_text('#p-er')).lower(),"valida fim antes do início")
        await pg.fill('#p-f','2026-11-12'); await pg.fill('#p-v','6'); await pg.click('#fp button.btn-large'); await pg.wait_for_selector('text=Planejamento adicionado')
        ok(not await pg.is_visible('#p-e'),"jardinagem não mostra campos de espécies/mudas")
        await pg.click('[data-s="reflorestamento"]')
        await pg.fill('#p-t','Plantio de mudas nativas'); await pg.fill('#p-e','ipê, jerivá'); await pg.fill('#p-m','40'); await pg.fill('#p-v','10'); await pg.select_option('#p-s','Concluído'); await pg.click('#fp button.btn-large'); await pg.wait_for_selector('text=Planejamento adicionado')
        pl=await pg.evaluate("PR_DADOS.db.get('jard_planos',[])"); ok(sorted(x['tipo'] for x in pl)==['jardinagem','reflorestamento'],"planejamentos gravados por tipo")
        ok('Poda' not in await pg.inner_text('#jd-sub'),"aba de reflorestamento não lista os de jardinagem")
        await pg.click('[data-ed]'); await pg.fill('#p-m','55'); await pg.click('#fp button.btn-large'); await pg.wait_for_selector('text=atualizado')
        ok(await pg.evaluate("PR_DADOS.db.get('jard_planos',[]).find(x=>x.tipo=='reflorestamento').mudas")==55,"edição altera o planejamento")
        # documentos
        await pg.click('[data-s="docs"]'); await pg.fill('#d-t','Mapa da área externa'); await pg.fill('#d-l','javascript:alert(1)'); await pg.click('#fd button.btn-large')
        ok('http' in (await pg.inner_text('#d-er')),"rejeita link que não é http(s)")
        await pg.fill('#d-l','https://drive.google.com/mapa'); await pg.click('#fd button.btn-large'); await pg.wait_for_selector('text=Documento adicionado')
        ok(await pg.is_visible('#jd-sub a[href="https://drive.google.com/mapa"]'),"documento com link aparece")
        open('/tmp/mini.pdf','wb').write(b'%PDF-1.4\n%%EOF'); await pg.set_input_files('#d-f','/tmp/mini.pdf'); await pg.fill('#d-t','Projeto de reflorestamento'); await pg.click('#fd button.btn-large'); await pg.wait_for_selector('text=Baixar arquivo')
        ok(len(await pg.evaluate("PR_DADOS.db.get('jard_docs',[])"))==2,"documento com arquivo anexado")
        # resumo
        await pg.click('[data-s="resumo"]'); t=await pg.inner_text('#jd-sub'); ok('55' in t and 'Poda do jardim da Sala' in t,"resumo mostra mudas e próximas ações")
        # relatórios por módulo
        await aba(pg,'relatorios'); await pg.click('text=Relatórios por módulo'); opts=await pg.evaluate("[...document.querySelectorAll('#rc-m option')].map(o=>o.textContent)")
        ok('Jardinagem / Área Externa' in opts and 'Voluntários inscritos' in opts,"relatórios por módulo incluem Jardinagem e Voluntários")
        # responsabilidades
        await aba(pg,'users'); ok('Responsável pela Jardinagem' in await pg.inner_text('#tab') and 'Responsável pelos Voluntários' in await pg.inner_text('#tab'),"Gestão de Responsáveis oferece as duas novas funções")
        # permissão: editor só com a função jardinagem
        await pg.evaluate("(()=>{const l=PR_DADOS.db.get('users',[]);l[0].nivel='editor';l[0].funcoes=['jardinagem'];PR_DADOS.db.set('users',l)})()"); await pg.reload()
        ok(await pg.evaluate("!!document.querySelector('[data-tab=jardinagem]') && !document.querySelector('[data-tab=voluntarios]')"),"quem só tem a função Jardinagem não vê a aba Voluntários inscritos")
        await pg.evaluate("(()=>{const l=PR_DADOS.db.get('users',[]);l[0].nivel='leitor';l[0].funcoes=[];PR_DADOS.db.set('users',l)})()"); await pg.reload()
        ok(await pg.evaluate("!document.querySelector('[data-tab=jardinagem]') && !document.querySelector('[data-tab=voluntarios]') && !document.querySelector('.area-grupo-tit')||![...document.querySelectorAll('.area-grupo-tit')].some(x=>x.innerText.includes('Voluntário'))"),"leitor sem função não vê o grupo Voluntário")
        ok(not errs,"sem erros de JavaScript "+str(errs))
        await b.close()
try: asyncio.run(main()); print("TUDO OK")
finally: srv.terminate()
