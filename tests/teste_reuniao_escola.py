# Teste de tela da Reunião de Escola: pesquisa de 2 datas de fim de semana, votos visíveis, presença, temas livres,
# data definida no calendário, alteração da data, permissões de tela. Dados fictícios, no navegador.
# Vários "usuários" são simulados trocando a sessão no mesmo navegador (os dados ficam no navegador).
# Rodar a partir da pasta do site:  python3 tests/teste_reuniao_escola.py
import asyncio, subprocess, time, os, datetime
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen(["python3","-m","http.server","8778","-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
RESP=['']
async def aba(pg,t):
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo')&&c.querySelector('.area-titulo').click();}",t)
    await pg.click(f'[data-tab="{t}"]')
async def db(pg,k,d=None): return await pg.evaluate("([k,d])=>PR_DADOS.db.get(k,d)",[k,d if d is not None else []])
async def como(pg,email):
    await pg.evaluate("e=>sessionStorage.setItem('pr_sess',e)",email); await pg.goto("http://localhost:8778/area-restrita.html"); await pg.wait_for_selector('[data-tab]')
def proximo(wd,n=1):  # wd: 5=sábado, 6=domingo (Python); devolve a n-ésima data futura
    d=datetime.date.today()+datetime.timedelta(days=7); 
    while d.weekday()!=wd: d+=datetime.timedelta(days=1)
    return (d+datetime.timedelta(days=7*(n-1))).isoformat()
async def main():
    sab=proximo(5,2); dom=proximo(6,3); ter=(datetime.date.today()+datetime.timedelta(days=10))
    while ter.weekday()!=1: ter+=datetime.timedelta(days=1)
    ter=ter.isoformat()
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
        pg.on("dialog",lambda d:asyncio.ensure_future(d.accept(RESP[0]) if d.type=='prompt' else d.accept()))
        net=[]; pg.on("request",lambda r:net.append(r.url) if not r.url.startswith("http://localhost:8778") and not r.url.startswith("data:") and 'cdnjs' not in r.url and 'fonts.' not in r.url else None)
        await pg.goto("http://localhost:8778/login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Admin Teste'); await pg.fill('#e','admin@teste.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        # cria 3 pessoas aprovadas: uma Responsável pelas Atividades e dois Mestres comuns (leitores)
        await pg.evaluate("""(()=>{const u=PR_DADOS.db.get('users',[]),b=u[0];
          const mk=(e,n,nv,f)=>Object.assign({},b,{email:e,nome:n,nivel:nv,funcoes:f,status:'aprovado'});
          u.push(mk('resp@teste.com','Rita Responsável','leitor',['atividades']),mk('ana@teste.com','Ana Mestra','leitor',[]),mk('beto@teste.com','Beto Mestre','leitor',[]));PR_DADOS.db.set('users',u);})()""")
        await aba(pg,'reuniao'); await pg.wait_for_selector('#r-novo')
        # --- criar: datas precisam ser fim de semana
        await pg.click('#r-novo'); await pg.fill('#rf-t','Reunião de Escola de teste'); await pg.fill('#rf-a',ter); await pg.fill('#rf-b',dom); await pg.click('#rf button.btn-large')
        ok('sábado ou domingo' in await pg.inner_text('#rf-e'),"data em dia útil é recusada")
        ok(await pg.input_value('#rf-t')=='Reunião de Escola de teste',"o erro não apaga o que foi digitado")
        await pg.fill('#rf-a',sab); await pg.fill('#rf-b',sab); await pg.click('#rf button.btn-large'); ok('diferentes' in await pg.inner_text('#rf-e'),"as duas datas precisam ser diferentes")
        await pg.fill('#rf-b',dom); await pg.fill('#rf-h','19h'); await pg.click('#rf button.btn-large'); await pg.wait_for_selector('#v-s')
        r=(await db(pg,'reuniao_escola'))[0]; ok(r['status']=='Escolhendo a data' and [o['data'] for o in r['opcoes']]==[sab,dom],"reunião criada com as duas datas de fim de semana")
        # --- Ana vota e confirma presença, propõe tema
        await como(pg,'ana@teste.com'); await aba(pg,'reuniao'); await pg.wait_for_selector('[data-abrir]')
        ok(await pg.locator('#r-novo').count()==0,"Mestre comum não vê o botão de criar reunião")
        await pg.click('[data-abrir]'); await pg.select_option('#v-r','ambas'); await pg.click('#v-s'); await pg.wait_for_selector('.tip-box[role=status]')
        await pg.select_option('#p-r','presencial'); await pg.click('#p-s')
        await pg.fill('#t-t','Como receber quem chega pela primeira vez'); await pg.fill('#t-d','Acolhimento no Parque'); await pg.click('#t-f button.btn-visit')
        await pg.wait_for_selector('[data-ap]')
        ok(await pg.locator('#d-e').count()==0 and await pg.locator('#d-d').count()==0,"Mestre comum não vê editar nem definir a data")
        # --- Beto vota só na B, virtual, apoia o tema e comenta
        await como(pg,'beto@teste.com'); await aba(pg,'reuniao'); await pg.click('[data-abrir]')
        await pg.select_option('#v-r','b'); await pg.click('#v-s'); await pg.wait_for_selector('.tip-box[role=status]')
        await pg.select_option('#p-r','virtual'); await pg.click('#p-s')
        await pg.click('[data-ap]'); await pg.wait_for_selector('[data-ap]')
        await pg.fill('[id^="c-"]','Concordo, vale levar uma cartilha'); await pg.click('[data-co]')
        await pg.fill('#t-t','Calendário do próximo semestre'); await pg.click('#t-f button.btn-visit'); await pg.wait_for_selector('[data-ret]')
        corpo=await pg.inner_text('#conteudo, body')
        ok('Ana Mestra' in corpo and 'Beto Mestre' in corpo,"votos e presenças aparecem com o nome de cada pessoa")
        r=(await db(pg,'reuniao_escola'))[0]
        ok(len(r['votosData'])==2 and len(r['presenca'])==2 and len(r['temas'])==2,"2 votos, 2 presenças e 2 temas guardados")
        t1=[t for t in r['temas'] if t['titulo'].startswith('Como receber')][0]; ok(len(t1['apoios'])==1 and len(t1['coment'])==1,"apoio e comentário no tema de outra pessoa")
        # tema livre: ninguém além do autor retira; Rita (organizadora) não pode remover tema alheio
        await como(pg,'resp@teste.com'); await aba(pg,'reuniao'); await pg.click('[data-abrir]'); await pg.wait_for_selector('#d-d')
        ok(await pg.locator('[data-ret]').count()==0,"a organizadora não consegue retirar tema de outra pessoa (sem censura)")
        txt=await pg.input_value('#w-t'); ok('Calendário do próximo semestre' in txt and 'Como receber quem chega' in txt and 'pode:' in txt,"texto do WhatsApp lista as datas e os temas")
        # --- Rita define a data (outra data permitida) e vai para o calendário
        await pg.click('#d-d'); await pg.select_option('#rd-o',sab); await pg.fill('#rd-z','http://invalido'); await pg.click('#rd button.btn-large')
        await pg.fill('#rd-z','ftp://x'); await pg.click('#rd button.btn-large'); ok('https' in await pg.inner_text('#rd-e'),"link do Zoom precisa começar com https://")
        await pg.fill('#rd-z','https://zoom.us/j/123456'); await pg.fill('#rd-h','19h'); await pg.click('#rd button.btn-large'); await pg.wait_for_selector('.tip-box')
        r=(await db(pg,'reuniao_escola'))[0]; ok(r['status']=='Data definida' and r['final']['data']==sab,"data definida pela responsável pelas Atividades")
        at=[a for a in await db(pg,'ativ') if a.get('origem')=='reuniao']; ok(len(at)==1 and at[0]['data']==sab and at[0]['categoria']=='Reunião de Escola',"a data entrou no calendário como Reunião de Escola")
        # --- alterar a data depois: calendário atualiza sem duplicar; presença antiga fica sinalizada
        await pg.click('#d-d'); await pg.select_option('#rd-o',dom); await pg.click('#rd button.btn-large'); await pg.wait_for_selector('.tip-box')
        at=[a for a in await db(pg,'ativ') if a.get('origem')=='reuniao']; ok(len(at)==1 and at[0]['data']==dom,"alterar a data atualiza a mesma atividade do calendário (sem duplicar)")
        ok('Data alterada de' in await pg.inner_text('body'),"a alteração fica no histórico")
        await como(pg,'ana@teste.com'); await aba(pg,'reuniao'); await pg.click('[data-abrir]')
        ok('A data mudou depois da sua resposta' in await pg.inner_text('body'),"quem respondeu antes da mudança é avisado para confirmar de novo")
        await pg.select_option('#p-r','virtual'); await pg.click('#p-s'); await pg.wait_for_selector('.tip-box[role=status]')
        ok('A data mudou depois' not in await pg.inner_text('body'),"depois de confirmar de novo, o aviso some")
        # --- Ana retira o próprio tema: some para os outros, continua guardado
        await pg.click('[data-ret]'); await pg.wait_for_selector('.tip-box[role=status]')
        await como(pg,'beto@teste.com'); await aba(pg,'reuniao'); await pg.click('[data-abrir]')
        ok('Como receber quem chega' not in await pg.inner_text('body'),"tema retirado pelo autor some para os outros")
        r=(await db(pg,'reuniao_escola'))[0]; ok(any(t['retirado'] for t in r['temas']),"tema retirado continua guardado")
        # --- realizada: vira só consulta
        await como(pg,'resp@teste.com'); await aba(pg,'reuniao'); await pg.click('[data-abrir]'); await pg.click('#d-ok'); await pg.wait_for_selector('#d-re')
        await como(pg,'beto@teste.com'); await aba(pg,'reuniao'); await pg.click('[data-abrir]')
        ok(await pg.locator('#v-s').count()==0 and await pg.locator('#p-s').count()==0,"reunião realizada fica só para consulta")
        ok(not net,f"nenhuma chamada de rede externa ({net[:2]})"); ok(not errs,f"sem erros de JavaScript ({errs[:1]})")
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
print("ERROS JS: []")
