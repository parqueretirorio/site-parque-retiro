# Testes do sistema de ajuda (ajuda.js, ajuda-conteudo.js, ajuda-admin.js, ajuda.html).
# Uso, a partir da pasta do site:  python3 tests/teste_central_ajuda.py   (Python + Playwright)
# Opcional: FA_LOCAL=/caminho/fontawesome-free para ícones sem internet.
# Gera também tests/cobertura_ajuda.json: para cada página e ferramenta, quantos itens têm explicação escrita, automática ou nenhuma.
import asyncio, subprocess, time, os, json
from playwright.async_api import async_playwright
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8812; U = f'http://localhost:{PORT}/'
FA = os.environ.get('FA_LOCAL')
ok = 0
def check(cond, msg):
    global ok
    if not cond: raise AssertionError(msg)
    ok += 1; print('  ✓', msg)

async def contexto(b, **kw):
    ctx = await b.new_context(accept_downloads=True, **kw); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"
        # o acesso temporário pela mandala foi desligado no site (10/11/2026); o teste o religa só no navegador de teste, para entrar como administrador
        "try{let v;Object.defineProperty(window,'PR_ACESSO_TEMPORARIO',{configurable:true,get(){return v},set(x){v=Object.assign({},x,{ativo:true})}});if(!localStorage.getItem('teste_temp_dono')){localStorage.setItem('teste_temp_dono','1');sessionStorage.setItem('pr_temp','1')}}catch(e){}")
    if FA:
        async def fa(route):
            u = route.request.url
            if u.endswith('.css'): await route.fulfill(path=FA + '/css/all.min.css', content_type='text/css')
            else: await route.fulfill(path=FA + '/webfonts/' + u.split('/')[-1].split('?')[0])
        await ctx.route('https://cdnjs.cloudflare.com/**', fa)
    else:
        await ctx.route('https://cdnjs.cloudflare.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
    return ctx

async def main():
    srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '-d', SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
    errs = []
    try:
      async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await contexto(b, viewport={'width': 1280, 'height': 860})
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))

        print('1. Conteúdo íntegro')
        await pg.goto(U + 'ajuda.html'); await pg.wait_for_selector('.pr-aj-cartao-cat')
        r = await pg.evaluate("""()=>{const C=PR_AJUDA.conteudo(),ids=new Set(C.artigos.map(a=>a.id)),e=[];
          C.artigos.forEach(a=>{(a.relacionados||[]).forEach(x=>{if(!ids.has(x))e.push(a.id+'>'+x)});if(!C.categorias.some(c=>c.id===a.categoria))e.push('cat '+a.id)});
          C.dicas.forEach(d=>{if(d.artigo&&!ids.has(d.artigo))e.push('dica '+d.id)});Object.entries(C.contextos).forEach(([k,v])=>{if(!ids.has(v))e.push('ctx '+k)});
          return {e, n:C.artigos.length, d:C.dicas.size, img:C.artigos.reduce((s,a)=>s+(a.imagens||[]).length,0), semRel:C.artigos.filter(a=>PR_AJUDA.relacionados(a).length<2).map(a=>a.id)}}""")
        check(not r['e'], f"referências válidas ({r['n']} artigos, {r['d']} explicações): {r['e'][:5]}")
        check(not r['semRel'], 'todo artigo tem pelo menos 2 conteúdos relacionados')
        check(r['img'] >= 40, f"{r['img']} imagens ligadas aos artigos")
        imgs = await pg.evaluate("()=>PR_AJUDA.conteudo().artigos.flatMap(a=>(a.imagens||[]).map(i=>i.src)).filter(s=>!/^(https?:|data:)/.test(s))")
        falt = [s for s in imgs if not os.path.exists(os.path.join(SITE, s))]
        check(not falt, f'todas as imagens existem no site {falt[:3]}')

        print('2. Todas as páginas carregam o botão de ajuda, sem erros')
        pags = sorted(f for f in os.listdir(SITE) if f.endswith('.html') and f != 'eventos.html')
        for f in pags:
            await pg.goto(U + f); await pg.wait_for_selector('#pr-aj-botao', state='attached', timeout=5000)
        check(not errs, f'{len(pags)} páginas sem erro de JavaScript {errs[:2]}')

        print('3. Dica rápida (mouse) e Saiba mais')
        await pg.goto(U + 'como-fazer.html'); await pg.hover('#f-chegada'); await pg.wait_for_selector('#pr-aj-tip.on', timeout=3000)
        check('Primeiro dia' in await pg.inner_text('#pr-aj-tip'), 'dica escrita do campo Dia de chegada')
        check(await pg.get_attribute('#f-chegada', 'aria-describedby') == 'pr-aj-tip', 'campo ligado à dica para leitores de tela (aria-describedby)')
        await pg.hover('#pr-aj-tip .pr-aj-mais'); await pg.click('#pr-aj-tip .pr-aj-mais')
        await pg.wait_for_selector('#pr-aj-painel .pr-aj-artigo[data-artigo="calendario-de-uso"]')
        check(True, 'Saiba mais abre o artigo certo no painel, sem sair da página')
        check('Conteúdos relacionados' in await pg.inner_text('#pr-aj-painel'), 'artigo traz Conteúdos relacionados')
        await pg.click('#pr-aj-painel .pr-aj-rel a >> nth=0'); await pg.wait_for_selector('#pr-aj-painel [data-volta]')
        check(True, 'link relacionado navega dentro do painel (com Voltar)')
        await pg.keyboard.press('Escape'); check(await pg.is_hidden('#pr-aj-painel'), 'Esc fecha o painel')

        print('4. Teclado: Tab mostra a dica, F1 abre a explicação')
        await pg.focus('#f-email'); await pg.keyboard.press('Tab'); await pg.wait_for_selector('#pr-aj-tip.on')
        check(await pg.is_visible('#pr-aj-tip .pr-aj-f1'), 'dica ao chegar pelo Tab, com aviso de F1')
        await pg.keyboard.press('F1'); await pg.wait_for_selector('#pr-aj-card:not([hidden])')
        check('Dia de chegada' in await pg.inner_text('#pr-aj-card'), 'F1 abre a explicação do item em foco')
        await pg.keyboard.press('Escape'); check(await pg.is_hidden('#pr-aj-card'), 'Esc fecha a explicação')

        print('5. Modo ajuda: explica e não executa')
        volta = pg.url
        await pg.click('#pr-aj-botao'); await pg.wait_for_url('**/ajuda.html'); check(await pg.is_hidden('#pr-aj-painel'), 'botão Ajuda do menu abre a página ajuda.html, sem painel flutuante')
        await pg.click('[data-modo-pg]'); await pg.goto(volta); await pg.wait_for_selector('#pr-aj-botao', state='attached')
        check(await pg.evaluate('PR_AJUDA.emModo()'), 'modo ajuda ligado na Central continua ligado nas outras páginas')
        url0 = pg.url; await pg.click('form button.btn-visit, form button[type=submit] >> nth=0'); await pg.wait_for_timeout(300)
        check(pg.url == url0 and await pg.is_visible('#pr-aj-card'), 'clique no botão Enviar mostra a explicação e não envia')
        await pg.click('.pr-aj-faixa-sair'); check(not await pg.evaluate('PR_AJUDA.emModo()'), 'sair do modo ajuda')

        print('6. Central de Ajuda (ajuda.html)')
        await pg.goto(U + 'ajuda.html'); await pg.fill('#pa-q', 'backup'); await pg.press('#pa-q', 'Enter'); await pg.wait_for_selector('.pr-aj-cartao')
        check('backup-e-restauracao' in await pg.eval_on_selector_all('.pr-aj-cartao', 'a=>a.map(x=>x.dataset.ajPg).join(" ")'), 'busca encontra "Backup e restauração"')
        await pg.goto(U + 'ajuda.html?a=pedir-reserva'); await pg.wait_for_selector('h1.pr-aj-titulo')
        check('Pedir reserva' in await pg.inner_text('h1.pr-aj-titulo') and await pg.locator('.pr-aj-fig img').count() >= 1, 'link direto para o artigo, com imagem')
        await pg.goto(U + 'index.html?ajuda=backup-e-restauracao'); await pg.wait_for_selector('#pr-aj-painel [data-artigo="backup-e-restauracao"]')
        check(True, '?ajuda=artigo abre o painel em qualquer página')

        print('7. Área restrita: dicas em todas as ferramentas e cobertura')
        await pg.goto(U + 'login.html'); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n', 'Admin Teste'); await pg.fill('#e', 'a@t.com'); await pg.fill('#s', 'senha12345'); await pg.fill('#s2', 'senha12345'); await pg.fill('#w', '21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url('**/area-restrita.html')
        check(await pg.locator('[data-tab="central_ajuda"]').count() == 1, 'administrador vê a ferramenta Central de Ajuda')
        tabs = await pg.eval_on_selector_all('[data-tab]', 'b=>b.map(x=>x.dataset.tab)')
        cob = {}; sem = []
        for t in tabs:
            await pg.evaluate("k=>document.querySelector(`[data-tab=${k}]`).click()", t); await pg.wait_for_timeout(120)
            n = await pg.eval_on_selector_all('#tab .tabs.sub .tab-btn', 'b=>b.length'); vistas = [None] + list(range(n))
            for i in vistas:
                if i is not None: await pg.evaluate("i=>{const b=document.querySelectorAll('#tab .tabs.sub .tab-btn')[i];if(b)b.click()}", i); await pg.wait_for_timeout(100)
                a = await pg.evaluate("()=>PR_AJUDA.auditar(document.querySelector('#tab'))")
                for x in a:
                    c = cob.setdefault('r.' + t, {}); c[x['chave']] = x['fonte']
                    if x['fonte'] == 'nenhuma' and x['tag'] != 'a': sem.append(t + ':' + x['chave'])
        check(not sem, f'todo botão e campo da área restrita tem explicação (escrita ou automática) {sem[:6]}')
        tot = {'escrita': 0, 'automatica': 0, 'nenhuma': 0}
        for v in cob.values():
            for f in v.values(): tot[f] += 1
        print('     área restrita:', tot)
        await pg.evaluate("document.querySelector('[data-tab=contas]').click()"); await pg.hover('#c-cc'); await pg.wait_for_selector('#pr-aj-tip.on')
        check('Centro de custo' in await pg.inner_text('#pr-aj-tip'), 'dica de campo dentro da Prestação de Contas')

        print('8. Edição sem código: explicação e artigo')
        await pg.evaluate("document.querySelector('[data-tab=zoom]').click()"); await pg.evaluate('PR_AJUDA.modo(true)')
        await pg.click('#z-l'); await pg.click('[data-edita]')
        await pg.fill('#pr-aj-card textarea[name=x]', 'Texto NOVO de teste para o link do Zoom.'); await pg.click('#pr-aj-card button.pr-aj-btn-p')
        await pg.evaluate('PR_AJUDA.modo(false)'); await pg.hover('#z-t'); await pg.wait_for_timeout(200); await pg.hover('#z-l')
        await pg.wait_for_function("document.querySelector('#pr-aj-tip.on .pr-aj-tt') && document.querySelector('#pr-aj-tip .pr-aj-tt').textContent.includes('Zoom')", timeout=4000)
        check('Texto NOVO' in await pg.inner_text('#pr-aj-tip'), 'explicação editada no próprio item vale na hora')
        await pg.evaluate("document.querySelector('[data-tab=central_ajuda]').click()"); await pg.click('#ca-novo')
        await pg.fill('#ca-t', 'Artigo de teste da Central'); await pg.fill('#ca-r', 'Resumo do teste.'); await pg.fill('#ca-3', 'Primeiro passo\nSegundo passo'); await pg.select_option('#ca-p', 'todos')  # visível para o visitante da outra aba
        await pg.check('#ca-rel input[value="backup-e-restauracao"]'); await pg.click('#ca-salvar')
        await pg.wait_for_selector('[data-ed="artigo-de-teste-da-central"]')
        check(True, 'novo artigo criado pela área restrita')
        pg2 = await ctx.new_page(); await pg2.goto(U + 'ajuda.html?a=artigo-de-teste-da-central'); await pg2.wait_for_selector('h1.pr-aj-titulo')
        check('Segundo passo' in await pg2.inner_text('.pr-aj-passos') and await pg2.locator('.pr-aj-rel a').count() >= 2, 'artigo novo aparece na Central com passos e relacionados (o relacionado da equipe fica oculto para o visitante)')
        await pg.click('[data-st="artigo-de-teste-da-central"]'); await pg2.reload(); await pg2.wait_for_selector('.pr-aj-vazio')
        check('não encontrado' in await pg2.inner_text('#central-ajuda'), 'retirar do ar: visitante (outra aba, sem login) não vê o rascunho')
        await pg.click('[data-ver="artigo-de-teste-da-central"]'); await pg.wait_for_selector('#pr-aj-painel .pr-aj-rasc')
        check(True, 'quem administra continua vendo o rascunho, com a etiqueta')
        await pg.keyboard.press('Escape')
        await pg.click('[data-ca="pub"]')
        async with pg.expect_download() as dl: await pg.click('#ca-pjs')
        txt = open(await (await dl.value).path(), encoding='utf-8').read()
        check('artigo-de-teste-da-central' in txt and 'Texto NOVO' in txt and txt.count('window.PR_AJUDA_CONTEUDO') == 1, 'Publicar gera ajuda-conteudo.js com as edições')
        async with pg.expect_download() as dl: await pg.click('#ca-pjson')
        j = json.load(open(await (await dl.value).path(), encoding='utf-8'))
        check(isinstance(j['dicas'], list) and any(d['id'] == 'r.zoom.z-l' for d in j['dicas']) and j['formato'] == 'parque-retiro-ajuda', 'conteudo.json para o aplicativo, com as mesmas chaves')
        bk = await pg.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('pr_ajuda_')).sort()")
        check('pr_ajuda_artigos' in bk and 'pr_ajuda_dicas' in bk, 'edições ficam nas coleções que entram no backup')

        print('9. Permissões')
        await pg.evaluate("""()=>{const l=PR_DADOS.db.get('users',[]);l.push({email:'l@t.com',nome:'Leitora Teste',nivel:'leitor',status:'aprovado',funcoes:[],whatsapp:'21999990001',lgpd:{aceite:true}});PR_DADOS.db.set('users',l);sessionStorage.setItem('pr_sess','l@t.com')}""")
        await pg.goto(U + 'area-restrita.html'); await pg.wait_for_selector('[data-tab]')
        check(await pg.locator('[data-tab="central_ajuda"]').count() == 0, 'leitor sem a responsabilidade não vê a ferramenta')
        await pg.evaluate("document.querySelector('[data-tab=acervo]').click()"); await pg.evaluate('PR_AJUDA.modo(true)'); await pg.click('#q')
        check(await pg.locator('#pr-aj-card [data-edita]').count() == 0, 'leitor não vê "Editar esta explicação"')

        print('10. Celular e tablet')
        m = await contexto(b, viewport={'width': 390, 'height': 800}, is_mobile=True, has_touch=True)
        q = await m.new_page(); q.on('pageerror', lambda e: errs.append(str(e)))
        await q.goto(U + 'como-fazer.html'); await q.wait_for_selector('label[for=f-chegada] .pr-aj-i')
        check(True, 'símbolo (i) ao lado dos campos com explicação')
        pos = await q.evaluate("(()=>{const b=document.querySelector('#pr-aj-botao');return {menu:!!b.closest('header nav'),antesBlogger:b.parentElement.nextElementSibling===null&&b.nextElementSibling&&b.nextElementSibling.getAttribute('href')==='blogger.html'}})()")
        check(pos['menu'] and pos['antesBlogger'], 'botão Ajuda é item do menu, imediatamente à esquerda de Blogger')
        await q.tap('label[for=f-chegada] .pr-aj-i'); await q.wait_for_selector('#pr-aj-card.folha')
        check(await q.get_attribute('#pr-aj-card', 'aria-modal') == 'true', 'explicação abre como folha (bottom sheet) modal')
        await q.tap('.pr-aj-fundo'); check(await q.is_hidden('#pr-aj-card'), 'toque fora fecha a folha')
        await q.evaluate("document.querySelector('.pr-aj-busca')||0"); await q.evaluate('PR_AJUDA.abrir()')
        w = await q.eval_on_selector('#pr-aj-painel', 'p=>p.getBoundingClientRect().width')
        check(w >= 389, 'painel de ajuda ocupa a tela inteira no celular')
        check(not errs, f'sem erros de JavaScript {errs[:3]}')
        json.dump(cob, open(os.path.join(SITE, 'tests', 'cobertura_ajuda.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        await b.close()
    finally:
        srv.terminate()
    print(f'\nOK: {ok} verificações')

asyncio.run(main())
