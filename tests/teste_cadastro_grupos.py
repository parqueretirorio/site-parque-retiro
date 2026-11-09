# Teste: cadastro mínimo (nome completo, WhatsApp, e-mail) + autorização LGPD, menus Blogger e Silo (site aberto) e Grupos de Discussão
# (criar grupo com sigla, convite, conversa, enquete, presença, publicação com votação de 72 h e backup por sigla). Dados fictícios, no navegador.
# Rodar a partir da pasta do site:  python3 tests/teste_cadastro_grupos.py
import asyncio, subprocess, time, os, json, datetime
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT=8791
srv=subprocess.Popen(["python3","-m","http.server",str(PORT),"-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
U=f"http://localhost:{PORT}/"
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def aba(pg,t):
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo')&&c.querySelector('.area-titulo').click();}",t)
    await pg.click(f'[data-tab="{t}"]')
async def db(pg,k,d=None): return await pg.evaluate("([k,d])=>PR_DADOS.db.get(k,d)",[k,d if d is not None else []])
async def como(pg,email):
    await pg.evaluate("e=>sessionStorage.setItem('pr_sess',e)",email); await pg.goto(U+"area-restrita.html"); await pg.wait_for_selector('[data-tab]')
async def grupos(pg): await aba(pg,'grupos'); await pg.wait_for_selector('#g-novo')
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
        PROMPT=[""]; pg.on("dialog",lambda dlg:asyncio.ensure_future(dlg.accept(PROMPT[0]) if dlg.type=="prompt" else dlg.accept()))
        net=[]; pg.on("request",lambda r:net.append(r.url) if not r.url.startswith(U) and not r.url.startswith("data:") and 'cdnjs' not in r.url and 'fonts.' not in r.url else None)

        # ---------- 1. Criar conta: cadastro mínimo e LGPD
        await pg.goto(U+"login.html"); await pg.click('[data-m="cadastro"]')
        ok(await pg.is_visible('#w') and await pg.is_visible('#cc-lgpd-ok') and await pg.is_visible('#cc-lgpd-img'),"Criar conta mostra WhatsApp e a autorização LGPD (geral e de imagem)")
        async def tenta(n,e,w,lg=True):
            await pg.fill('#n',n); await pg.fill('#e',e); await pg.fill('#w',w); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345')
            await pg.set_checked('#cc-lgpd-ok',lg); await pg.click('#f button.btn-large'); await pg.wait_for_timeout(300)
        await tenta('Admin','a@t.com','21999990000'); ok('nome completo' in (await pg.inner_text('#er')).lower(),"nome de uma palavra só é recusado")
        await tenta('Admin Teste','a@t.com',''); ok('whatsapp' in (await pg.inner_text('#er')).lower(),"sem WhatsApp é recusado")
        await tenta('Admin Teste','a@t.com','123'); ok('whatsapp' in (await pg.inner_text('#er')).lower(),"WhatsApp curto demais é recusado")
        await tenta('Admin Teste','a@t.com','21999990000',False); ok('lgpd' in (await pg.inner_text('#er')).lower(),"sem aceitar a LGPD é recusado")
        ok(await db(pg,'users')==[],"nada é gravado quando falta dado")
        await pg.check('#cc-lgpd-img'); await tenta('Admin Teste','a@t.com','(21) 99999-0000');
        await pg.wait_for_url("**/area-restrita.html")
        u=(await db(pg,'users'))[0]
        ok(u['whatsapp']=='21999990000' and u['lgpd']['aceite'] is True and u['lgpd']['imagem'] is True and u['lgpd']['versao'] and u['lgpd']['em'],"conta criada com WhatsApp só em dígitos e registro da LGPD (data, versão e imagem)")
        ok(await pg.locator('#cad-aviso').count()==0,"cadastro completo não mostra aviso")

        # ---------- 2. Administrador cadastra responsável: WhatsApp obrigatório, LGPD é da pessoa
        await aba(pg,'users')
        await pg.fill('#u-n','Rita'); await pg.fill('#u-e','rita@teste.com'); await pg.fill('#u-s','senha12345'); await pg.click('#fu button.btn-large')
        ok('completo' in (await pg.inner_text('#u-er')).lower(),"responsável com nome de uma palavra é recusado")
        await pg.fill('#u-n','Rita Responsável'); await pg.click('#fu button.btn-large')
        ok('whatsapp' in (await pg.inner_text('#u-er')).lower(),"responsável sem WhatsApp é recusado (o digitado não some)")
        ok(await pg.input_value('#u-n')=='Rita Responsável',"o formulário mantém o que foi digitado")
        await pg.fill('#u-w','21988887777'); await pg.click('#fu button.btn-large'); await pg.wait_for_timeout(300)
        r=[x for x in await db(pg,'users') if x['email']=='rita@teste.com'][0]
        ok(r['whatsapp']=='21988887777' and 'lgpd' not in r,"responsável cadastrado com WhatsApp e SEM LGPD marcada pelo administrador")
        ok('cadastro incompleto' in (await pg.inner_text('#app')).lower(),"lista mostra 'cadastro incompleto' para quem ainda não aceitou a LGPD")

        # ---------- 3. Quem está incompleto vê o aviso e completa
        await pg.evaluate("""(()=>{const u=PR_DADOS.db.get('users',[]),b=u[0];
          const mk=(e,n)=>Object.assign({},b,{email:e,nome:n,nivel:'leitor',funcoes:[],status:'aprovado'});
          u.push(mk('beto@teste.com','Beto Membro'),mk('carla@teste.com','Carla Convidada'),mk('fora@teste.com','Fábio Fora'));PR_DADOS.db.set('users',u);})()""")
        await como(pg,'rita@teste.com')
        ok(await pg.locator('#cad-aviso').count()==1 and 'lgpd' in (await pg.inner_text('#cad-aviso')).lower(),"Rita vê o aviso 'Complete seu cadastro' (falta LGPD)")
        await pg.click('#fcad button'); ok('lgpd' in (await pg.inner_text('#cd-er')).lower(),"não conclui sem marcar a LGPD")
        await pg.fill('#cd-w','12'); await pg.check('#cd-lgpd-ok'); await pg.click('#fcad button'); ok('whatsapp' in (await pg.inner_text('#cd-er')).lower(),"WhatsApp inválido no aviso é recusado")
        await pg.fill('#cd-w','21988887777'); await pg.click('#fcad button'); await pg.wait_for_selector('[data-tab]')
        r=[x for x in await db(pg,'users') if x['email']=='rita@teste.com'][0]
        ok(r['lgpd']['aceite'] is True and r['lgpd']['imagem'] is False and await pg.locator('#cad-aviso').count()==0,"Rita aceita a LGPD (imagem fica desmarcada) e o aviso some")

        # ---------- 4. Site aberto: Blogger e Silo
        await pg.goto(U+"index.html")
        ordem=await pg.evaluate("()=>[...document.querySelectorAll('header nav > a')].map(a=>a.textContent.trim())")
        ok(ordem.index('Blogger')==ordem.index('Parques no Mundo')+1,"menu: Blogger fica logo à direita de Parques no Mundo")
        ic=await pg.evaluate("()=>[...document.querySelectorAll('footer .social-links a')].map(a=>a.querySelector('i').className)")
        ok(ic[-1]=='fab fa-blogger-b' and ic[-2]=='fab fa-youtube',f"pictograma do Blogger ao lado das redes sociais ({ic})")
        subs=await pg.evaluate("()=>{const d=[...document.querySelectorAll('.nav-dropdown')].find(x=>x.querySelector(':scope>a').textContent.trim()==='Silo');return [...d.querySelectorAll('a')].map(a=>a.textContent.trim())}")
        ok(subs[:4]==['Silo','Mensagem de Silo','Comunidades da Mensagem','Organismos do Movimento'],f"menu Silo: Mensagem de Silo > Comunidades da Mensagem ({subs})")
        for pgn,t in (('blogger.html','Blogger'),('mensagem-de-silo.html','Mensagem de Silo'),('comunidades-da-mensagem.html','Comunidades da Mensagem')):
            await pg.goto(U+pgn); ok(t in await pg.inner_text('h1') and 'em construção' in (await pg.inner_text('.container')).lower(),f"página {pgn} existe e está em construção")
        ok(await pg.locator('a[href="blogger.html"]').count()>=1,"menu da página nova também tem o Blogger")
        await pg.goto(U+"silo.html"); ok(await pg.locator('.container a[href="mensagem-de-silo.html"]').count()==1,"página Silo leva à Mensagem de Silo")

        # ---------- 5. Grupos: criar
        await como(pg,'rita@teste.com'); await grupos(pg)
        ok('nenhum grupo' in (await pg.inner_text('#app')).lower() or 'ainda não participa' in (await pg.inner_text('#app')).lower(),"sem grupos no início")
        await pg.click('#g-novo'); await pg.fill('#g-n','Mestres do Parque Retiro'); ok(await pg.input_value('#g-s')=='MDPR',"a sigla do backup é sugerida pelas iniciais do nome"); await pg.fill('#g-s','m p!'); await pg.click('#g-f button.btn-large')
        ok('sigla' in (await pg.inner_text('#g-er')).lower(),"sigla inválida é recusada")
        await pg.fill('#g-s','mpr'); await pg.check('input[name=gm][value="beto@teste.com"]'); await pg.click('#g-f button.btn-large'); await pg.wait_for_selector('[data-ga="conversa"]')
        g=(await db(pg,'grupos'))[0]
        ok(g['sigla']=='MPR' and g['criador']=='rita@teste.com' and sorted(g['membros'])==['beto@teste.com','rita@teste.com'],"grupo criado com sigla em maiúsculas, criador e convidado")
        bk=await db(pg,'grupos_bkp_MPR',None); ok(bk and bk['grupo']['sigla']=='MPR',"backup por sigla gravado (pr_grupos_bkp_MPR)")
        await pg.click('[data-ga="membros"]'); await pg.click('#g-volta') if False else None
        await pg.click('#g-volta'); await pg.click('#g-novo'); await pg.fill('#g-n','Outro'); await pg.fill('#g-s','MPR'); await pg.click('#g-f button.btn-large')
        ok('já existe' in (await pg.inner_text('#g-er')).lower(),"sigla repetida é recusada")
        await pg.fill('#g-s','CPR'); await pg.fill('#g-n','Construção Parque Retiro'); await pg.click('#g-f button.btn-large'); await pg.wait_for_selector('[data-ga="conversa"]')
        ok(len(await db(pg,'grupos'))==2,"qualquer pessoa cria um novo grupo quando precisar")
        await pg.click('#g-volta'); await pg.click('[data-abre]:near(:text("Mestres do Parque Retiro"))') if False else None
        await pg.locator('.card:has-text("Mestres do Parque Retiro") [data-abre]').click(); await pg.wait_for_selector('#m-f')

        # ---------- 6. Conversa
        await pg.fill('#m-t','Bom dia, Mestres! Vamos definir a reunião.'); await pg.click('#m-f button'); await pg.wait_for_selector('text=Vamos definir a reunião')
        await pg.click('[data-ci]'); ok('Respondendo a' in await pg.inner_text('#m-f'),"botão Responder cita a mensagem")
        await pg.fill('#m-t','Combinado.'); await pg.click('#m-f button:not(#m-x)'); await pg.wait_for_selector('blockquote')
        await pg.click('[data-re]'); ok((await db(pg,'grupos_itens'))[0]['reacoes']['rita@teste.com']=='👍',"reação registrada")
        await pg.locator('[data-fx]').first.click(); ok('Fixadas' in await pg.inner_text('#g-c'),"criador fixa mensagem")
        await pg.click('[data-ga="enquetes"]')

        # ---------- 7. Enquete e presença
        await pg.fill('#q-p','Qual fim de semana?'); await pg.fill('#q-o','Sábado 14'); await pg.click('#q-f button'); ok('2 a 10' in await pg.inner_text('#q-er'),"enquete com 1 opção é recusada")
        await pg.fill('#q-o','Sábado 14\nDomingo 15'); await pg.click('#q-f button'); await pg.wait_for_selector('[data-vq]')
        await pg.check('input[name^="v-"] >> nth=0'); await pg.click('[data-vq]'); await pg.wait_for_selector('text=Voto registrado')
        ok('Rita Responsável' in await pg.inner_text('#g-c'),"voto da enquete aparece com o nome")
        await pg.click('[data-ga="presenca"]'); await pg.fill('#p-t','Reunião de Escola'); await pg.fill('#p-d','2026-11-14'); await pg.click('#p-f button'); await pg.wait_for_selector('[data-pr]')
        await pg.click('[data-pr][data-k="presencial"]'); ok('Presencial (1): Rita Responsável' in await pg.inner_text('#g-c'),"presença presencial registrada com o nome")

        # ---------- 8. Publicação com prazo de 72 h
        await pg.click('[data-ga="publicar"]'); ok('72 horas' in await pg.inner_text('#g-c'),"aviso das 72 horas")
        await pg.fill('#b-t','Convite da Reunião'); await pg.fill('#b-x','Texto do convite.'); await pg.click('#b-f button'); ok('destino' in (await pg.inner_text('#b-er')).lower(),"sem destino é recusado")
        await pg.fill('#b-l','http://x.com/a.jpg'); await pg.check('input[name=bd][value="Instagram"]'); await pg.click('#b-f button'); ok('https' in await pg.inner_text('#b-er'),"link sem https é recusado")
        await pg.fill('#b-l',''); await pg.check('input[name=bd][value="Blogger"]'); await pg.click('#b-f button'); await pg.wait_for_selector('[data-vp]')
        pb=(await db(pg,'grupos_itens'))[-1]; dif=(datetime.datetime.fromisoformat(pb['prazo'].replace('Z','+00:00'))-datetime.datetime.fromisoformat(pb['em'].replace('Z','+00:00'))).total_seconds()/3600
        ok(pb['status']=='votando' and 71.9<dif<72.1,f"publicação nasce 'votando' com prazo de 72 h ({dif:.2f} h)")
        ok('restam' not in (await pg.inner_text('#g-c')).lower() and 'encerra em' in await pg.inner_text('#g-c'),"sem contador na tela: só a data de encerramento da votação de 72 h")
        await pg.click('[data-vp][data-v="sim"]'); ok('Aprovo:</strong> 1' in await pg.inner_html('#g-c') or 'Aprovo: 1' in await pg.inner_text('#g-c'),"voto 'aprovo' contado")
        # Beto vota contra e Rita muda de ideia: 1 a favor x 1 contra = sem maioria -> cancelada
        await como(pg,'beto@teste.com'); await grupos(pg); await pg.locator('.card:has-text("Mestres do Parque Retiro") [data-abre]').click(); await pg.click('[data-ga="publicar"]')
        await pg.click('[data-vp][data-v="nao"]'); ok('Não aprovo:</strong> 1' in await pg.inner_html('#g-c') or 'Não aprovo: 1' in await pg.inner_text('#g-c'),"outro membro vota contra")
        await pg.evaluate("()=>{const l=PR_DADOS.db.get('grupos_itens',[]);l.filter(i=>i.tipo==='pub').forEach(i=>i.prazo=new Date(Date.now()-1000).toISOString());PR_DADOS.db.set('grupos_itens',l)}")
        await pg.click('[data-ga="conversa"]'); await pg.click('[data-ga="publicar"]')
        ok('Cancelada' in await pg.inner_text('#g-c') and 'Nada foi publicado' in await pg.inner_text('#g-c'),"empate depois das 72 h: publicação cancelada")
        # nova publicação: maioria a favor e prazo vencido -> aprovada
        await pg.fill('#b-t','Segunda proposta'); await pg.fill('#b-x','Texto 2.'); await pg.check('input[name=bd][value="Facebook"]'); await pg.click('#b-f button'); await pg.wait_for_selector('[data-vp]')
        await pg.click('[data-vp][data-v="sim"]')
        await pg.evaluate("()=>{const l=PR_DADOS.db.get('grupos_itens',[]);l.filter(i=>i.tipo==='pub'&&i.status==='votando').forEach(i=>i.prazo=new Date(Date.now()-1000).toISOString());PR_DADOS.db.set('grupos_itens',l)}")
        await pg.click('[data-ga="conversa"]'); await pg.click('[data-ga="publicar"]')
        ok('Aprovada pelo grupo' in await pg.inner_text('#g-c') and await pg.locator('[data-cp]').count()==1,"maioria a favor depois das 72 h: aprovada, com texto pronto e atalhos")
        await pg.click('[data-mp]'); ok('Marcada como publicada' in await pg.inner_text('#g-c'),"marcar como publicada (publicação direta não está ativada)")
        # sem votos: cancelada
        await pg.fill('#b-t','Sem votos'); await pg.fill('#b-x','Texto 3.'); await pg.check('input[name=bd][value="YouTube"]'); await pg.click('#b-f button'); await pg.wait_for_selector('[data-vp]')
        await pg.evaluate("()=>{const l=PR_DADOS.db.get('grupos_itens',[]);l.filter(i=>i.tipo==='pub'&&i.status==='votando').forEach(i=>i.prazo=new Date(Date.now()-1000).toISOString());PR_DADOS.db.set('grupos_itens',l)}")
        await pg.click('[data-ga="conversa"]'); await pg.click('[data-ga="publicar"]'); ok('ninguém votou no prazo' in await pg.inner_text('#g-c'),"ninguém votou no prazo: cancelada")
        await pg.evaluate("()=>{const l=PR_DADOS.db.get('grupos_itens',[]);l.filter(i=>i.tipo==='pub'&&i.titulo==='Segunda proposta').forEach(i=>{i.votos['rita@teste.com']='nao'});PR_DADOS.db.set('grupos_itens',l)}")

        # ---------- 8b. Recursos no estilo WhatsApp Business (sem integração com o WhatsApp)
        await como(pg,'rita@teste.com'); await grupos(pg); await pg.locator('.card:has-text("Mestres do Parque Retiro") [data-abre]').click(); await pg.click('[data-ga="publicar"]')
        ok(await pg.locator('summary:has-text("Avisar os membros")').count()>=1,"aviso da votação: texto pronto para e-mail e WhatsApp")
        await pg.locator('summary:has-text("Avisar os membros")').first.click()
        hr=await pg.locator('a:has-text("Avisar por e-mail")').first.get_attribute('href'); ok(hr.startswith('mailto:?bcc=') and 'beto%40teste.com' in hr and 'subject=' in hr,"e-mail abre com os membros em cópia oculta")
        wa=await pg.locator('a[href^="https://wa.me/55"]').count(); ok(wa>=1,"WhatsApp abre a conversa pronta com cada membro (sem envio automático)")
        await pg.click('[data-ga="ajustes"]'); await pg.fill('#a-s','Regras: respeito e foco no tema.'); await pg.click('#a-f button'); await pg.wait_for_selector('text=Ajustes salvos')
        await pg.fill('#r-a','Convite da reunião'); await pg.fill('#r-t','Está aberta a data da Reunião de Escola. Votem, por favor.'); await pg.click('#r-f button'); await pg.wait_for_selector('text=Convite da reunião')
        await pg.click('[data-ga="conversa"]'); ok('Regras: respeito' in await pg.inner_text('#g-c'),"saudação e regras aparecem no topo da conversa")
        await pg.select_option('#m-r',index=1); ok('Reunião de Escola. Votem' in await pg.input_value('#m-t'),"resposta rápida insere o texto pronto")
        await pg.fill('#m-t','@Beto confira o anexo'); await pg.set_input_files('#m-a',{'name':'pauta.txt','mimeType':'text/plain','buffer':b'Pauta da reuniao'}); await pg.click('#m-f button:not(#m-x)'); await pg.wait_for_selector('a[download="pauta.txt"]')
        ok(await pg.locator('mark:has-text("@Beto")').count()==1,"menção @Beto destacada"); 
        await pg.set_input_files('#m-a',{'name':'grande.bin','mimeType':'application/octet-stream','buffer':b'x'*(160*1024)}); await pg.fill('#m-t','x'); await pg.click('#m-f button:not(#m-x)'); ok('150 KB' in await pg.inner_text('#m-er'),"anexo acima de 150 KB é recusado com orientação")
        ult=pg.locator('.card:has([data-es])').last
        await ult.locator('[data-es]').click(); await pg.locator('#f-s').check(); await pg.click('#f-f button'); ok(await pg.locator('.card:has([data-es])').count()==1,"favoritar e filtrar só favoritas")
        await pg.locator('#f-s').uncheck(); await pg.click('#f-f button')
        await pg.locator('.card:has-text("@Beto") [data-et]').select_option('Decisão'); await pg.select_option('#f-e','Decisão'); await pg.click('#f-f button'); ok(await pg.locator('.card:has([data-es])').count()==1,"etiqueta aplicada e filtro por etiqueta")
        await pg.select_option('#f-e',''); await pg.fill('#f-b','Combinado'); await pg.click('#f-f button'); ok(await pg.locator('.card:has([data-es])').count()==1,"busca na conversa")
        await pg.fill('#f-b',''); await pg.click('#f-f button')
        PROMPT[0]='@Beto confira a pauta anexa'
        await pg.locator('.card:has-text("@Beto") [data-ed]').click(); await pg.wait_for_selector('text=editada')
        PROMPT[0]='Construção Parque Retiro'
        await pg.locator('.card:has-text("@Beto") [data-en]').click(); await pg.wait_for_selector('text=Mensagem encaminhada')
        enc=[i for i in await db(pg,'grupos_itens') if i.get('encaminhada')]; ok(len(enc)==1 and enc[0]['de']=='Mestres do Parque Retiro' and enc[0]['anexo']['nome']=='pauta.txt',"mensagem encaminhada a outro grupo, com o anexo e a origem")
        await como(pg,'beto@teste.com'); await grupos(pg); await pg.locator('.card:has-text("Mestres do Parque Retiro") [data-abre]').click(); await pg.wait_for_selector('#m-f')
        await como(pg,'rita@teste.com'); await grupos(pg); await pg.locator('.card:has-text("Mestres do Parque Retiro") [data-abre]').click(); await pg.wait_for_selector('#m-f')
        ok('Visto por 1: Beto Membro' in await pg.inner_text('#g-c'),"confirmação de leitura: 'Visto por' mostra quem leu")
        await pg.click('[data-ga="ajustes"]'); await pg.check('#a-v'); await pg.click('#a-f button'); await pg.wait_for_selector('text=Ajustes salvos')
        await como(pg,'beto@teste.com'); await grupos(pg); await pg.locator('.card:has-text("Mestres do Parque Retiro") [data-abre]').click(); await pg.wait_for_selector('text=Grupo de avisos')
        ok(await pg.locator('#m-f').count()==0 and await pg.locator('[data-ga="ajustes"]').count()==0,"grupo de avisos: membro comum não envia e não vê os Ajustes")
        await pg.click('[data-ga="membros"]'); ok('Resumo do grupo' in await pg.inner_text('#g-c') and 'sigla MPR' in await pg.inner_text('#g-c'),"resumo do grupo e sigla só na área de backup")

        # ---------- 9. Permissões e backup
        await como(pg,'fora@teste.com'); await grupos(pg)
        ok('Mestres do Parque Retiro' not in await pg.inner_text('#app'),"quem não é membro não vê o grupo na lista")
        await como(pg,'beto@teste.com'); await grupos(pg); await pg.locator('.card:has-text("Mestres do Parque Retiro") [data-abre]').click(); await pg.click('[data-ga="membros"]')
        ok(await pg.locator('#b-dl').count()==0 and await pg.locator('#c-b').count()==0,"membro comum não baixa o backup nem convida")
        await como(pg,'rita@teste.com'); await grupos(pg); await pg.locator('.card:has-text("Mestres do Parque Retiro") [data-abre]').click(); await pg.click('[data-ga="membros"]')
        await pg.select_option('#c-s','carla@teste.com'); await pg.click('#c-b'); await pg.wait_for_selector('text=Convite feito')
        async with pg.expect_download() as dw: await pg.click('#b-dl')
        d=await dw.value; ok(d.suggested_filename.startswith('grupo-MPR-') and d.suggested_filename.endswith('.json'),f"backup baixado com a sigla no nome ({d.suggested_filename})")
        conteudo=json.load(open(await d.path(),encoding='utf-8')); ok(conteudo['grupo']['sigla']=='MPR' and len(conteudo['itens'])>=5,"arquivo traz o grupo e o histórico")
        await como(pg,'carla@teste.com'); await grupos(pg); ok('Mestres do Parque Retiro' in await pg.inner_text('#app'),"convidada passa a ver o grupo")
        await como(pg,'a@t.com'); await grupos(pg); ok('Mestres do Parque Retiro' in await pg.inner_text('#app') and 'Construção Parque Retiro' in await pg.inner_text('#app') and '(MPR)' not in await pg.inner_text('#app'),"Administrador vê todos os grupos")
        ok(not errs,f"sem erros de JavaScript ({errs[:1]})"); ok(not net,f"nenhuma requisição externa ({net[:2]})")
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
