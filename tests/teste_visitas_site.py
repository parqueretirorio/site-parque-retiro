# Teste (25/11/2026): contador de visitas do site por origem (migração 0021, visitas.js, com-visitas.js).
#  - banco: registrar visita (anon), contagem por dia/origem/página, entradas estranhas, freio, tabela fechada, resumo só com login;
#  - visitas.js: origem por ?o=, utm_source, apelidos, referrer (Instagram, YouTube, Facebook, Google), sessão, páginas excluídas;
#  - quem está logado (equipe) e endereços de teste NÃO são contados; página sem config-dados.js também conta;
#  - área restrita: Comunicação › Site mostra as visitas e gera os links com origem; os banners continuam lá.
import asyncio, subprocess, time, os, sys, json, glob, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from supabase_falso import SupabaseFalso, preparar_banco, psql, ErroBanco
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8871
URL_SB = 'https://yhzsuokwglznehvbclwd.supabase.co'
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}"
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
def q(sql, **kw):
    r = psql(sql, **kw); return r[-1] if r else ''
def linhas(sql):
    return [tuple(l.split('|')) for l in psql(sql)]

async def main():
    # ---------- arquivos: o contador está em todas as páginas públicas ----------
    fora = {'area-restrita.html', 'ajuda-area-restrita.html', 'descadastro.html', 'cadastro-wifi.html', 'ir.html'}
    sem = [os.path.basename(f) for f in sorted(glob.glob(SITE + '/*.html')) if os.path.basename(f) not in fora and 'src="visitas.js"' not in open(f, encoding='utf-8').read()]
    ok(not sem, f"todas as páginas públicas carregam visitas.js (faltam: {sem})")
    com = [f for f in fora if f in os.listdir(SITE) and 'src="visitas.js"' in open(os.path.join(SITE, f), encoding='utf-8').read()]
    ok(not com, f"a área restrita e telas pessoais NÃO carregam visitas.js ({com})")
    ok('../visitas.js' in open(SITE + '/app/index.html', encoding='utf-8').read(), "o aplicativo (app/) também carrega o contador")
    ok('com-visitas.js' in open(SITE + '/area-restrita.html', encoding='utf-8').read(), "a área restrita carrega com-visitas.js")
    sql = open(SITE + '/supabase/migrations/0021_visitas_site.sql', encoding='utf-8').read()
    ok('pr_enviar_publico' not in re.sub(r'--[^\n]*', '', sql), "a 0021 não mexe em pr_enviar_publico (lição da 0018)")

    # ---------- banco ----------
    preparar_banco(); sb = SupabaseFalso(URL_SB)
    uid = sb.criar_conta('leonidasfrancaemedi@gmail.com', 'senhaLeo123', 'Leonidas França', nivel='administrador', status='aprovado', whatsapp='21999990000')
    sv = lambda v: 'null' if v is None else "'" + str(v).replace("'", "''") + "'"
    reg = lambda p, o, n='true': q(f"select pr_registrar_visita({sv(p)}, {sv(o)}, {n})::text", papel='anon')
    ok(reg('index', 'canal') == '{"ok": true}', "anon registra uma visita")
    reg('index', 'canal'); reg('atividades', 'canal', 'false'); reg('index', 'instagram')
    t = {(a, b_): (int(v), int(pv)) for a, b_, v, pv in linhas("select origem, pagina, visitas, paginas_vistas from visitas_site_dia")}
    ok(t[('canal', 'index')] == (2, 2), "duas visitas à mesma origem e página somam (2 visitas, 2 páginas vistas)")
    ok(t[('canal', 'atividades')] == (0, 1), "página seguinte da mesma sessão conta só como página vista (0 visitas, 1 página)")
    ok(t[('instagram', 'index')] == (1, 1), "origens separadas")
    reg('Index', 'CANAL')
    ok(int(q("select visitas from visitas_site_dia where origem='canal' and pagina='index'")) == 3, "maiúsculas e minúsculas contam como a mesma origem")
    reg('../etc/passwd', 'x y; drop table z'); reg(None, None)
    ok(q("select count(*) from visitas_site_dia where origem='outros' and pagina='outras'") == '1', "entradas estranhas (página e origem fora do padrão) viram outros/outras, sem erro")
    ok(q("select count(*) from pg_tables where tablename='visitas_site_dia'") == '1', "a tabela continua existindo depois das entradas estranhas")
    try: psql("select count(*) from visitas_site_dia", papel='anon'); ok(False, "anon não deveria ler a tabela")
    except ErroBanco as e: ok('permission denied' in str(e), "visitante não lê a tabela de visitas")
    try: psql("insert into visitas_site_dia(dia, origem, pagina) values ((now() at time zone 'America/Sao_Paulo')::date, 'a', 'b')", papel='anon'); ok(False, "anon não deveria gravar direto")
    except ErroBanco as e: ok('permission denied' in str(e), "visitante não grava direto na tabela (só pela função)")
    ok(q("select count(*) from visitas_site_dia", papel='authenticated', uid=uid) == '0', "mesmo logado, a tabela está fechada por RLS (só a função do painel lê)")
    try: psql("select pr_resumo_visitas(30)", papel='anon'); ok(False, "anon não deveria ver o resumo")
    except ErroBanco as e: ok('permission denied' in str(e), "visitante não executa o resumo")
    r = json.loads(q("select pr_resumo_visitas(30)::text", papel='authenticated', uid=uid))
    ok(r['totais']['hoje'] == 6 and r['totais']['paginas_hoje'] == 7, f"resumo logado: 6 visitas e 7 páginas vistas hoje (veio {r['totais']['hoje']} e {r['totais']['paginas_hoje']})")
    ok(r['por_origem'][0]['origem'] == 'canal' and r['por_origem'][0]['visitas'] == 3, "origem mais visitada vem primeiro (canal, 3)")
    ok(len(r['por_dia']) == 30 and r['por_dia'][-1]['visitas'] == r['totais']['hoje'], "30 dias na série, o último é hoje")
    ok(any(p['pagina'] == 'index' for p in r['paginas']), "páginas mais vistas listadas")
    # freio: depois de 1.500 combinações no dia, novas origens caem em 'outros'
    psql("insert into visitas_site_dia(dia, origem, pagina, visitas, paginas_vistas) select (now() at time zone 'America/Sao_Paulo')::date, 'lixo'||g, 'p', 1, 1 from generate_series(1,1500) g")
    reg('index', 'origem-nova-depois-do-freio')
    ok(q("select count(*) from visitas_site_dia where origem='origem-nova-depois-do-freio'") == '0', "freio: acima de 1.500 combinações por dia, origem nova não cria linha")
    ok(reg('index', 'canal') == '{"ok": true}' and int(q("select visitas from visitas_site_dia where origem='canal' and pagina='index'")) == 4, "freio não atrapalha quem já está contado")
    psql("delete from visitas_site_dia where origem like 'lixo%'")

    # ---------- visitas.js no navegador ----------
    async with async_playwright() as p:
        br = await p.chromium.launch(); erros = []
        vi = await br.new_context(viewport={'width': 390, 'height': 844}, locale='pt-BR'); await vi.add_init_script("window.PR_VISITAS_FORCAR = true")
        await vi.route(URL_SB + '/**', sb.tratar)
        pg = await vi.new_page(); pg.on('pageerror', lambda e: erros.append(str(e)))
        await pg.goto(B + '/index.html'); await pg.wait_for_timeout(300)
        f = lambda s, a=None: pg.evaluate(s, a) if a is not None else pg.evaluate(s)
        d = lambda ctx: pg.evaluate("c => PR_VISITAS.decide(c)", ctx)
        H = 'parqueretiro.org.br'
        ok(await d({'busca': '?o=canal', 'host': H}) == {'origem': 'canal', 'nova': True}, "?o=canal → origem canal")
        ok((await d({'busca': '?utm_source=Instagram', 'host': H}))['origem'] == 'instagram', "utm_source também vale (e ignora maiúsculas)")
        ok((await d({'busca': '?o=IG', 'host': H}))['origem'] == 'instagram' and (await d({'busca': '?o=yt', 'host': H}))['origem'] == 'youtube' and (await d({'busca': '?o=fb', 'host': H}))['origem'] == 'facebook', "apelidos ig/yt/fb")
        ok((await d({'busca': '?o=Grupo Mestres!!', 'host': H}))['origem'] == 'grupo-mestres', "nome com espaço e sinais vira grupo-mestres")
        ok((await d({'busca': '?o=Comunicação', 'host': H}))['origem'] == 'comunicacao', "acentos são removidos")
        ok((await d({'busca': '', 'host': H, 'referrer': 'https://l.instagram.com/?u=x'}))['origem'] == 'instagram', "referrer do Instagram")
        ok((await d({'busca': '', 'host': H, 'referrer': 'https://m.youtube.com/watch?v=1'}))['origem'] == 'youtube', "referrer do YouTube")
        ok((await d({'busca': '', 'host': H, 'referrer': 'https://l.facebook.com/l.php'}))['origem'] == 'facebook', "referrer do Facebook")
        ok((await d({'busca': '', 'host': H, 'referrer': 'https://www.google.com.br/'}))['origem'] == 'google', "referrer do Google")
        ok((await d({'busca': '', 'host': H, 'referrer': 'https://web.whatsapp.com/'}))['origem'] == 'whatsapp', "referrer do WhatsApp Web")
        ok((await d({'busca': '', 'host': H, 'referrer': 'https://blog.exemplo.com/post'}))['origem'] == 'outros-sites', "outro site qualquer")
        ok((await d({'busca': '', 'host': H, 'referrer': ''}))['origem'] == 'direto', "sem referrer = direto")
        ok((await d({'busca': '', 'host': H, 'referrer': 'https://parqueretiro.org.br/index.html'}))['origem'] == 'direto', "vindo do próprio site não é origem")
        ok(await d({'busca': '', 'host': H, 'sessao': {'o': 'canal'}}) == {'origem': 'canal', 'nova': False}, "na mesma sessão a origem é lembrada (não é nova visita)")
        ok(await d({'busca': '?o=canal', 'host': H, 'sessao': {'o': 'canal'}}) == {'origem': 'canal', 'nova': False}, "recarregar o mesmo link na sessão não conta outra visita")
        ok(await d({'busca': '?o=youtube', 'host': H, 'sessao': {'o': 'canal'}}) == {'origem': 'youtube', 'nova': True}, "outra marca na mesma aba = nova visita")
        pa = lambda c: pg.evaluate("c => PR_VISITAS.paginaAtual(c)", c)
        ok(await pa('/') == 'index' and await pa('/index.html') == 'index' and await pa('/atividades.html') == 'atividades' and await pa('/app/') == 'app' and await pa('/app/index.html') == 'app', "nome da página: raiz = index, app = app")
        ok(await pa('/Rifa-Solidaria.html?o=x#y') == 'rifa-solidaria', "nome da página ignora ?, # e maiúsculas")

        # visita de verdade: mesma aba, três páginas
        sb.visitas_log.clear()
        await pg.goto(B + '/atividades.html?o=canal'); await pg.wait_for_timeout(700)
        await pg.goto(B + '/reservas.html'); await pg.wait_for_timeout(700)
        await pg.goto(B + '/o-parque.html'); await pg.wait_for_timeout(1200)   # esta página NÃO carrega config-dados.js
        ok([(x['p_pagina'], x['p_origem'], x['p_nova_visita']) for x in sb.visitas_log] == [('atividades', 'canal', True), ('reservas', 'canal', False), ('o-parque', 'canal', False)],
           f"uma visita + 3 páginas vistas, todas com origem canal (inclusive a página sem config-dados.js): {[(x['p_pagina'], x['p_nova_visita']) for x in sb.visitas_log]}")
        # nova aba/sessão com origem diferente
        pg2 = await vi.new_page(); await pg2.goto(B + '/index.html?o=grupo-mestres'); await pg2.wait_for_timeout(700)
        ok((sb.visitas_log[-1]['p_pagina'], sb.visitas_log[-1]['p_origem'], sb.visitas_log[-1]['p_nova_visita']) == ('index', 'grupo-mestres', True), "outra aba com ?o=grupo-mestres vira outra visita")
        await pg2.goto(B + '/area-restrita.html?o=canal'); await pg2.wait_for_timeout(1200)
        await pg2.goto(B + '/ajuda-area-restrita.html'); await pg2.wait_for_timeout(600)
        ok(all(x['p_pagina'] not in ('area-restrita', 'ajuda-area-restrita') for x in sb.visitas_log), "área restrita não é contada")
        # sem o endereço oficial (localhost sem a chave de teste) não conta
        ct = await br.new_context(); await ct.route(URL_SB + '/**', sb.tratar); n0 = len(sb.visitas_log)
        pt = await ct.new_page(); await pt.goto(B + '/index.html?o=instagram'); await pt.wait_for_timeout(900)
        ok(len(sb.visitas_log) == n0, "localhost / cópias de teste / github.io não são contados")
        # equipe logada não conta
        eq = await br.new_context(viewport={'width': 1280, 'height': 900}, locale='pt-BR'); await eq.add_init_script("window.PR_VISITAS_FORCAR = true"); await eq.route(URL_SB + '/**', sb.tratar)
        e = await eq.new_page(); e.on('pageerror', lambda x: erros.append('equipe: ' + str(x)))
        await e.goto(B + '/login.html?servidor=1'); await e.wait_for_selector('#e')
        await e.fill('#e', 'leonidasfrancaemedi@gmail.com'); await e.fill('#s', 'senhaLeo123'); await e.click('#f button.btn-large')
        await e.wait_for_url('**/area-restrita.html*', timeout=15000); await e.wait_for_timeout(2500)
        n1 = len(sb.visitas_log)
        await e.goto(B + '/index.html?o=canal'); await e.wait_for_timeout(900)
        ok(len(sb.visitas_log) == n1, "quem está logado na área restrita (equipe) não é contado")
        # ---------- área restrita: Comunicação › Site ----------
        await e.goto(B + '/area-restrita.html#t=comunicacao&s=site'); await e.wait_for_timeout(2500)
        if not await e.locator('#site-visitas').count():
            await e.evaluate("""()=>{const b=[...document.querySelectorAll('button,a')].find(x=>/Comunica[cç]ão/.test(x.textContent)&&/tab|menu|btn/i.test(x.className+x.id)); if(b) b.click();}""")
            await e.wait_for_timeout(800)
            await e.evaluate("""()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Site'); if(b) b.click();}"""); await e.wait_for_timeout(2000)
        ok(await e.locator('#site-visitas').count() == 1, "Comunicação › Site tem a seção de visitas")
        t = await e.inner_text('#site-visitas')
        ok('Visitas do site' in t and 'Hoje' in t and 'Últimos 7 dias' in t, "cartões de visitas aparecem")
        ok('Canal do Parque Retiro no WhatsApp' in t and 'Grupo mestres (WhatsApp)' in t, "origens com nomes amigáveis (Canal, grupo dos Mestres)")
        ok('Instagram' in t and 'Início' in t, "Instagram e página Início aparecem nos quadros")
        ok(await e.locator('#site-banners').count() == 1 and len((await e.inner_text('#site-banners')).strip()) > 50, "os banners continuam na mesma tela, abaixo das visitas")
        # gerador de links
        L = lambda: e.input_value('#vg-l')
        await e.select_option('#vg-o', 'canal'); await e.select_option('#vg-p', '')
        ok(await L() == 'https://parqueretiro.org.br/?o=canal', f"link do Canal: {await L()}")
        await e.select_option('#vg-o', 'instagram'); await e.select_option('#vg-p', 'newsletter.html')
        ok(await L() == 'https://parqueretiro.org.br/newsletter.html?o=instagram', "link do Instagram para o Comunicado")
        await e.select_option('#vg-o', 'grupo-'); await e.wait_for_timeout(100)
        ok(await e.locator('#vg-nome-box').is_visible() and await L() == '', "grupo novo pede o nome e não gera link vazio")
        await e.fill('#vg-nome', 'Comunicação & Redes!'); ok(await L() == 'https://parqueretiro.org.br/newsletter.html?o=grupo-comunicacao-redes', f"grupo novo: {await L()}")
        await e.select_option('#vg-o', 'comunidade'); await e.select_option('#vg-p', 'app/')
        ok(await L() == 'https://parqueretiro.org.br/app/?o=comunidade', "link do aplicativo")
        ok(not (await L()).endswith('.'), "o link não termina com ponto")
        mm = await e.evaluate("[PR_COM_VISITAS.montaLink('area-restrita.html#t=documentos&s=dar','canal'), PR_COM_VISITAS.montaLink('a.html?x=1','canal')]")
        ok(mm == ['https://parqueretiro.org.br/area-restrita.html?o=canal#t=documentos&s=dar', 'https://parqueretiro.org.br/a.html?x=1&o=canal'], "a marca vai antes do # e usa & quando já há ?")
        # serviço sem a migração (404) → mensagem clara
        psql("drop function pr_resumo_visitas(integer)")
        await e.click('#vv-a'); await e.wait_for_timeout(1200)
        ok('migração 0021' in await e.inner_text('#site-visitas') or 'Não foi possível carregar' in await e.inner_text('#site-visitas'), "falha do servidor mostra mensagem clara (sem quebrar a tela)")
        ok(not erros, "sem erros de JavaScript: " + str(erros))
        await br.close()
    srv.terminate(); print("\nTODOS OS TESTES PASSARAM")

try: asyncio.run(main())
finally: srv.terminate()
