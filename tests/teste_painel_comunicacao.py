# Teste do Painel de Comunicação (Comunicação e Redes Sociais > Publicações > Painel).
# Rodar a partir da pasta do site:  python3 tests/teste_painel_comunicacao.py
import asyncio, subprocess, time, os, json
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen(["python3","-m","http.server","8771","-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def aba(pg,t,**k):
    # CONecta Retiro: as ferramentas ficam numa caixa flutuante; abre a caixa da área e clica na ferramenta
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo').click()}",t)
    await pg.click(f'[data-tab="{t}"]',**k)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("dialog",lambda d:asyncio.ensure_future(d.accept()))
        await pg.goto("http://localhost:8771/login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Admin Teste'); await pg.fill('#e','a@t.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        # publicação ANTIGA, criada pelo formulário que já existia (antes do painel ser usado)
        await aba(pg,'comunicacao'); await pg.click('[data-s="pub"]')
        ok(await pg.inner_text('#pub-corpo h3')=="Painel de Comunicação" or "Painel" in await pg.inner_text('#pub-corpo h3'),"Publicações abre no Painel")
        await pg.click('[data-pv="lista"]'); await pg.click('#p-novo')
        await pg.fill('#p-t','Aviso antigo da Sala'); await pg.click('#fp button.btn-visit.btn-large >> nth=0'); await pg.wait_for_selector('.doc-table')
        ok(await pg.eval_on_selector_all('.doc-table tbody tr','r=>r.length')==1,"formulário/lista antigos continuam funcionando")
        # canais novos semeados (sem remover os antigos)
        redes=await pg.evaluate("PR_DADOS.db.get('com_redes',[]).map(r=>r.id)")
        print(redes); ok(all(x in redes for x in ['instagram','facebook','youtube','whatsapp','whatsapp-comunidade','whatsapp-grupo','site']),"canais antigos + WhatsApp Comunidade/Grupo + Site")
        # nova ação no painel
        await pg.click('[data-pv="painel"]'); await pg.click('#a-novo')
        await pg.fill('#a-t','Celebração dos 15 anos - convite'); 
        linhas=await pg.eval_on_selector_all('#fa tr[data-ri]','r=>r.length'); ok(linhas==6,f"6 canais na matriz ({linhas})")
        # opções de formato do Instagram não incluem 'Mensagem de canal'
        op=await pg.eval_on_selector_all('#fa tr[data-ri="0"] [data-f="tipo"] option','o=>o.map(x=>x.textContent)'); print("Instagram:",op)
        ok('Carrossel' in op and 'Mensagem de canal' not in op,"formatos filtrados por canal")
        async def fmt(i,nome): await pg.select_option(f'#fa tr[data-ri="{i}"] [data-f="tipo"]',label=nome)
        await fmt(0,'Carrossel'); await fmt(1,'Stories'); await fmt(3,'Mensagem de canal'); await fmt(4,'Aviso na Comunidade'); await fmt(5,'Mensagem em grupo')
        ok(await pg.is_checked('#fa tr[data-ri="0"] [data-f="usar"]'),"escolher formato marca o canal")
        await pg.select_option('#fa tr[data-ri="1"] [data-f="status"]',label='Planejada')
        # erro: marcar canal sem formato
        await pg.check('#fa tr[data-ri="2"] [data-f="usar"]'); await pg.click('#fa button.btn-large >> nth=0')
        ok('formato' in (await pg.inner_text('#a-e')).lower(),"exige formato em canal marcado")
        await pg.uncheck('#fa tr[data-ri="2"] [data-f="usar"]')
        # banner do site
        await pg.click('[data-addsite]'); await pg.select_option('#fa select[data-f="bannerSlug"]','doacao'); 
        await pg.select_option('#fa select[data-f="bannerSlug"] >> xpath=ancestor::tr//select[@data-f="tipo"]',label='Banner do site - fixo')
        await pg.click('#fa button.btn-large >> nth=0'); await pg.wait_for_selector('#pub-corpo table.doc-table')
        posts=await pg.evaluate("PR_DADOS.db.get('com_posts',[])"); ac=await pg.evaluate("PR_DADOS.db.get('com_acoes',[])")
        nov=[x for x in posts if x.get('acao')]; print(len(posts),"posts;",len(nov),"na ação;",len(ac),"ações")
        ok(len(nov)==6 and len(ac)==1,"1 ação gerou 6 publicações (5 canais + 1 banner do site)")
        ok(any(x['rede']=='site' and x['bannerSlug']=='doacao' for x in nov),"banner do site registrado com a página")
        txt=await pg.inner_text('#pub-corpo table.doc-table')
        ok('Carrossel' in txt and 'Stories' in txt and 'Aviso na Comunidade' in txt and 'Doação' in txt,"painel mostra formato por canal e a página do banner")
        # a publicação antiga continua intacta
        ant=[x for x in posts if x['tema']=='Aviso antigo da Sala']; ok(len(ant)==1 and 'acao' not in ant[0],"publicação antiga intacta")
        # lista mostra tudo + filtro por formato + botão abrir no painel
        await pg.click('[data-pv="lista"]'); n=await pg.eval_on_selector_all('#l-res tbody tr','r=>r.length'); ok(n==7,f"lista mostra as 7 publicações ({n})")
        await pg.select_option('#l-f',label='Carrossel'); n=await pg.eval_on_selector_all('#l-res tbody tr','r=>r.length'); ok(n==1,"filtro por formato na lista")
        await pg.select_option('#l-f',''); 
        # calendário continua enxergando as publicações
        await pg.click('[data-s="cal"]'); ok(await pg.eval_on_selector_all('.cal-lista li','l=>l.length')>=6,"calendário mostra as publicações do painel")
        # editar: tirar o Facebook, publicar o Instagram
        await pg.click('[data-s="pub"]'); await pg.click('[data-pv="painel"]'); await pg.click('[data-ae] >> nth=0')
        ok(await pg.input_value('#a-t')=='Celebração dos 15 anos - convite',"editor reabre com os dados")
        await pg.uncheck('#fa tr[data-ri="1"] [data-f="usar"]'); await pg.select_option('#fa tr[data-ri="0"] [data-f="status"]',label='Publicada')
        await pg.fill('#fa tr[data-ri="0"] [data-f="link"]','https://instagram.com/p/x'); await pg.click('#fa button.btn-large >> nth=0'); await pg.wait_for_selector('#pub-corpo table.doc-table')
        posts=await pg.evaluate("PR_DADOS.db.get('com_posts',[])"); nov=[x for x in posts if x.get('acao')]
        ok(len(nov)==5 and not any(x['rede']=='facebook' for x in nov),"canal desmarcado removeu só a publicação dele")
        ig=[x for x in nov if x['rede']=='instagram'][0]; ok(ig['status']=='Publicada' and ig.get('publicadoPor')=='Admin Teste' and ig['link'].startswith('https'),"status/link/publicado por registrados")
        # abrir a configuração do banner a partir do painel
        await pg.click('[data-ban="doacao"] >> nth=0'); await pg.wait_for_selector('.bn-card')
        ok(await pg.is_visible('[data-slug="doacao"] [data-a="salvar"]') or await pg.is_visible('#up-doacao'),"atalho abre o banner da página escolhida já aberto")
        # organizar antigas
        await pg.click('[data-s="pub"]'); await pg.click('#a-org'); await pg.wait_for_selector('#pub-corpo table.doc-table')
        ac=await pg.evaluate("PR_DADOS.db.get('com_acoes',[])"); ok(len(ac)==2,"publicação antiga virou uma ação (sem apagar nada)")
        ok(await pg.evaluate("PR_DADOS.db.get('com_posts',[]).length")==6,"nenhuma publicação perdida ao organizar")
        # formatos por canal configuráveis
        await pg.click('summary:has-text("Configurar quais formatos")'); await pg.check('input[data-fr="instagram"][aria-label$="Mensagem de canal"]'); await pg.click('#ff button')
        fm=await pg.evaluate("PR_DADOS.db.get('com_formatos',{}).instagram.length"); ok(fm==5,"configuração de formatos por canal salva")
        # backup inclui as novas coleções
        bk=await pg.evaluate("PR_DADOS.montarBackup().then(b=>Object.keys(b.dados))"); ok(all(k in bk for k in ['com_acoes','com_formatos','com_painel']),"backup inclui as novas coleções")
        # demais abas do módulo seguem abrindo
        for s in ['gerar','redes','proj','tipos','fixas','site']:
            await pg.click(f'[data-s="{s}"]'); await pg.wait_for_timeout(150)
        ok(True,"sub-abas existentes abrem")
        # segunda abertura não duplica canais/tipos
        await pg.reload(); await aba(pg,'comunicacao')
        r2=await pg.evaluate("PR_DADOS.db.get('com_redes',[]).length"); ok(r2==7,f"reabrir não duplica canais ({r2})")
        print("ERROS JS:",errs); ok(not errs,"sem erros de JavaScript"); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
