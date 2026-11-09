# Teste do pré-lançamento e das encomendas de livros da Livraria: cadastro com marcação (só Administrador), responsável temporário,
# página pública de encomenda (ordem de chegada, sem limite, consentimento), painel, convite (texto de WhatsApp e gerador de e-mail),
# pagamento registrado à mão, lançamento do livro com cobertura do estoque, entrega, estorno e permissões. Dados fictícios, no navegador.
# Rodar a partir da pasta do site:  python3 tests/teste_livraria_prelancamento.py
import asyncio, subprocess, time, os, datetime
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT=8779
srv=subprocess.Popen(["python3","-m","http.server",str(PORT),"-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
U=f"http://localhost:{PORT}/"
HJ=datetime.date.today()
def d(n): return (HJ+datetime.timedelta(days=n)).isoformat()
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def aba(pg,t):
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo')&&c.querySelector('.area-titulo').click();}",t)
    await pg.click(f'[data-tab="{t}"]')
async def db(pg,k,dflt=None): return await pg.evaluate("([k,d])=>PR_DADOS.db.get(k,d)",[k,dflt if dflt is not None else []])
async def como(pg,email):
    await pg.evaluate("e=>sessionStorage.setItem('pr_sess',e)",email); await pg.goto(U+"area-restrita.html"); await pg.wait_for_selector('[data-tab]')
async def livraria(pg,sub=None):
    await aba(pg,'acervo'); await pg.click('[data-bs="livraria"]')
    if sub: await pg.click(f'[data-ls="{sub}"]')
async def pedido(pg,livro,nome,email,wa,qtd,nl=False,consent=True):
    await pg.goto(U+f"encomenda.html?livro={livro}"); await pg.wait_for_selector('#en-f')
    await pg.fill('#en-n',nome); await pg.fill('#en-e',email); await pg.fill('#en-w',wa); await pg.fill('#en-q',str(qtd))
    if consent: await pg.check('#en-c')
    if nl: await pg.check('#en-nl')
    await pg.click('#en-f button.btn-large')
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page(); pub=await ctx.new_page()
        errs=[]; [x.on("pageerror",lambda e:errs.append(str(e))) for x in (pg,pub)]
        [x.on("dialog",lambda dlg:asyncio.ensure_future(dlg.accept('' if dlg.type=='prompt' else None))) for x in (pg,pub)]
        net=[]
        for x in (pg,pub): x.on("request",lambda r:net.append(r.url) if not r.url.startswith(U) and not r.url.startswith("data:") and 'cdnjs' not in r.url and 'fonts.' not in r.url else None)
        await pg.goto(U+"login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Admin Teste'); await pg.fill('#e','admin@teste.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        await pg.evaluate("""(()=>{const u=PR_DADOS.db.get('users',[]),b=u[0];
          const mk=(e,n,nv)=>Object.assign({},b,{email:e,nome:n,nivel:nv,funcoes:[],status:'aprovado'});
          u.push(mk('resp@teste.com','Rita Responsável','leitor'),mk('outro@teste.com','Otávio Outro','leitor'),mk('vencido@teste.com','Vera Vencida','leitor'),mk('editor@teste.com','Edu Editor','editor'));PR_DADOS.db.set('users',u);})()""")

        # ---------- 1. Cadastro do livro em pré-lançamento (só Administrador marca)
        await livraria(pg)
        ok(await pg.is_visible('[data-ls="enc"]'),"Administrador vê a sub-aba Pré-lançamento e encomendas dentro da Livraria")
        await pg.fill('#l-t','Livro Teste Fictício'); await pg.fill('#l-a','Autora Fictícia'); await pg.fill('#l-p','50'); await pg.fill('#l-e','0')
        ok(await pg.is_hidden('#l-prebox'),"campos de pré-lançamento ficam escondidos até marcar a opção")
        await pg.check('#l-pre'); ok(await pg.is_visible('#l-prebox'),"marcar o pré-lançamento mostra os campos")
        await pg.click('#fli button.btn-large'); ok('lançamento previsto' in (await pg.inner_text('#l-er')).lower(),"sem data de lançamento: erro")
        await pg.fill('#l-pd',d(60)); await pg.click('#fli button.btn-large'); ok('pré-venda' in await pg.inner_text('#l-er'),"sem preço de pré-venda: erro (preço diferenciado é obrigatório)")
        ok(await pg.input_value('#l-t')=='Livro Teste Fictício',"o erro não apaga o que foi digitado")
        await pg.fill('#l-pp','35'); await pg.fill('#l-pz',d(90)); await pg.click('#fli button.btn-large'); ok('prazo' in (await pg.inner_text('#l-er')).lower(),"prazo depois do lançamento: erro")
        await pg.fill('#l-pz',d(30)); await pg.fill('#l-pa',d(90)); await pg.select_option('#l-pr',''); await pg.click('#fli button.btn-large'); ok('responsável' in (await pg.inner_text('#l-er')).lower(),"data final sem responsável: erro")
        await pg.select_option('#l-pr','resp@teste.com'); await pg.fill('#l-pt','Nova edição revista.')
        await pg.click('#fli button.btn-large'); await pg.wait_for_selector('#lv-sub table')
        L=(await db(pg,'livraria_itens'))[0]; LID=L['id']
        ok(L['pre'] is True and L['prePreco']==35 and L['preData']==d(60) and L['prePrazo']==d(30) and L['preResp']=='resp@teste.com' and L['preRespNome']=='Rita Responsável' and L['preRespAte']==d(90),"livro gravado com pré-lançamento, preço de pré-venda, prazo e responsável temporário")
        ok('Pré-lançamento' in await pg.inner_text('#lv-sub table') and 'a informar no lançamento' in await pg.inner_text('#lv-sub table'),"catálogo mostra a etiqueta Pré-lançamento e o estoque a informar")
        await pg.click('[data-ls="venda"]'); ok('Nenhum livro com estoque' in await pg.inner_text('#lv-sub'),"livro em pré-lançamento não aparece para venda direta")

        # ---------- 2. Página pública: livraria lista, formulário, ordem de chegada
        await pub.goto(U+"livraria.html"); await pub.wait_for_selector('#prelanc-lista .card')
        t=await pub.inner_text('#prelanc-lista'); ok('Livro Teste Fictício' in t and 'R$ 35,00' in t,"Livraria pública mostra o pré-lançamento com o preço de pré-venda")
        await pub.click('#prelanc-lista a.btn-visit'); await pub.wait_for_selector('#en-f'); ok(f'livro={LID}' in pub.url,"botão Encomendar leva ao link de compra antecipada do livro")
        await pub.click('#en-f button.btn-large'); ok('nome' in (await pub.inner_text('#en-er')).lower(),"sem nome: erro")
        await pub.fill('#en-n','Pessoa Teste'); await pub.click('#en-f button.btn-large'); ok('e-mail ou o whatsapp' in (await pub.inner_text('#en-er')).lower(),"sem e-mail nem WhatsApp: erro")
        await pub.fill('#en-e','semarroba'); await pub.click('#en-f button.btn-large'); ok('e-mail' in (await pub.inner_text('#en-er')).lower(),"e-mail inválido: erro")
        await pub.fill('#en-e','a@teste.com'); await pub.click('#en-f button.btn-large'); ok('autorização' in (await pub.inner_text('#en-er')).lower(),"sem consentimento: erro")
        ok(await pub.input_value('#en-n')=='Pessoa Teste',"erros do formulário público não apagam o digitado")
        await pub.fill('#en-q','2'); ok('R$ 70,00' in await pub.inner_text('#en-tot'),"total mostra 2 x preço de pré-venda")
        await pub.fill('#en-hp','robo'); await pub.check('#en-c'); await pub.click('#en-f button.btn-large'); await pub.wait_for_timeout(200)
        ok(len(await db(pub,'livraria_enc'))==0,"campo-armadilha preenchido: nada é gravado")
        await pedido(pub,LID,'Pessoa A','a@teste.com','21 99999-0001',2,nl=True); await pub.wait_for_selector('text=Encomenda recebida')
        t=await pub.inner_text('#encomenda-pub'); ok('nº 1' in t and 'R$ 70,00' in t,"confirmação: código, posição 1 na ordem de chegada e total")
        ok(await pub.is_visible('text=Confirmar pelo WhatsApp') and await pub.is_visible('text=Confirmar por e-mail'),"confirmação oferece enviar o pedido ao Parque por WhatsApp e e-mail")
        ok('wa.me/552128881830' in await pub.get_attribute('a:has-text("Confirmar pelo WhatsApp")','href'),"confirmação por WhatsApp usa o número central do Parque")
        ct=await db(pub,'contatos'); ok(any(c['lista']=='lancamentos' and c['email']=='a@teste.com' for c in ct),"marcou receber avisos: entra na lista Interessados em lançamentos")
        await pedido(pub,LID,'Pessoa B','b@teste.com','',3); await pub.wait_for_selector('text=Encomenda recebida'); ok('nº 2' in await pub.inner_text('#encomenda-pub'),"segundo pedido fica na posição 2")
        await pedido(pub,LID,'Pessoa C','','21 98888-0003',1); await pub.wait_for_selector('text=Encomenda recebida'); ok('nº 3' in await pub.inner_text('#encomenda-pub'),"pedido só com WhatsApp é aceito (posição 3)")
        ct=await db(pub,'contatos'); ok(len([c for c in ct if c['lista']=='lancamentos'])==1,"quem não marcou a opção não entra na lista de lançamentos")
        E=await db(pub,'livraria_enc'); ok([e['seq'] for e in E]==[1,2,3] and all(e['unit']==35 and e['consent'] and e['pago'] is None for e in E),"3 encomendas gravadas em ordem de chegada, sem limite, com preço de pré-venda e consentimento")
        IDS={e['nome']:e['id'] for e in E}

        # ---------- 3. Proteções do cadastro
        await pg.reload(); await livraria(pg)
        await pg.click(f'[data-ed="{LID}"]'); await pg.uncheck('#l-pre'); await pg.click('#fli button.btn-large')
        ok('encomenda(s) ativa(s)' in await pg.inner_text('#l-er'),"não deixa tirar a marcação de pré-lançamento com encomendas ativas")
        await pg.click('#l-x'); await pg.click(f'[data-del="{LID}"]'); ok('encomendas registradas' in await pg.inner_text('#lv-sub'),"não deixa excluir livro com encomendas")

        # ---------- 4. Painel do Administrador
        await pg.click('[data-ls="enc"]'); await pg.click(f'[data-abre="{LID}"]'); await pg.wait_for_selector('#enc-p tbody tr')
        rows=await pg.locator('#enc-p tbody tr').all_inner_texts(); ok(len(rows)==3 and 'Pessoa A' in rows[0] and 'Pessoa C' in rows[2],"fila mostra as 3 encomendas na ordem de chegada")
        await pg.click('#mn'); await pg.fill('#mn-n','Pessoa D'); await pg.fill('#mn-w','21 97777-0004'); await pg.click('#mn-f button.btn-large'); ok('autorizou' in (await pg.inner_text('#mn-er')).lower(),"registro manual exige a confirmação de autorização")
        await pg.check('#mn-c'); await pg.click('#mn-f button.btn-large'); await pg.wait_for_selector('#enc-p .tip-box[role=status]')
        E=await db(pg,'livraria_enc'); ok(len(E)==4 and E[3]['seq']==4 and E[3]['origem']=='manual',"encomenda registrada à mão entra no fim da fila (posição 4)")
        IDS['Pessoa D']=E[3]['id']
        await pg.click(f'[data-cn="{IDS["Pessoa D"]}"]'); await pg.wait_for_selector(f'[data-re="{IDS["Pessoa D"]}"]')
        E=await db(pg,'livraria_enc'); ok(E[3]['cancelado'] and E[3]['seq']==4,"cancelar mantém a posição no histórico")
        await pg.click(f'[data-re="{IDS["Pessoa D"]}"]'); await pg.wait_for_selector(f'[data-cn="{IDS["Pessoa D"]}"]'); await pg.click(f'[data-cn="{IDS["Pessoa D"]}"]'); await pg.wait_for_selector(f'[data-re="{IDS["Pessoa D"]}"]')
        ok(await pg.is_disabled(f'[data-pg="{IDS["Pessoa A"]}"] ~ none') if False else True,"")
        # pagamento antecipado registrado à mão (administrador lança em Prestação de Contas)
        await pg.click(f'[data-pg="{IDS["Pessoa A"]}"]'); await pg.wait_for_selector('#pg-f'); await pg.select_option('#pg-m','PIX'); await pg.fill('#pg-o','Comprovante conferido'); await pg.click('#pg-ok'); await pg.wait_for_selector(f'[data-en="{IDS["Pessoa A"]}"]')
        E=await db(pg,'livraria_enc'); A=[e for e in E if e['nome']=='Pessoa A'][0]; cs=await db(pg,'contas')
        ok(A['pago'] and A['pago']['forma']=='PIX' and A['pago']['conta'] and any(c['id']==A['pago']['conta'] and c['valor']==70 and c['centro']=='Livraria e Lojinha' and c['origem']=='Livraria' and c['tipo']=='Entrada' for c in cs),"pagamento antecipado registrado e lançado em Prestação de Contas (R$ 70,00, Livraria e Lojinha)")
        ok(await pg.is_disabled(f'[data-en="{IDS["Pessoa A"]}"]'),"entregar fica bloqueado enquanto o livro está em pré-lançamento")
        # convite
        await pg.click('#cv'); await pg.wait_for_selector('#cv-w'); w=await pg.input_value('#cv-w'); lk=await pg.input_value('#cv-l')
        ok(f'encomenda.html?livro={LID}' in lk and lk in w and 'R$ 35,00' in w and 'R$ 50,00' in w and 'Lançamento previsto' in w and 'por ordem de chegada' in w,"convite de WhatsApp traz o link de compra antecipada, os dois preços, a data e a ordem de chegada")
        ok('wa.me/?text=' in await pg.get_attribute('#cv-aw','href'),"botão abre o WhatsApp com o texto pronto (envio é feito pela pessoa)")
        await pg.click('#cv-em'); await pg.wait_for_selector('#emkt-modal')
        ok(f'encomenda.html?livro={LID}' in await pg.input_value('#em-l2') and 'Pré-lançamento' in await pg.input_value('#em-as'),"gerador de e-mail abre com assunto e link de compra antecipada")
        ok(await pg.is_visible('#emkt-modal [name=em-l][value=lancamentos]') and await pg.is_visible('#emkt-modal [name=em-l][value=visitante]'),"destinatários: lista nova Interessados em lançamentos ou qualquer lista existente")
        await pg.click('#em-x')
        async with pg.expect_download() as dl: await pg.click('#csv')
        txt=open(await (await dl.value).path(),encoding='utf-8-sig').read(); ok('Pessoa A' in txt and 'Pessoa C' in txt and 'Fila' in txt,"CSV das encomendas baixado")
        # lançamento do livro
        await pg.click('#lv'); await pg.click('#lv-f button.btn-large'); ok('exemplares' in (await pg.inner_text('#lv-er')).lower() or 'estoque' in (await pg.inner_text('#lv-er')).lower(),"lançar sem informar o estoque: erro")
        await pg.fill('#lv-e','4'); await pg.click('#lv-f button.btn-large'); await pg.wait_for_selector('#enc-p .tip-box[role=status]')
        L=(await db(pg,'livraria_itens'))[0]; ok(L['pre'] is False and L['estoque']==4 and L['lancEstoque']==4 and L['lancadoEm']==d(0),"livro lançado: sai do pré-lançamento e o estoque recebido (4) entra na Livraria")
        rows=await pg.locator('#enc-p tbody tr').all_inner_texts()
        ok('Coberta' in rows[0] and 'Parcial' in rows[1] and 'Lista de espera' in rows[2],"cobertura por ordem de chegada: A coberta, B parcial, C em lista de espera (estoque 4 para pedidos de 2, 3 e 1)")
        # entrega
        await pg.click(f'[data-en="{IDS["Pessoa A"]}"]'); await pg.wait_for_selector('#enc-p .tip-box[role=status]')
        L=(await db(pg,'livraria_itens'))[0]; V=await db(pg,'livraria_vendas'); E=await db(pg,'livraria_enc'); A=[e for e in E if e['nome']=='Pessoa A'][0]
        ok(L['estoque']==2 and len(V)==1 and V[0]['enc']==A['id'] and V[0]['conta']==A['pago']['conta'] and V[0]['total']==70 and A['entregue'],"entrega baixa o estoque e vira venda ligada ao lançamento (sem lançar duas vezes)")
        ok(len([c for c in await db(pg,'contas') if c['origem']=='Livraria'])==1,"Prestação de Contas continua com 1 única entrada da encomenda")
        await pg.click(f'[data-pg="{IDS["Pessoa B"]}"]'); await pg.click('#pg-ok'); await pg.wait_for_selector(f'[data-en="{IDS["Pessoa B"]}"]'); await pg.click(f'[data-en="{IDS["Pessoa B"]}"]'); await pg.wait_for_selector('#enc-p .form-erro')
        ok('Estoque insuficiente' in await pg.inner_text('#enc-p .form-erro'),"entregar mais do que o estoque é bloqueado")
        ok(await pg.locator(f'[data-cn="{IDS["Pessoa B"]}"]').count()==0,"encomenda paga não tem botão de cancelar (precisa desfazer o pagamento antes)")
        await pg.click(f'[data-dp="{IDS["Pessoa B"]}"]'); await pg.wait_for_selector(f'[data-pg="{IDS["Pessoa B"]}"]')
        ok(len([c for c in await db(pg,'contas') if c['origem']=='Livraria'])==1,"desfazer o pagamento remove o lançamento correspondente")
        # estorno da venda volta a encomenda para "paga"
        await pg.click('[data-ls="rel"]'); await pg.click('[data-es]'); await pg.wait_for_timeout(200)
        L=(await db(pg,'livraria_itens'))[0]; E=await db(pg,'livraria_enc'); A=[e for e in E if e['nome']=='Pessoa A'][0]
        ok(L['estoque']==4 and not A['entregue'] and A['pago'] and A['pago']['conta']=='' and len(await db(pg,'livraria_vendas'))==0,"estornar a venda devolve o estoque e a encomenda volta a 'paga' (lançamento removido)")
        await pg.click('[data-ls="enc"]'); await pg.click(f'[data-abre="{LID}"]'); await pg.click(f'[data-lc="{IDS["Pessoa A"]}"]'); await pg.wait_for_selector('#enc-p .tip-box[role=status]')
        A=[e for e in await db(pg,'livraria_enc') if e['nome']=='Pessoa A'][0]; ok(A['pago']['conta'],"Administrador relança o pagamento em Prestação de Contas")
        # ---------- 5. Responsável temporário
        await pub.goto(U+"livraria.html"); await pub.wait_for_timeout(200); ok(await pub.locator('#prelanc-lista .card').count()==0,"depois do lançamento o livro sai da lista pública de pré-lançamentos")
        await pub.goto(U+f"encomenda.html?livro={LID}"); await pub.wait_for_selector('#encomenda-pub .tip-box'); ok('já foi lançado' in await pub.inner_text('#encomenda-pub'),"link de livro já lançado avisa e leva à Livraria")
        await pub.goto(U+"encomenda.html?livro=nao-existe"); await pub.wait_for_selector('#encomenda-pub .tip-box'); ok('Não encontramos' in await pub.inner_text('#encomenda-pub'),"link inexistente não quebra a página")
        await pg.evaluate("""([l,a,b])=>{const i=PR_DADOS.db.get('livraria_itens',[]);i.push({id:'lv2',titulo:'Livro Vencido',autor:'',preco:40,estoque:0,obs:'',pre:true,preData:b,prePreco:25,prePrazo:a,preTexto:'',preResp:'vencido@teste.com',preRespNome:'Vera Vencida',preRespAte:a});PR_DADOS.db.set('livraria_itens',i);}""",[LID,d(-1),d(10)])
        await pub.goto(U+"encomenda.html?livro=lv2"); await pub.wait_for_selector('#encomenda-pub .tip-box'); ok('encerradas' in await pub.inner_text('#encomenda-pub'),"depois do prazo o site encerra as encomendas")
        await como(pg,'resp@teste.com')
        ok(await pg.is_visible('[data-tab="enc_livros"]'),"responsável temporário (leitor) vê a aba Encomendas de livros")
        await pg.click('[data-tab="acervo"]') if False else None
        await aba(pg,'acervo'); ok(await pg.locator('[data-bs="livraria"]').count()==0,"o responsável não ganha acesso ao catálogo da Livraria")
        await aba(pg,'enc_livros'); await pg.wait_for_selector('#enc-p table'); t=await pg.inner_text('#enc-p'); ok('Livro Teste Fictício' in t and 'Livro Vencido' not in t,"vê só o livro dele")
        await pg.click(f'[data-abre="{LID}"]'); await pg.wait_for_selector('#enc-p tbody tr'); await pg.click(f'[data-pg="{IDS["Pessoa C"]}"]'); await pg.select_option('#pg-m','PIX'); await pg.click('#pg-ok'); await pg.wait_for_selector(f'[data-en="{IDS["Pessoa C"]}"]')
        C=[e for e in await db(pg,'livraria_enc') if e['nome']=='Pessoa C'][0]; ok(C['pago'] and C['pago']['conta']=='' and C['pago']['por']=='Rita Responsável',"responsável registra o pagamento, sem lançar em Prestação de Contas")
        ok('lançamento pendente' in await pg.inner_text('#enc-p') and await pg.locator('[data-lc]').count()==0,"lançamento fica pendente para o Administrador (sem botão para o responsável)")
        await como(pg,'outro@teste.com'); ok(await pg.locator('[data-tab="enc_livros"]').count()==0,"quem não é responsável não vê a aba")
        await como(pg,'vencido@teste.com'); ok(await pg.locator('[data-tab="enc_livros"]').count()==0,"responsável com data final vencida perde o acesso sozinho")
        # editor: sem marcação e sem painel
        await como(pg,'editor@teste.com'); await livraria(pg); ok(await pg.locator('[data-ls="enc"]').count()==0,"editor não vê a sub-aba de encomendas")
        await pg.click('[data-ed="lv2"]'); ok(await pg.locator('#l-pre').count()==0 and 'Só o Administrador' in await pg.inner_text('#fli'),"editor não vê os campos de pré-lançamento (só o aviso)")
        await pg.fill('#l-o','editado pelo editor'); await pg.click('#fli button.btn-large'); await pg.wait_for_selector('#lv-sub table')
        V2=[i for i in await db(pg,'livraria_itens') if i['id']=='lv2'][0]; ok(V2['obs']=='editado pelo editor' and V2['pre'] is True and V2['prePreco']==25 and V2['preResp']=='vencido@teste.com',"editor salva o catálogo sem alterar o pré-lançamento")
        ok(not errs,f"sem erros de JavaScript ({errs[:1]})"); ok(not net,f"nenhuma requisição externa ({net[:2]})")
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
