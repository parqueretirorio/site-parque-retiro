# Teste: comissões internas Construção, Manutenção e Traduções (só na área restrita) e o novo nome "Alojamento".
# Rodar a partir da pasta do site:  python3 tests/teste_comissoes_internas.py
import asyncio, subprocess, time, os, glob
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT=8833
srv=subprocess.Popen(["python3","-m","http.server",str(PORT),"-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
U=f"http://localhost:{PORT}/"
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def aba(pg,t):
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo').click()}",t)
    await pg.click(f'[data-tab="{t}"]')
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("dialog",lambda d:asyncio.ensure_future(d.accept()))
        # ---------- site público: as comissões novas não aparecem ----------
        publicas=[f for f in glob.glob(os.path.join(SITE,'*.html')) if os.path.basename(f) not in ('area-restrita.html',)]
        achou=[os.path.basename(f) for f in publicas if any(x in open(f,encoding='utf-8').read() for x in ('comissao-construcao','comissao-manutencao','comissao-traducoes','Comissão Traduções'))]
        ok(not achou,"nenhuma página pública cita as comissões novas")
        await pg.goto(U+"comissoes.html"); t=await pg.inner_text('main') if await pg.locator('main').count() else await pg.inner_text('body')
        ok('Traduções' not in t and 'Manutenção' not in t,"página pública Comissões continua sem elas")
        # ---------- área restrita: administrador ----------
        await pg.goto(U+"login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Admin Teste'); await pg.fill('#e','a@t.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        ok('Alojamento' in await pg.inner_text('[data-tab=reservas]'),"aba de reservas agora se chama Alojamento")
        ok((await pg.inner_text('[data-tab=reservas]')).strip()=='Alojamento' and await pg.locator('text=Reservas de Alojamento').count()==0 and await pg.locator('text=Apenas Alojamento').count()==0,"os nomes antigos não aparecem no menu")
        for k,n in [('construcao','Construção'),('manutencao','Manutenção'),('traducoes','Traduções')]:
            ok(await pg.evaluate(f"!!document.querySelector('.area-col[data-area=com] [data-tab={k}]')"),f"{n} está em Comissões Parque Retiro")
            ok(await pg.evaluate(f"!document.querySelector('[data-tab={k}]').closest('.area-grupo')"),f"{n} fica direto em Comissões (fora de grupos)")
            ok(n in await pg.inner_text(f'[data-tab={k}]'),f"rótulo da aba: {n}")
        # Construção
        await aba(pg,'construcao'); ok('Obras e etapas' in await pg.inner_text('#tab'),"Construção abre em Obras e etapas")
        await pg.click('#ci-f button.btn-large'); ok('título' in (await pg.inner_text('#ci-er')).lower(),"exige título")
        await pg.fill('#ci-t','Cobertura do Centro de Estudo'); await pg.fill('#ci-i','2026-12-10'); await pg.fill('#ci-fi','2026-12-01'); await pg.click('#ci-f button.btn-large')
        ok('não pode ser antes' in (await pg.inner_text('#ci-er')),"valida fim antes do início")
        await pg.fill('#ci-fi','2027-01-20'); await pg.fill('#ci-local','Centro de Estudo'); await pg.fill('#ci-custo','12500.50'); await pg.fill('#ci-voluntarios','8'); await pg.click('#ci-f button.btn-large'); await pg.wait_for_selector('text=Registro adicionado')
        it=await pg.evaluate("PR_DADOS.db.get('constr_itens',[])"); ok(len(it)==1 and it[0]['custo']==12500.5 and it[0]['voluntarios']==8,"obra gravada com custo e voluntários")
        ok('R$ 12.500,50' in await pg.inner_text('#tab'),"custo aparece formatado")
        await pg.click('[data-ed]'); await pg.select_option('#ci-s','Em andamento'); await pg.click('#ci-f button.btn-large'); await pg.wait_for_selector('text=Registro atualizado')
        ok(await pg.evaluate("PR_DADOS.db.get('constr_itens',[])[0].status")=='Em andamento',"edição altera a situação")
        await pg.click('[data-s="docs"]'); await pg.fill('#cd-t','Planta do telhado'); await pg.click('#ci-fd button.btn-large'); ok('link ou anexe' in await pg.inner_text('#cd-er'),"documento exige link ou arquivo")
        await pg.fill('#cd-l','https://drive.google.com/x'); await pg.click('#ci-fd button.btn-large'); await pg.wait_for_selector('text=Documento adicionado')
        ok(len(await pg.evaluate("PR_DADOS.db.get('constr_docs',[])"))==1,"documento gravado em constr_docs")
        await pg.click('[data-s="resumo"]'); t=await pg.inner_text('#tab'); ok('Resumo da comissão Construção' in t and 'R$ 12.500,50' in t,"resumo com custo estimado")
        # Manutenção
        await aba(pg,'manutencao'); ok('Pedidos de manutenção' in await pg.inner_text('#tab'),"Manutenção abre em Pedidos de manutenção")
        ok(await pg.input_value('#ci-i')!='',"data do pedido já vem preenchida com hoje")
        await pg.fill('#ci-t','Trocar torneira da cozinha'); await pg.select_option('#ci-prioridade','Urgente'); await pg.select_option('#ci-tipoMan',index=0); await pg.click('#ci-f button.btn-large'); await pg.wait_for_selector('text=Registro adicionado')
        m=await pg.evaluate("PR_DADOS.db.get('manut_itens',[])"); ok(len(m)==1 and m[0]['prioridade']=='Urgente' and m[0]['status']=='Aberto',"pedido gravado: urgente e aberto")
        await pg.click('[data-s="resumo"]'); ok('Alta ou urgente' in await pg.inner_text('#tab'),"resumo da manutenção mostra prioridade")
        # Traduções
        await aba(pg,'traducoes'); ok('Traduções' in await pg.inner_text('#tab h3'),"Traduções abre na lista de traduções")
        await pg.fill('#ci-t','Folheto de boas-vindas'); await pg.select_option('#ci-origem','Português'); await pg.select_option('#ci-destino','Português'); await pg.click('#ci-f button.btn-large')
        ok('diferente' in await pg.inner_text('#ci-er'),"idiomas de origem e destino precisam ser diferentes")
        await pg.select_option('#ci-destino','Italiano'); await pg.fill('#ci-link','ftp://x'); await pg.click('#ci-f button.btn-large'); ok('http' in await pg.inner_text('#ci-er'),"link precisa ser http(s)")
        await pg.fill('#ci-link','https://drive.google.com/folheto'); await pg.fill('#ci-r','Maria'); await pg.fill('#ci-revisor','João'); await pg.click('#ci-f button.btn-large'); await pg.wait_for_selector('text=Registro adicionado')
        tr=await pg.evaluate("PR_DADOS.db.get('trad_itens',[])"); ok(len(tr)==1 and tr[0]['destino']=='Italiano' and tr[0]['revisor']=='João' and tr[0]['status']=='A fazer',"tradução gravada")
        ok(await pg.locator('#tab a[href="https://drive.google.com/folheto"]').count()==1,"link do material aparece na lista")
        # Relatórios Consolidados
        await aba(pg,'relatorios'); await pg.click('#tab [data-ab]:not([data-ab=fin]):not([data-ab=graf])'); t=await pg.inner_text('#tab')
        ok(all(x in t for x in ['Construção','Manutenção','Traduções']),"as três comissões estão nos Relatórios Consolidados")
        # Gestão de Responsáveis: as três responsabilidades novas
        await aba(pg,'users'); t=await pg.inner_text('#tab')
        ok('Responsável pela Construção' in t and 'Responsável pela Manutenção' in t and 'Responsável pelas Traduções' in t,"Gestão de Responsáveis oferece as três responsabilidades")
        # ---------- usuário sem a responsabilidade não vê; com a responsabilidade vê só a sua ----------
        await pg.evaluate("""()=>{const l=PR_DADOS.db.get('users',[]);l.push({email:'m@t.com',nome:'Mestre Teste',nivel:'leitor',status:'aprovado',funcoes:['traducoes'],whatsapp:'21988887777',lgpd:{aceite:true}});PR_DADOS.db.set('users',l);sessionStorage.setItem('pr_sess','m@t.com')}""")
        await pg.goto(U+"area-restrita.html"); await pg.wait_for_selector('[data-tab]')
        ok(await pg.locator('[data-tab=traducoes]').count()==1,"responsável pelas Traduções vê Traduções")
        ok(await pg.locator('[data-tab=construcao]').count()==0 and await pg.locator('[data-tab=manutencao]').count()==0,"e não vê Construção nem Manutenção")
        ok(not errs,"sem erros de JavaScript: "+"; ".join(errs))
        await b.close()
try: asyncio.run(main()); print("\nTODOS OS TESTES PASSARAM")
finally: srv.terminate()
