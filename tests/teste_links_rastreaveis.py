# Teste (25/11/2026): links rastreáveis com código (migração 0023, visitas.js, ir.js, com-visitas.js, qr.js).
#  - banco: criar/listar/editar só logado; contagem por código (visita, página, clique); link desativado ou código falso não conta;
#  - navegador: ?l= + UTMs contam a origem e o link; mesma sessão = páginas vistas; ir.html conta clique no link;
#  - área restrita: formulário cria o link, lista com números, copia, QR Code que decodifica de volta no mesmo link, ativa/desativa, edita e exporta CSV.
import asyncio, subprocess, time, os, sys, json, re, base64
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cv2, numpy as np
from playwright.async_api import async_playwright
from supabase_falso import SupabaseFalso, preparar_banco, psql, ErroBanco
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8873
URL_SB = 'https://yhzsuokwglznehvbclwd.supabase.co'
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}"
EXTERNOS = re.compile(r'https://(chat\.whatsapp\.com|whatsapp\.com|www\.instagram\.com|youtube\.com|facebook\.com)/.*')
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
def q(sql, **kw):
    r = psql(sql, **kw); return r[-1] if r else ''
def lit(v): return "'" + str(v).replace("'", "''") + "'"

async def main():
    sql = open(SITE + '/supabase/migrations/0023_links_rastreaveis.sql', encoding='utf-8').read()
    ok('pr_enviar_publico' not in re.sub(r'--[^\n]*', '', sql), "a 0023 não mexe em pr_enviar_publico (lição da 0018)")
    preparar_banco(); sb = SupabaseFalso(URL_SB)
    uid = sb.criar_conta('leonidasfrancaemedi@gmail.com', 'senhaLeo123', 'Leonidas França', nivel='administrador', status='aprovado', whatsapp='21999990000')
    criar = lambda d: json.loads(q(f"select pr_criar_link({lit(json.dumps(d))}::jsonb)::text", papel='authenticated', uid=uid))
    l1 = criar({'nome': 'Instagram — convite 29/11', 'categoria': 'instagram', 'utm_source': 'Instagram', 'utm_medium': 'social', 'utm_campaign': 'entre-principios', 'destino': 'atividades.html'})
    ok(re.fullmatch(r'[a-z0-9]{6}', l1['codigo']) and l1['utm_source'] == 'instagram' and l1['ativo'] is True, f"cria link com código de 6 caracteres e origem em minúsculas ({l1['codigo']})")
    l2 = criar({'nome': 'Linktree — Canal', 'categoria': 'linktree', 'utm_source': 'linktree', 'utm_medium': 'social', 'utm_campaign': 'canal', 'destino': 'ir:canal'})
    ok(l1['codigo'] != l2['codigo'], "códigos diferentes por link")
    for ruim, esperado in (({'nome': '', 'utm_source': 'x'}, 'nome'), ({'nome': 'a', 'utm_source': 'Ins ta!'}, 'utm_source'), ({'nome': 'a', 'utm_source': ''}, 'utm_source')):
        try: criar(ruim); ok(False, "entrada inválida deveria ser recusada")
        except ErroBanco as e: ok(esperado in str(e).lower() or 'origem' in str(e).lower() or 'nome' in str(e).lower(), f"recusa entrada inválida: {str(e)[:60]}")
    for fn in ("select pr_criar_link('{\"nome\":\"x\",\"utm_source\":\"y\"}'::jsonb)", "select pr_listar_links(30)", "select pr_atualizar_link('abcdef','n','o',true)"):
        try: psql(fn, papel='anon'); ok(False, "anon não deveria executar")
        except ErroBanco as e: ok('permission denied' in str(e), f"visitante não executa {fn.split('(')[0][7:]}")
    for t in ('links_rastreaveis', 'links_acessos_dia'):
        try: psql(f"select count(*) from {t}", papel='anon'); ok(False, "anon não deveria ler")
        except ErroBanco as e: ok('permission denied' in str(e), f"visitante não lê {t}")
        ok(q(f"select count(*) from {t}", papel='authenticated', uid=uid) == '0', f"mesmo logado, {t} está fechada por RLS (só pelas funções)")
    reg = lambda c, t='visita': q(f"select pr_registrar_acesso_link({lit(c)}, {lit(t)})::text", papel='anon')
    c1 = l1['codigo']
    ok(reg(c1) == '{"ok": true}', "anon registra visita do link")
    reg(c1, 'pagina'); reg(c1, 'pagina'); reg(c1.upper(), 'visita'); reg(c1, 'clique')
    r = {x['codigo']: x for x in json.loads(q("select pr_listar_links(30)::text", papel='authenticated', uid=uid))['links']}
    ok((r[c1]['visitas'], r[c1]['paginas_vistas'], r[c1]['cliques']) == (2, 4, 1), f"números do link: 2 visitas, 4 páginas, 1 clique (veio {(r[c1]['visitas'], r[c1]['paginas_vistas'], r[c1]['cliques'])})")
    ok(reg('zzzzzz') == '{"ok": false}' and reg('../x') == '{"ok": false}' and reg(None) == '{"ok": false}', "código inexistente ou estranho não conta e não dá erro")
    a = json.loads(q(f"select pr_atualizar_link({lit(c1)}, 'Instagram — convite (novo nome)', 'obs interna', false)::text", papel='authenticated', uid=uid))
    ok(a['ativo'] is False and a['nome'].endswith('(novo nome)'), "edita a identificação e desativa")
    ok(reg(c1) == '{"ok": false}', "link desativado não conta")
    json.loads(q(f"select pr_atualizar_link({lit(c1)}, null, null, true)::text", papel='authenticated', uid=uid))
    ok(reg(c1) == '{"ok": true}', "reativado volta a contar")
    try: q("select pr_atualizar_link('nada12','x','y',true)", papel='authenticated', uid=uid); ok(False, "link inexistente")
    except ErroBanco as e: ok('não encontrado' in str(e), "editar link inexistente dá mensagem clara")
    psql("delete from links_acessos_dia")

    async with async_playwright() as p:
        br = await p.chromium.launch(); erros = []
        vi = await br.new_context(viewport={'width': 390, 'height': 844}, locale='pt-BR'); await vi.add_init_script("window.PR_VISITAS_FORCAR = true")
        await vi.route(URL_SB + '/**', sb.tratar); await vi.route(EXTERNOS, lambda r: r.fulfill(status=200, body='<html>destino</html>', content_type='text/html'))
        async def vai(c, caminho, espera=1500):
            pg = await c.new_page(); pg.on('pageerror', lambda e: erros.append(str(e))); await pg.goto(B + caminho); await pg.wait_for_timeout(espera); return pg
        sb.visitas_log.clear(); sb.acessos_link_log.clear()
        pg = await vai(vi, f'/atividades.html?utm_source=Instagram&utm_medium=social&utm_campaign=entre-principios&l={c1}')
        await pg.goto(B + '/reservas.html'); await pg.wait_for_timeout(800)
        pg2 = await vi.new_page(); await pg2.goto(B + f'/o-parque.html?l={c1}'); await pg2.wait_for_timeout(1200)
        ok((sb.visitas_log[0]['p_origem'], sb.visitas_log[0]['p_nova_visita']) == ('instagram', True), "utm_source vira a origem da visita")
        ok([x['p_tipo'] for x in sb.acessos_link_log] == ['visita', 'visita'], f"?l= conta visita do link em cada aba nova: {[x['p_tipo'] for x in sb.acessos_link_log]}")
        pg3 = await vi.new_page(); await pg3.goto(B + f'/atividades.html?l={c1}'); await pg3.wait_for_timeout(700); await pg3.goto(B + f'/reservas.html?l={c1}'); await pg3.wait_for_timeout(1000)
        ok([x['p_tipo'] for x in sb.acessos_link_log][-2:] == ['visita', 'pagina'], "mesma sessão e mesmo link: a segunda página é só página vista")
        n = len(sb.acessos_link_log); pg4 = await vai(vi, '/atividades.html?l=../../x'); await pg4.goto(B + '/atividades.html?l=ab'); await pg4.wait_for_timeout(800)
        ok(len(sb.acessos_link_log) == n, "código com formato inválido é ignorado pelo navegador")
        # ir.html com ?l=
        sb.cliques_log.clear(); sb.acessos_link_log.clear()
        pg5 = await vi.new_page(); await pg5.goto(B + f'/ir.html?d=canal&utm_source=linktree&utm_medium=social&l={l2["codigo"]}'); await pg5.wait_for_timeout(2000)
        ok(pg5.url == 'https://whatsapp.com/channel/0029VbDmMh9ElagzPYbsg22t', "ir.html leva ao destino")
        ok([(x['p_destino'], x['p_origem']) for x in sb.cliques_log] == [('canal', 'linktree')] and [x['p_tipo'] for x in sb.acessos_link_log] == ['clique'], "ir.html conta o clique da rede e o clique do link")
        ok(int(q(f"select cliques from links_acessos_dia where codigo={lit(l2['codigo'])}")) == 1, "o clique ficou gravado no link no banco")
        # link desativado: o site abre normalmente, mas não conta
        q(f"select pr_atualizar_link({lit(l2['codigo'])}, null, null, false)", papel='authenticated', uid=uid)
        pg6 = await vi.new_page(); await pg6.goto(B + f'/ir.html?d=canal&o=linktree&l={l2["codigo"]}'); await pg6.wait_for_timeout(1800)
        ok(pg6.url.startswith('https://whatsapp.com/channel/') and int(q(f"select cliques from links_acessos_dia where codigo={lit(l2['codigo'])}")) == 1, "link desativado: a pessoa chega ao destino, mas o clique do link não conta")
        q(f"select pr_atualizar_link({lit(l2['codigo'])}, null, null, true)", papel='authenticated', uid=uid)

        # ---------- área restrita ----------
        eq = await br.new_context(viewport={'width': 1280, 'height': 1000}, locale='pt-BR', accept_downloads=True); await eq.add_init_script("window.PR_VISITAS_FORCAR = true"); await eq.route(URL_SB + '/**', sb.tratar)
        e = await eq.new_page(); e.on('pageerror', lambda x: erros.append('equipe: ' + str(x)))
        await e.goto(B + '/login.html?servidor=1'); await e.wait_for_selector('#e')
        await e.fill('#e', 'leonidasfrancaemedi@gmail.com'); await e.fill('#s', 'senhaLeo123'); await e.click('#f button.btn-large')
        await e.wait_for_url('**/area-restrita.html*', timeout=15000); await e.wait_for_timeout(2500)
        await e.goto(B + '/area-restrita.html#t=comunicacao&s=site'); await e.wait_for_timeout(2500)
        if not await e.locator('#vl-f').count():
            await e.evaluate("""()=>{const b=[...document.querySelectorAll('button,a')].find(x=>/Comunica[cç]ão|CONecta Retiro/.test(x.textContent)&&/tab|menu|btn/i.test(x.className+x.id)); if(b) b.click();}""")
            await e.wait_for_timeout(800)
            await e.evaluate("""()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Site'); if(b) b.click();}"""); await e.wait_for_timeout(2000)
        ok(await e.locator('#vl-f').count() == 1, "Comunicação › Site tem o Gerador de links rastreáveis")
        ok(await e.locator('#site-visitas').count() == 1 and await e.locator('#site-banners').count() == 1, "visitas e banners continuam na tela")
        t = await e.inner_text('#site-links')
        ok('Instagram — convite (novo nome)' in t and 'Linktree — Canal' in t, "histórico lista os links já criados")
        cats = await e.eval_on_selector_all('#vl-cat option', 'o => o.map(x => x.textContent)')
        ok(cats == ['Instagram', 'Facebook', 'YouTube', 'WhatsApp', 'Linktree', 'E-mail', 'Wi-Fi', 'Eventos', 'Comunicados', 'Campanhas institucionais', 'Outros'], "as 11 categorias pedidas")
        await e.select_option('#vl-cat', 'wifi')
        ok(await e.input_value('#vl-src') == 'wifi' and await e.input_value('#vl-med') == 'wifi', "escolher a categoria preenche origem e meio")
        await e.fill('#vl-nome', 'Wi-Fi — cadastro do visitante'); await e.fill('#vl-camp', 'Boas Vindas 2026!'); await e.fill('#vl-cont', 'Botão Topo'); await e.select_option('#vl-dest', 'newsletter.html')
        await e.click('#vl-criar'); await e.wait_for_timeout(1500)
        novo = json.loads(q("select to_jsonb(l)::text from links_rastreaveis l where nome like 'Wi-Fi%'"))
        ok(novo['utm_source'] == 'wifi' and novo['utm_campaign'] == 'boas-vindas-2026' and novo['utm_content'] == 'botao-topo' and novo['destino'] == 'newsletter.html', f"o link criado na tela fica certo no banco: {novo['utm_campaign']}, {novo['utm_content']}")
        cartao = e.locator(f'[data-cod="{novo["codigo"]}"]')
        link = await cartao.locator('input[readonly]').input_value()
        esperado = f"https://parqueretiro.org.br/newsletter.html?utm_source=wifi&utm_medium=wifi&utm_campaign=boas-vindas-2026&utm_content=botao-topo&l={novo['codigo']}"
        ok(link == esperado, f"link completo com UTMs e código: {link}")
        ok(not link.endswith('.'), "o link não termina com ponto")
        # QR
        await cartao.locator('[data-a="qr"]').click(); await e.wait_for_timeout(400)
        ok(await e.locator('#vl-qr svg').count() == 1, "QR Code aparece na tela")
        png = await e.locator('#vl-qr svg').screenshot()
        img = cv2.imdecode(np.frombuffer(png, np.uint8), cv2.IMREAD_GRAYSCALE); img = cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_NEAREST)
        lido, _, _ = cv2.QRCodeDetector().detectAndDecode(img)
        ok(lido == esperado, f"o QR Code lido por outro leitor abre exatamente o link ({lido[:60]})")
        async with e.expect_download() as d: await e.locator('#vl-qr [data-a="svg"]').click()
        dl = await d.value; ok(dl.suggested_filename == f"qr-{novo['codigo']}.svg", "baixar SVG")
        async with e.expect_download() as d: await e.locator('#vl-qr [data-a="png"]').click()
        dl = await d.value; ok(dl.suggested_filename == f"qr-{novo['codigo']}.png", "baixar PNG")
        await e.locator('#vl-qr [data-a="fechar-qr"]').click()
        # editar e desativar
        await cartao.locator('[data-a="editar"]').click(); await e.fill('#ve-nome', 'Wi-Fi — boas-vindas (editado)'); await e.fill('#ve-obs', 'cartaz da portaria'); await cartao.locator('[data-a="salvar"]').click(); await e.wait_for_timeout(1200)
        ok(q(f"select nome || '|' || observacoes from links_rastreaveis where codigo={lit(novo['codigo'])}") == 'Wi-Fi — boas-vindas (editado)|cartaz da portaria', "edita a identificação interna")
        await e.locator(f'[data-cod="{novo["codigo"]}"] [data-a="ativar"]').click(); await e.wait_for_timeout(1200)
        ok(q(f"select ativo::text from links_rastreaveis where codigo={lit(novo['codigo'])}") == 'false', "desativa pela tela")
        ok('Desativado' in await e.inner_text(f'[data-cod="{novo["codigo"]}"]'), "a tela mostra o link como desativado")
        # números e período
        q(f"select pr_atualizar_link({lit(novo['codigo'])}, null, null, true)", papel='authenticated', uid=uid)
        reg(novo['codigo']); reg(novo['codigo'], 'pagina'); await e.select_option('#vl-d', '7'); await e.wait_for_timeout(1000)
        ok('1 visita(s)' in (await e.inner_text(f'[data-cod="{novo["codigo"]}"]')).replace('\xa0', ' ') or '1</strong> visita' in await e.inner_html(f'[data-cod="{novo["codigo"]}"]'), "mostra as visitas do link no período")
        # CSV
        async with e.expect_download() as d: await e.click('#vl-csv')
        dl = await d.value; txt = open(await dl.path(), 'rb').read().decode('utf-8')
        ok(dl.suggested_filename == 'links-rastreaveis.csv' and txt.startswith('﻿"Nome";"Categoria";"Código"'), "exporta CSV com acentos (abre certo no Excel)")
        ok(esperado in txt and 'Linktree — Canal' in txt and txt.count('\r\n') >= 3, "o CSV traz os links e as campanhas")
        # sem a migração 0023
        psql("drop function pr_listar_links(integer)")
        await e.select_option('#vl-d', '30'); await e.wait_for_timeout(1200)
        t = await e.inner_text('#site-links')
        ok(('migração 0023' in t or 'Não foi possível' in t) and 'Gerador de links rastreáveis' in t, "sem a 0023: aviso claro e a tela continua inteira")
        ok(not erros, "sem erros de JavaScript: " + str(erros))
        await br.close()
    srv.terminate(); print("\nTODOS OS TESTES PASSARAM")

try: asyncio.run(main())
finally: srv.terminate()
