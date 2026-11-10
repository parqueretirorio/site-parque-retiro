# Teste da Fase 1 (login real e dados no servidor) contra o PostgreSQL de verdade com as migrações do Supabase.
# Rodar a partir da pasta do site:  python3 tests/teste_supabase_fase1.py   (precisa do PostgreSQL 16 local ligado)
import asyncio, subprocess, time, os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from supabase_falso import SupabaseFalso, preparar_banco, psql

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8851
URL_SB = 'https://yhzsuokwglznehvbclwd.supabase.co'
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}"
OUT = os.environ.get('SHOTS', '/tmp')

def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m

def banco(sql):
    return psql(sql, 'prt_teste')

async def espera_salvo(pg, t=8000):
    await pg.wait_for_function("() => { const e = PR_DADOS.estadoSync(); return e.pendentes === 0 && e.estado !== 'novo'; }", timeout=t)

async def nova_pagina(br, sb):
    ctx = await br.new_context()
    await ctx.route(URL_SB + "/**", sb.tratar)
    pg = await ctx.new_page(); erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
    return ctx, pg, erros

async def entrar(pg, email, senha):
    await pg.goto(B + '/login.html?servidor=1')
    await pg.fill('#e', email); await pg.fill('#s', senha); await pg.click('#f button.btn-large')

async def main():
    preparar_banco()
    sb = SupabaseFalso(URL_SB)
    leo = sb.criar_conta('leonidasfrancaemedi@gmail.com', 'senhaLeo123', 'Leonidas França', nivel='administrador', status='aprovado', whatsapp='21999990000')
    beto = sb.criar_conta('beto@x.com', 'senhaBeto123', 'Beto Silva', nivel='leitor', status='aprovado', whatsapp='21988887777')
    cida = sb.criar_conta('cida@x.com', 'senhaCida123', 'Cida Souza', whatsapp='21977776666')  # pendente
    async with async_playwright() as p:
        br = await p.chromium.launch()
        ctx, pg, erros = await nova_pagina(br, sb)

        # 1) página pública continua no navegador
        await pg.goto(B + '/index.html?servidor=1')
        ok(await pg.evaluate("PR_DADOS.modo") == 'local', "páginas públicas continuam no modo do navegador")

        # 2) login: senha errada, cadastro pendente, administrador
        await entrar(pg, 'leonidasfrancaemedi@gmail.com', 'errada')
        await pg.wait_for_selector('#er:not([hidden])'); ok('incorretos' in await pg.inner_text('#er'), "senha errada é recusada")
        ok(await pg.locator('#esq').count() == 1, "modo servidor mostra 'Esqueci minha senha'")
        await pg.fill('#e', 'cida@x.com'); await pg.fill('#s', 'senhaCida123'); await pg.click('#f button.btn-large')
        await pg.wait_for_function("document.querySelector('#er').textContent.includes('aprova')", timeout=8000); ok(True, "cadastro pendente não entra")
        await pg.fill('#e', 'leonidasfrancaemedi@gmail.com'); await pg.fill('#s', 'senhaLeo123'); await pg.click('#f button.btn-large')
        await pg.wait_for_url('**/area-restrita.html', timeout=8000)
        ok(await pg.evaluate("PR_DADOS.modo") == 'supabase', "área restrita no modo servidor")
        ok('Leonidas' in await pg.inner_text('.painel-top'), "entrou como Leonidas")
        await espera_salvo(pg)
        ok('Tudo salvo no servidor' in await pg.inner_text('#sync-ind'), "indicador: tudo salvo no servidor")
        ok(not erros, "sem erros de JavaScript ao abrir " + str(erros))

        # 3) gravação vai ao banco de verdade
        await pg.evaluate("PR_DADOS.db.set('livros', [{id:'l1', titulo:'Humanizar a Terra'}])")
        await espera_salvo(pg)
        v = banco("select versao, dados->0->>'titulo' from registros where colecao='livros' and id='_'")
        ok(v and v[0].endswith('|Humanizar a Terra'), "livro gravado no servidor " + str(v))
        aud = banco("select count(*) from auditoria where colecao='livros'")
        ok(int(aud[0]) >= 1, "auditoria no servidor registra a gravação")

        # 3b) dados antigos guardados neste navegador sobem para o servidor (sem apagar nada do servidor)
        await pg.evaluate("""()=>{localStorage.setItem('pr_livros', JSON.stringify([{id:'l1',titulo:'Velho'},{id:'l9',titulo:'O Olhar Interno'}]));
          localStorage.setItem('pr_ativ', JSON.stringify([{id:'a1',titulo:'Encontro',data:'2026-12-20'}])); localStorage.setItem('pr_users', JSON.stringify([{email:'x@x.com',nivel:'administrador'}]));}""")
        await pg.evaluate("document.querySelectorAll('.area-col').forEach(c=>{ if(c.querySelector('[data-tab=backup]') && !c.querySelector('[data-tab=backup]').offsetParent) c.querySelector('.area-titulo').click(); })")
        await pg.click('[data-tab="backup"]')
        ok('servidor do Parque' in await pg.inner_text('#tab') and await pg.locator('#bk-trazer').count() == 1, "Backup mostra 'Trazer os dados deste navegador'")
        await pg.click('#bk-trazer'); await pg.wait_for_selector('#tab .tip-box[role=status]', timeout=10000)
        await espera_salvo(pg)
        ok(banco("select string_agg(x->>'titulo', ',' order by x->>'id') from registros, jsonb_array_elements(dados) x where colecao='livros'") == ['Humanizar a Terra,O Olhar Interno'], "livro que faltava entrou; o do servidor não foi trocado")
        ok(banco("select dados->0->>'titulo' from registros where colecao='ativ'") == ['Encontro'], "atividades do navegador entraram no servidor")
        ok(banco("select count(*) from perfis where email='x@x.com'") == ['0'], "pessoas do navegador não entram (são as contas do login)")

        # 4) Gestão de Responsáveis: aprovar Cida como editora com função; formulário de criar conta some
        await pg.evaluate("document.querySelector('[data-tab=users]').closest('.area-col') && document.querySelector('[data-tab=users]').closest('.area-col').querySelector('.area-titulo') && !document.querySelector('[data-tab=users]').offsetParent && document.querySelector('[data-tab=users]').closest('.area-col').querySelector('.area-titulo').click()")
        await pg.click('[data-tab="users"]')
        ok(await pg.locator('#fu').count() == 0 and 'Criar conta' in await pg.inner_text('#tab-users, .tab-content, #app'), "no servidor, cada pessoa cria a própria conta (sem formulário de senha)")
        await pg.select_option('[data-nvp="cida@x.com"]', 'editor'); await pg.click('[data-ap="cida@x.com"]')
        await espera_salvo(pg)
        ok(banco("select nivel||'/'||status from perfis where email='cida@x.com'") == ['editor/aprovado'], "aprovação gravada no perfil do banco")
        await pg.check('[data-fn="documentos"][data-em="cida@x.com"]'); await espera_salvo(pg)
        ok(banco("select array_to_string(funcoes, ',') from perfis where email='cida@x.com'") == ['documentos'], "função gravada no perfil do banco")

        # 5) outra pessoa (Beto, leitor) vê o livro; não consegue se promover
        ctx2, pg2, erros2 = await nova_pagina(br, sb)
        await entrar(pg2, 'beto@x.com', 'senhaBeto123'); await pg2.wait_for_url('**/area-restrita.html', timeout=8000)
        ok(await pg2.evaluate("PR_DADOS.db.get('livros',[]).length") == 2, "Beto vê os livros gravados pelo Leonidas")
        ok(await pg2.evaluate("PR_DADOS.db.get('users',[]).length") == 1, "leitor só vê o próprio perfil")
        await pg2.evaluate("(()=>{const l=PR_DADOS.db.get('users',[]); l[0].nivel='administrador'; PR_DADOS.db.set('users', l)})()")
        await pg2.wait_for_function("() => PR_DADOS.estadoSync().pendentes === 0", timeout=8000)
        ok(banco("select nivel from perfis where email='beto@x.com'") == ['leitor'], "leitor não consegue se promover (banco recusa)")
        ok(await pg2.evaluate("PR_DADOS.db.get('users',[])[0].nivel") == 'leitor', "a tela volta ao nível real")
        ok(await pg2.evaluate("PR_DADOS.db.get('mapa', null)") is None, "Mapa de Contas não chega a quem não é administrador")

        # 6) conflito: Beto grava primeiro; Leonidas (versão velha) não sobrescreve
        await pg2.evaluate("PR_DADOS.db.set('livros', PR_DADOS.db.get('livros',[]).concat([{id:'l2', titulo:'Cartas a meus amigos'}]))")
        await pg2.wait_for_function("() => PR_DADOS.estadoSync().pendentes === 0", timeout=8000)
        await pg.evaluate("PR_DADOS.db.set('livros', [{id:'l1', titulo:'Humanizar a Terra (2ª ed.)'}])")
        await pg.wait_for_function("() => PR_DADOS.estadoSync().conflitos === 1", timeout=8000)
        ok(banco("select jsonb_array_length(dados) from registros where colecao='livros'") == ['3'], "versão do Beto preservada (nada sobrescrito)")
        await pg.wait_for_selector('#sync-ind [data-cf="livros"]')
        await pg.screenshot(path=OUT + '/fase1-conflito.png')
        await pg.click('#sync-ind [data-esc="servidor"]'); await pg.wait_for_load_state('load'); await pg.wait_for_timeout(500)
        ok(await pg.evaluate("PR_DADOS.db.get('livros',[]).length") == 3, "escolher a versão do servidor recarrega os dados do Beto")

        # 7) cadastro novo pelo site
        ctx3, pg3, erros3 = await nova_pagina(br, sb)
        await pg3.goto(B + '/login.html?servidor=1'); await pg3.click('[data-m="cadastro"]')
        await pg3.fill('#n', 'Dora Lima'); await pg3.fill('#e', 'dora@x.com'); await pg3.fill('#w', '21966665555')
        await pg3.fill('#s', 'senhaDora123'); await pg3.fill('#s2', 'senhaDora123'); await pg3.check('#cc-lgpd-ok'); await pg3.click('#f button.btn-large')
        await pg3.wait_for_selector('.tip-box[role=status]')
        ok('confirmação' in await pg3.inner_text('.tip-box[role=status]'), "cadastro pede para confirmar o e-mail")
        ok(banco("select nome||'/'||whatsapp||'/'||nivel||'/'||status||'/'||(lgpd->>'aceite') from perfis where email='dora@x.com'") == ['Dora Lima/21966665555/leitor/pendente/true'], "perfil nasce pendente com WhatsApp e LGPD")
        ok(any(e[0] == 'confirmacao' and e[2].endswith('/login.html') for e in sb.enviados), "link de confirmação volta para a página Entrar")

        # 8) esqueci minha senha e nova senha pelo link do e-mail
        await pg3.click('#esq'); await pg3.fill('#e', 'beto@x.com'); await pg3.click('#f button.btn-large')
        await pg3.wait_for_selector('.tip-box[role=status]'); ok('link' in await pg3.inner_text('.tip-box[role=status]'), "pedido de nova senha enviado")
        ok(any(e[0] == 'recuperacao' and e[1] == 'beto@x.com' and 'redefinir=1' in e[2] for e in sb.enviados), "link de recuperação volta ao site")
        s = sb.sessao_para(beto)
        await pg3.goto(B + f"/login.html?redefinir=1#access_token={s['access_token']}&refresh_token={s['refresh_token']}&expires_at={s['expires_at']}&type=recovery")
        ok('Criar nova senha' in await pg3.inner_text('#loginBox'), "link do e-mail abre 'Criar nova senha'")
        await pg3.fill('#s', 'novaSenha456'); await pg3.fill('#s2', 'novaSenha456'); await pg3.click('#f button.btn-large')
        await pg3.wait_for_selector('.tip-box[role=status]'); ok('Senha nova salva' in await pg3.inner_text('.tip-box[role=status]'), "senha trocada")
        await pg3.fill('#e', 'beto@x.com'); await pg3.fill('#s', 'novaSenha456'); await pg3.click('#f button.btn-large')
        await pg3.wait_for_url('**/area-restrita.html', timeout=8000); ok(True, "entra com a senha nova")

        # 9) sair encerra a sessão
        await pg.click('#sair'); await pg.wait_for_url('**/login.html', timeout=8000)
        await pg.goto(B + '/area-restrita.html'); await pg.wait_for_url('**/login.html', timeout=8000)
        ok(True, "depois de sair, a área restrita volta para o login")
        await pg.goto(B + '/login.html?servidor=0')
        ok(await pg.evaluate("PR_DADOS.modo") == 'local', "?servidor=0 volta ao modo do navegador")
        ok(not erros2 and not erros3, "sem erros de JavaScript " + str(erros2 + erros3))
        await br.close()

try:
    asyncio.run(main())
finally:
    srv.terminate()
