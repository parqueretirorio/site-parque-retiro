# Teste da Rifa Solidária: cadastro, inscrição pública com comprovante, conferência, lançamento em Prestação de Contas,
# planilha consolidada, regra do sorteio (Loteria Federal), apuração manual e automática, anulação.
# Rodar a partir da pasta do site:  python3 tests/teste_rifa.py
import asyncio, subprocess, time, os, json, datetime
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen(["python3","-m","http.server","8775","-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def aba(pg,t,**k):
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo').click()}",t)
    await pg.evaluate("t=>{const g=document.querySelector(`[data-tab=${t}]`).closest('.area-grupo');if(g&&!g.classList.contains('aberto'))g.querySelector('.area-grupo-bt').click()}",t)
    await pg.click(f'[data-tab="{t}"]',**k)
d=datetime.date.today()+datetime.timedelta(days=1)
while d.weekday()!=2: d+=datetime.timedelta(days=1)   # próxima quarta-feira (dia de Loteria Federal)
QUARTA=d.isoformat()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("dialog",lambda x:asyncio.ensure_future(x.accept("motivo de teste")))
        await pg.goto("http://localhost:8775/login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Admin Teste'); await pg.fill('#e','a@t.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        ok(await pg.evaluate("!!document.querySelector('.area-col[data-area=com] [data-tab=rifa]')"),"Rifa Solidária está dentro de Comissões Parque Retiro")
        await aba(pg,'rifa')
        # --- cadastro da rifa ---
        await pg.fill('#r-t','Cesta orgânica'); await pg.fill('#r-d','Cesta com produtos da horta'); await pg.fill('#r-p','10'); await pg.fill('#r-dt',QUARTA); await pg.fill('#r-i','PIX CNPJ 00.000.000/0001-00 Instituto Pangeia')
        await pg.set_input_files('#r-f',SITE+'/tests/imagens/ok1.jpg')
        await pg.click('#fr button.btn-large'); await pg.wait_for_selector('text=Rifa cadastrada')
        r=await pg.evaluate("PR_DADOS.db.get('rifas',[])[0]")
        ok(r['total']==100 and r['digitos']==2 and r['preco']==10 and r['ativa'] and r['foto'].startswith('data:image'),"rifa gravada com foto, 100 números, R$ 10, aberta")
        # --- site público: inscrição com comprovante ---
        pub=await ctx.new_page(); pub.on("pageerror",lambda e:errs.append(str(e)))
        await pub.goto("http://localhost:8775/rifa-solidaria.html"); await pub.wait_for_selector('.rifa-card')
        ok('Cesta orgânica' in await pub.inner_text('.rifa-card') and await pub.query_selector('.rifa-card img.loja-foto') is not None,"página pública mostra a rifa com foto")
        await pub.click('[data-sel]'); await pub.wait_for_selector('#rifa-form')
        ok('PIX CNPJ' in await pub.inner_text('.rifa-pay'),"instruções de pagamento aparecem")
        await pub.click('#rifa-form button.btn-large'); ok('nome completo' in (await pub.inner_text('#p-er')).lower(),"valida nome completo")
        await pub.fill('#p-n','Maria da Silva Souza'); await pub.fill('#p-c','(21) 99999-1111'); await pub.check('#p-mesmo'); await pub.fill('#p-e','maria@x.com'); await pub.fill('#p-q','2')
        await pub.click('#rifa-form button.btn-large'); ok('comprovante' in (await pub.inner_text('#p-er')).lower(),"exige comprovante")
        await pub.set_input_files('#p-f',SITE+'/tests/imagens/ok2.png'); await pub.click('#rifa-form button.btn-large'); ok('concordar' in await pub.inner_text('#p-er'),"exige consentimento (LGPD)")
        await pub.check('#p-ok'); await pub.click('#rifa-form button.btn-large'); await pub.wait_for_selector('.rifa-ok')
        part=await pub.evaluate("PR_DADOS.db.get('rifa_part',[])[0]")
        ok(len(part['numeros'])==2 and part['status']=='pendente' and part['comprovante'].startswith('data:image') and part['total']==20 and part['whatsapp']=='(21) 99999-1111',"inscrição gravou 2 números, pendente, com comprovante, total 20 e WhatsApp")
        ok(await pub.evaluate("PR_DADOS.db.get('contas',[]).length")==0,"pendente ainda NÃO entra na Prestação de Contas")
        # segunda pessoa recebe números diferentes
        await pub.click('[data-sel]'); await pub.fill('#p-n','Joao Pereira'); await pub.fill('#p-c','21988887777'); await pub.fill('#p-w','21988887777'); await pub.fill('#p-e','joao@x.com'); await pub.fill('#p-q','3'); await pub.set_input_files('#p-f',SITE+'/tests/imagens/ok3.jpg'); await pub.check('#p-ok'); await pub.click('#rifa-form button.btn-large'); await pub.wait_for_selector('.rifa-ok')
        ps=await pub.evaluate("PR_DADOS.db.get('rifa_part',[])")
        todos=[n for q in ps for n in q['numeros']]; ok(len(ps)==2 and len(todos)==5 and len(set(todos))==5,"números nunca se repetem entre participantes")
        # consulta pública
        await pub.fill('#k-e','maria@x.com'); await pub.fill('#k-c','21999991111'); await pub.click('#rifa-cons button'); await pub.wait_for_selector('#rifa-cons ~ table')
        ok('Aguardando conferência' in await pub.inner_text('#rifa-cons ~ table'),"consulta pública mostra a situação")
        # --- painel: conferir comprovantes ---
        await aba(pg,'rifa'); await pg.click('[data-rf="part"]'); await pg.wait_for_selector('[data-ok]')
        ok('Baixar' in await pg.inner_text('.doc-table'),"painel oferece o comprovante para conferência")
        await pg.click('[data-ok] >> nth=0'); await pg.wait_for_selector('text=Participação confirmada')
        contas=await pg.evaluate("PR_DADOS.db.get('contas',[])"); print(contas)
        ok(len(contas)==1 and contas[0]['origem']=='Rifa Solidária' and contas[0]['tipo']=='Entrada' and contas[0]['valor'] in (20,30),"confirmação lança Entrada/Rifa Solidária na Prestação de Contas")
        ok('Maria' not in contas[0]['desc'] and 'Joao' not in contas[0]['desc'],"lançamento financeiro não carrega nome do participante")
        await pg.click('[data-no]'); await pg.wait_for_selector('text=Participação estornada')  # estorna a confirmada: tira lançamento e libera números
        ok(await pg.evaluate("PR_DADOS.db.get('contas',[]).length")==0,"estorno remove o lançamento")
        ok(await pg.evaluate("PR_DADOS.db.get('rifa_part',[]).filter(p=>p.status=='recusado').length")==1,"estornada vira recusada (números liberados)")
        await pg.click('[data-ok]'); await pg.wait_for_selector('text=Participação confirmada')
        ok(await pg.evaluate("PR_DADOS.db.get('contas',[]).length")==1,"a outra confirmação gera um lançamento")
        # recusa libera os números
        await pg.evaluate("(()=>{const l=PR_DADOS.db.get('rifa_part',[]);l.push({id:'zz',codigo:'RTESTE',rifa:l[0].rifa,nome:'Fulano Teste',celular:'21999990000',whatsapp:'21999990000',email:'f@x.com',numeros:[99],moeda:'PIX',total:10,comprovante:'',status:'pendente',origem:'publica',criadoEm:new Date().toISOString(),consentimento:true,conta:''});PR_DADOS.db.set('rifa_part',l)})()")
        await aba(pg,'rifa'); await pg.click('[data-rf="part"]'); await pg.click('[data-no]'); await pg.wait_for_selector('text=Participação recusada')
        ok(await pg.evaluate("PR_DADOS.db.get('rifa_part',[]).find(x=>x.id=='zz').status")=='recusado',"recusar marca como recusado e libera o número 99")
        # participação manual (dinheiro)
        await pg.click('summary:has-text("Registrar participação manual")'); await pg.fill('#m-n','Ana Presencial'); await pg.fill('#m-w','21977776666'); await pg.select_option('#m-m','ESPECIE'); await pg.fill('#m-q','1'); await pg.click('#fm button.btn-large'); await pg.wait_for_selector('text=Participação registrada e confirmada')
        c=await pg.evaluate("PR_DADOS.db.get('contas',[])"); ok(len(c)==2 and any(x['moeda']=='ESPECIE' for x in c),"participação manual em dinheiro entra confirmada e lançada")
        # --- planilha consolidada ---
        await aba(pg,'relatorios'); await pg.wait_for_selector('.rf-tab')
        linha=await pg.evaluate("[...document.querySelectorAll('.rf-tab tr')].filter(r=>r.textContent.includes('SUBTOTAL AJUDE'))[0].textContent")
        t=await pg.inner_text('.rf-tab'); lr=await pg.evaluate("[...document.querySelectorAll('.rf-tab tr')].filter(r=>r.querySelector('.rf-ex')&&r.querySelector('.rf-ex').textContent.includes('Rifa Solidária'))[0].textContent"); ok('30,00' in lr,"linha Rifa Solidária da planilha consolidada mostra 30,00")
        tot=await pg.evaluate("PR_DADOS.db.get('contas',[]).reduce((s,c)=>s+c.valor,0)"); ok(f"{tot:.2f}".replace('.',',') in linha,f"subtotal Ajude o Parque inclui o total arrecadado ({tot})")
        # --- regra do sorteio (unidade) ---
        v=lambda dg,vend,pr: pg.evaluate("([d,v,p])=>PR_RIFA.regra.vencedor(d,v,p)",[dg,vend,pr])
        ok((await v(2,[7,42,88],['12342','00000','00000','00000','00000']))['numero']==42,"1º prêmio vendido => ganha o 1º")
        r2_=await v(2,[7,42,88],['12399','55507','00000','00000','00000']); ok(r2_['numero']==7 and r2_['premioRef']==2,"1º não vendido => vale o 2º prêmio")
        r3_=await v(2,[7,42,88],['12310','55511','22212','33313','44414']); ok(r3_['numero']==42 and r3_['regra']=='proximo',"nenhum prêmio vendido => próximo vendido acima do 1º (10 -> 42)")
        r4_=await v(2,[7,42],['12390','55591','22292','33393','44494']); ok(r4_['numero']==7 and r4_['regra']=='proximo',"próximo volta ao início (90 -> 7)")
        ok(await v(2,[],['12342','00001','00002','00003','00004']) is None,"sem números confirmados => sem ganhador")
        ok(await pg.evaluate("PR_RIFA.regra.lerResultado({numero:6200,dataApuracao:'07/10/2026',listaDezenas:['12345','23456','34567','45678','56789']}).data")=='2026-10-07',"lê resultado no formato da Caixa")
        ok(await pg.evaluate("PR_RIFA.regra.lerResultado({data:'2026-10-07',x:['1','2']})") is None,"recusa resultado malformado")
        ok(await pg.evaluate("PR_RIFA.regra.lerResultado({dataApuracao:'07/10/2026',l:['12345','12345','34567','45678','56789']})") is None,"recusa prêmios repetidos")
        # --- chega o dia do sorteio: apuração manual ---
        hoje=await pg.evaluate("(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')})()")
        await aba(pg,'rifa'); await pg.click('[data-rf="sorteio"]'); ok(await pg.query_selector('[data-ap]') is None,"antes do dia do sorteio não há como apurar")
        await pg.evaluate("h=>{const l=PR_DADOS.db.get('rifas',[]);l[0].dataSorteio=h;PR_DADOS.db.set('rifas',l)}",hoje)
        ok(await pg.evaluate("(async()=>{const r=PR_DADOS.db.get('rifas',[])[0];return PR_RIFA.regra&&true})()"),"módulo disponível")
        pub2=await ctx.new_page(); await pub2.goto("http://localhost:8775/rifa-solidaria.html"); await pub2.wait_for_selector('.rifa-card')
        ok('encerradas' in await pub2.inner_text('.rifa-card') and await pub2.query_selector('[data-sel]') is None,"no dia do sorteio as inscrições estão encerradas")
        vend=sorted(await pg.evaluate("PR_DADOS.db.get('rifa_part',[]).filter(p=>p.status=='confirmado').flatMap(p=>p.numeros)"))
        alvo=vend[0]; livre=[n for n in range(100) if n not in vend][0]
        pr=[f"123{livre:02d}",f"456{alvo:02d}","11111","22222","33333"]
        await aba(pg,'rifa'); await pg.click('[data-rf="sorteio"]')
        for i,x in enumerate(pr): await pg.fill(f'[data-i="{i}"]',x)
        await pg.fill('[data-co]','6215'); await pg.click('[data-ap]'); await pg.wait_for_selector('text=Sorteio apurado')
        a=await pg.evaluate("PR_DADOS.db.get('rifas',[])[0].apuracao")
        ok(a['numero']==alvo and a['premioRef']==2 and a['modo']=='manual' and a['vendidos']==len(vend),f"apuração manual: número {alvo} (2º prêmio) entre {len(vend)} confirmados")
        ok(len(a['sha256'])==64,"apuração guarda selo de conferência (SHA-256)")
        ok('Cesta orgânica' in await pg.inner_text('#rf-sub') and 'WhatsApp' in await pg.inner_text('#rf-sub'),"painel mostra ganhador com contato completo")
        # participações não mudam depois da apuração
        await pg.click('[data-rf="part"]'); ok(await pg.query_selector('[data-ok]') is None,"não há mais pendentes confirmáveis")
        err=await pg.evaluate("PR_RIFA && 1"); 
        # site público mostra resultado com nome abreviado
        await pub2.reload(); await pub2.wait_for_selector('.rifa-resultado')
        txt=await pub2.inner_text('.rifa-resultado'); print(txt.replace("\n"," | "))
        ok(f"{alvo:02d}" in txt and '@' not in txt and '9999' not in txt,"resultado público mostra número e não expõe contato")
        dono=await pg.evaluate("(()=>{const r=PR_DADOS.db.get('rifas',[])[0];return PR_DADOS.db.get('rifa_part',[]).find(p=>p.id==r.apuracao.part).nome})()")
        ok(dono.split()[0] in txt and dono not in txt,f"ganhador aparece abreviado ({dono})")
        # anulação exige admin e guarda histórico
        await aba(pg,'rifa'); await pg.click('[data-rf="sorteio"]'); await pg.click('[data-an]'); await pg.wait_for_selector('text=Apuração anulada')
        rr=await pg.evaluate("PR_DADOS.db.get('rifas',[])[0]"); ok(rr['apuracao'] is None and len(rr['historico'])==1,"anulação guarda o resultado anterior no histórico")
        # --- apuração AUTOMÁTICA (serviço de resultado simulado) ---
        d2=datetime.date.today(); br=d2.strftime("%d/%m/%Y")
        async def mock(route):
            await route.fulfill(status=200,content_type="application/json",headers={"access-control-allow-origin":"*"},body=json.dumps({"numero":6216,"dataApuracao":br,"listaDezenas":["99913","00042","11111","22222","33333"]}))
        await ctx.route("**/portaldeloterias/api/federal/**",mock)
        await pg.evaluate("h=>{const l=PR_DADOS.db.get('rifas',[]);l.push({id:'rb',titulo:'Rifa B',premio:'',foto:'',preco:5,total:100,digitos:2,dataSorteio:h,moedas:['PIX'],instrucoes:'x',ativa:true,por:'t',criadoEm:h});PR_DADOS.db.set('rifas',l);const p=PR_DADOS.db.get('rifa_part',[]);p.push({id:'pb',codigo:'RB1',rifa:'rb',nome:'Carla Dias Lima',celular:'1',whatsapp:'21955554444',email:'c@x.com',numeros:[7,42],moeda:'PIX',total:10,comprovante:'',status:'confirmado',origem:'manual',criadoEm:new Date().toISOString(),consentimento:true,conta:''});PR_DADOS.db.set('rifa_part',p)}",hoje)
        await aba(pg,'rifa'); await pg.click('[data-rf="sorteio"]')
        await pg.click('[data-bu] >> nth=-1'); await pg.wait_for_selector('text=apurado automaticamente')
        ab=await pg.evaluate("PR_DADOS.db.get('rifas',[]).find(r=>r.id=='rb').apuracao")
        ok(ab['numero']==42 and ab['premioRef']==2 and ab['modo']=='automático',"apuração automática com resultado da Federal: 1º sem venda, 2º => número 42")
        # --- arrecadação ---
        await pg.click('[data-rf="arrec"]'); ok('Conferência: todas' in await pg.inner_text('#rf-sub') or 'sem lançamento' in await pg.inner_text('#rf-sub'),"aba Arrecadação confere com a Prestação de Contas")
        # nada de contato público
        ok(await pub2.evaluate("!document.body.innerText.includes('21977776666')"),"página pública não expõe telefones")
        print("ERROS JS:",errs); ok(not errs,"sem erros de JavaScript")
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
