# Teste: Comunicação > "E-mail marketing" (com-emailmkt.js).
# Rodar a partir da pasta do site:  python3 tests/teste_email_marketing.py
import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT=8841
srv=subprocess.Popen(["python3","-m","http.server",str(PORT),"-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
OUT=os.environ.get('SHOTS','/tmp')
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def aba(pg,t):
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo').click()}",t)
    await pg.click(f'[data-tab="{t}"]')
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("dialog",lambda d:asyncio.ensure_future(d.accept()))
        await pg.goto(f"http://localhost:{PORT}/login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Admin Teste'); await pg.fill('#e','a@t.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        # 30 contatos em duas listas, um repetido nas duas, alguns sem nome
        await pg.evaluate("""()=>{const E=PR_EMAILMKT;for(let i=0;i<25;i++)E.adicionar('aderente','pessoa'+i+'@x.com',i%5?('maria'+i+' souza'):'', 'manual');
          for(let i=0;i<5;i++)E.adicionar('visitante','vis'+i+'@x.com','João '+i,'wifi'); E.adicionar('visitante','pessoa1@x.com','Maria1 Souza','wifi');}""")
        M=await pg.evaluate("PR_COM_EMKT.personaliza('Olá, {{primeiro_nome}}!',{nome:'ana LÚCIA'})"); ok(M=='Olá, Ana!',"personaliza com o primeiro nome: "+M)
        M=await pg.evaluate("PR_COM_EMKT.personaliza('Olá, {{primeiro_nome}}!',{nome:''})"); ok(M=='Olá!',"sem nome fica só 'Olá!'")
        await aba(pg,'comunicacao'); await pg.click('[data-s="emkt"]')
        ok('E-mail marketing' in await pg.inner_text('#com-sub'),"sub-aba E-mail marketing abre")
        await pg.click('#ek-nova')
        await pg.check('input[name="ek-l"][value="aderente"]'); await pg.wait_for_timeout(100)
        t=await pg.inner_text('#ek-tot'); ok(t.startswith('25 pessoa'),"uma lista: 25 pessoas ("+t[:30]+")")
        await pg.check('input[name="ek-l"][value="visitante"]'); await pg.wait_for_timeout(100)
        t=await pg.inner_text('#ek-tot'); ok(t.startswith('30 pessoa'),"duas listas sem repetir: 30 ("+t[:30]+")")
        await pg.check('#ek-todas'); await pg.wait_for_timeout(100)
        ok(await pg.locator('input[name="ek-l"]:disabled').count()>=6,"Todas as listas marca e trava as listas")
        await pg.fill('#ek-nome','Lançamento CONecta Retiro'); await pg.fill('#ek-as','{{primeiro_nome}}, chegou o CONecta Retiro')
        await pg.fill('#ek-ti','O Parque agora cabe no seu celular'); await pg.fill('#ek-tx','Texto da campanha.')
        await pg.fill('#ek-lk','https://parqueretiro.org.br/app'); await pg.select_option('#ek-tema','Notícias do Parque')
        await pg.select_option('#ek-pv','pessoa1@x.com'); await pg.wait_for_timeout(200)
        ok('Maria1, chegou' in await pg.inner_text('#ek-pas'),"assunto personalizado na prévia")
        html=await pg.get_attribute('#ek-p','srcdoc'); ok('Olá, Maria1!' in html,"saudação com o nome no início do e-mail")
        await pg.screenshot(path=OUT+'/emkt-editor.png',full_page=True)
        await pg.evaluate("document.querySelector('#ek-lk').blur();document.querySelector('#ek-salvar').scrollIntoView({block:'center'})"); await pg.click('#ek-salvar'); await pg.wait_for_timeout(300)
        txt=await pg.inner_text("#com-sub"); ok("Lote de hoje: 20 pessoa" in txt,"aquecimento: lote do 1º dia limitado a 20")
        ok(await pg.locator('a[href^="mailto:"]').count()==20,"um e-mail personalizado por pessoa")
        await pg.click('#ek-env'); await pg.wait_for_timeout(200)
        txt=await pg.inner_text('#com-sub'); ok('Lote de hoje: 0' in txt and '20 enviados de 31' in txt.replace('\n',' '),"lote marcado; limite do dia atingido")
        # resultados: 1 clique, 1 rejeição
        await pg.evaluate("document.querySelector('#ek-res').open=true")
        f=await pg.evaluate("PR_DADOS.db.get('emkt_campanhas',[])[0].fila.slice(0,2)")
        await pg.fill('#ek-rel',f"{f[0]};sim;sim;não\n{f[1]};não;não;sim"); await pg.click('#ek-apl'); await pg.wait_for_timeout(200)
        P=await pg.evaluate("PR_DADOS.db.get('emkt_perfis',{})")
        ok(P[f[0]]['cliques']==1 and P[f[0]]['interesses'].get('Notícias do Parque')==1,"clique ensina o interesse do tema")
        ok(P[f[1]].get('bloqueado'),"e-mail que voltou sai das próximas campanhas")
        # amanhã: limite cresce para 30
        await pg.evaluate("()=>{const a=PR_DADOS.db.get('emkt_aquec');a.ultimoDia='2000-01-01';a.segurar=false;PR_DADOS.db.set('emkt_aquec',a)}")
        ok(await pg.evaluate("PR_COM_EMKT.limiteHoje()")==30,"no dia seguinte o limite sobe para 30")
        # segmentação por interesse
        n=await pg.evaluate("PR_COM_EMKT.publico({todas:true,engaj:'interessados',interesses:['Notícias do Parque']}).length"); ok(n==1,"filtro por interesse: só quem clicou no tema")
        await pg.click('[data-ev="perf"]'); ok('Engajado' in await pg.inner_text('#com-sub'),"perfis mostram quem está engajado")
        await pg.click('[data-ev="aq"]'); ok('SPF' in await pg.inner_text('#com-sub'),"aquecimento mostra a lista de verificação")
        await pg.screenshot(path=OUT+'/emkt-aquecimento.png',full_page=True)
        ok(not errs,"sem erros de JavaScript "+str(errs))
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
