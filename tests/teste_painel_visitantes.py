# Teste (25/11/2026): Painel de visitantes (migração 0024, visitas.js dispositivo, com-painel.js).
#  - períodos e comparação (função pura); relatório por período no banco; dispositivos sem identificar ninguém;
#  - navegador: o aparelho é contado uma vez por visita; área restrita: abas, períodos, comparação, %, redes sociais, relatório, CSV.
import asyncio, subprocess, time, os, sys, json, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from supabase_falso import SupabaseFalso, preparar_banco, psql, ErroBanco
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8874
URL_SB = 'https://yhzsuokwglznehvbclwd.supabase.co'
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}"
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
def q(sql, **kw):
    r = psql(sql, **kw); return r[-1] if r else ''
def lit(v): return "'" + str(v).replace("'", "''") + "'"
HJ = "(now() at time zone 'America/Sao_Paulo')::date"

async def main():
    sql = open(SITE + '/supabase/migrations/0024_painel_relatorio_dispositivos.sql', encoding='utf-8').read()
    ok('pr_enviar_publico' not in re.sub(r'--[^\n]*', '', sql), "a 0024 não mexe em pr_enviar_publico (lição da 0018)")
    preparar_banco(); sb = SupabaseFalso(URL_SB)
    uid = sb.criar_conta('leonidasfrancaemedi@gmail.com', 'senhaLeo123', 'Leonidas França', nivel='administrador', status='aprovado', whatsapp='21999990000')
    # ---------- dispositivos no banco ----------
    reg = lambda t, s, n: q(f"select pr_registrar_dispositivo({lit(t)}, {lit(s)}, {lit(n)})::text", papel='anon')
    ok(reg('mobile', 'android', 'chrome') == '{"ok": true}', "anon registra um dispositivo")
    reg('Mobile', 'ANDROID', 'Chrome'); reg('desktop', 'windows', 'edge'); reg('x y; drop', '../etc', '<script>'); reg(None, None, None)
    ok(q("select visitas from visitas_dispositivo_dia where tipo='mobile' and so='android' and navegador='chrome'") == '2', "maiúsculas contam como a mesma categoria")
    ok(q("select visitas from visitas_dispositivo_dia where tipo='outro' and so='outro' and navegador='outro'") == '2', "valores fora da lista viram 'outro', sem erro")
    for t in ('visitas_dispositivo_dia',):
        try: psql(f"select count(*) from {t}", papel='anon'); ok(False, "anon não deveria ler")
        except ErroBanco as e: ok('permission denied' in str(e), "visitante não lê a tabela de dispositivos")
        ok(q(f"select count(*) from {t}", papel='authenticated', uid=uid) == '0', "mesmo logado, a tabela é fechada por RLS")
    try: psql("select pr_relatorio_visitas(null, null)", papel='anon'); ok(False, "anon não deveria ver o relatório")
    except ErroBanco as e: ok('permission denied' in str(e), "visitante não executa o relatório")
    # ---------- relatório por período ----------
    psql("delete from visitas_site_dia; delete from visitas_dispositivo_dia")
    sem = lambda n, o, pg, v, p: psql(f"insert into visitas_site_dia(dia, origem, pagina, visitas, paginas_vistas) values ({HJ} - {n}, {lit(o)}, {lit(pg)}, {v}, {p})")
    sem(0, 'instagram', 'index', 4, 6); sem(1, 'linktree', 'index', 3, 3); sem(2, 'canal', 'index', 2, 5); sem(5, 'instagram', 'atividades', 5, 5)
    sem(10, 'linktree', 'index', 8, 12); sem(40, 'instagram', 'index', 100, 100)
    psql(f"insert into cliques_saida_dia(dia, origem, destino, cliques) values ({HJ}, 'linktree', 'canal', 3), ({HJ} - 1, 'linktree', 'instagram', 2), ({HJ} - 40, 'linktree', 'canal', 50)")
    psql(f"insert into visitas_dispositivo_dia(dia, tipo, so, navegador, visitas) values ({HJ}, 'mobile', 'android', 'chrome', 6), ({HJ}, 'desktop', 'windows', 'edge', 2)")
    rel = lambda i, f: json.loads(q(f"select pr_relatorio_visitas({HJ} - {i}, {HJ} - {f})::text", papel='authenticated', uid=uid))
    r7 = rel(6, 0)
    ok((r7['totais']['visitas'], r7['totais']['paginas_vistas']) == (14, 19), f"últimos 7 dias: 14 visitas e 19 páginas (veio {r7['totais']['visitas']}, {r7['totais']['paginas_vistas']})")
    ok(r7['por_origem'][0]['origem'] == 'instagram' and r7['por_origem'][0]['visitas'] == 9, "origem mais visitada primeiro (instagram, 9)")
    ok(len(r7['por_dia']) == 7 and r7['por_dia'][-1]['visitas'] == 4, "7 dias na série; o último é hoje")
    ok(sum(x['cliques'] for x in r7['saidas']) == 5, "cliques para as redes do período (5)")
    ok(r7['dispositivos']['tipo'][0] == {'nome': 'mobile', 'visitas': 6}, "dispositivos do período (celular primeiro)")
    r40 = rel(45, 20)
    ok(r40['totais']['visitas'] == 100 and sum(x['cliques'] for x in r40['saidas']) == 50, "outro período, outros números (comparação por período)")
    ok(rel(0, 0)['totais']['visitas'] == 4, "um dia só (hoje)")
    for ruim, msg in (("pr_relatorio_visitas(current_date, current_date - 5)", 'inicial'), (f"pr_relatorio_visitas({HJ} - 500, {HJ})", '400 dias')):
        try: q(f"select {ruim}", papel='authenticated', uid=uid); ok(False, "período inválido deveria ser recusado")
        except ErroBanco as e: ok(msg in str(e), f"recusa período inválido: {str(e)[:50]}")
    ok(json.loads(q("select pr_relatorio_visitas(null, null)::text", papel='authenticated', uid=uid))['por_dia'].__len__() == 30, "sem datas: últimos 30 dias")
    psql("alter table cliques_saida_dia rename to cliques_saida_dia_x")
    ok(rel(6, 0)['saidas'] == [] and rel(6, 0)['totais']['visitas'] == 14, "sem a tabela da 0022 o relatório continua funcionando (só sem cliques)")
    psql("alter table cliques_saida_dia_x rename to cliques_saida_dia")

    async with async_playwright() as p:
        br = await p.chromium.launch(); erros = []
        vi = await br.new_context(viewport={'width': 390, 'height': 844}, locale='pt-BR'); await vi.add_init_script("window.PR_VISITAS_FORCAR = true")
        await vi.route(URL_SB + '/**', sb.tratar)
        pg = await vi.new_page(); pg.on('pageerror', lambda e: erros.append(str(e))); await pg.goto(B + '/index.html'); await pg.wait_for_timeout(1200)
        # ---------- funções puras ----------
        iv = lambda per, c=None: pg.evaluate("([p,c]) => PR_COM_PAINEL.intervalos(p, '2026-11-25', c)", [per, c]) if False else None
        await pg.add_script_tag(path=SITE + '/com-painel.js')
        iv = lambda per, c=None: pg.evaluate("([p,c]) => PR_COM_PAINEL.intervalos(p, '2026-11-25', c)", [per, c])
        ok(await iv('hoje') == {'ini': '2026-11-25', 'fim': '2026-11-25', 'ci': '2026-11-24', 'cf': '2026-11-24'}, "Hoje (compara com ontem)")
        ok((await iv('ontem'))['ini'] == '2026-11-24' and (await iv('ontem'))['ci'] == '2026-11-23', "Ontem")
        ok(await iv('7') == {'ini': '2026-11-19', 'fim': '2026-11-25', 'ci': '2026-11-12', 'cf': '2026-11-18'}, "Últimos 7 dias (compara com os 7 anteriores)")
        ok((await iv('30'))['ini'] == '2026-10-27' and (await iv('90'))['ini'] == '2026-08-28', "30 e 90 dias")
        ok(await iv('mes') == {'ini': '2026-11-01', 'fim': '2026-11-25', 'ci': '2026-10-01', 'cf': '2026-10-25'}, "Este mês (compara com o mesmo trecho do mês anterior)")
        ok(await iv('mes-anterior') == {'ini': '2026-10-01', 'fim': '2026-10-31', 'ci': '2026-09-01', 'cf': '2026-09-30'}, "Mês anterior (outubro, compara com setembro)")
        ok((await iv('custom', {'ini': '2026-11-10', 'fim': '2026-11-14'})) == {'ini': '2026-11-10', 'fim': '2026-11-14', 'ci': '2026-11-05', 'cf': '2026-11-09'}, "Personalizado")
        va = lambda a, b: pg.evaluate("([a,b]) => PR_COM_PAINEL.variacao(a,b)", [a, b])
        ok(await va(15, 10) == 50 and await va(5, 10) == -50 and await va(3, 0) is None, "variação em % (e sem base quando o anterior é zero)")
        # ---------- reconhecimento de aparelhos ----------
        dv = lambda ua, t=False: pg.evaluate("([u,t]) => PR_VISITAS.dispositivo(u,t)", [ua, t])
        casos = [
         ('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', False, ('mobile', 'ios', 'safari')),
         ('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36', False, ('mobile', 'android', 'chrome')),
         ('Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', False, ('tablet', 'android', 'chrome')),
         ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15', True, ('tablet', 'ios', 'safari')),
         ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15', False, ('desktop', 'macos', 'safari')),
         ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0', False, ('desktop', 'windows', 'edge')),
         ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', False, ('desktop', 'windows', 'chrome')),
         ('Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0', False, ('desktop', 'linux', 'firefox')),
         ('Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36', False, ('mobile', 'android', 'samsung')),
         ('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0', False, ('desktop', 'windows', 'opera')),
         ('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0 Mobile/15E148 Safari/604.1', False, ('mobile', 'ios', 'chrome')),
         ('', False, ('desktop', 'outro', 'outro'))]
        for ua, t, esp in casos:
            r = await dv(ua, t); ok((r['tipo'], r['so'], r['navegador']) == esp, f"aparelho {esp}")
        ok(set((await dv(casos[0][0])).keys()) == {'tipo', 'so', 'navegador'}, "só 3 categorias gerais saem do navegador (sem modelo nem resolução)")
        # ---------- visita real: aparelho contado uma vez por visita ----------
        sb.dispositivos_log.clear()
        pgv = await vi.new_page(); await pgv.goto(B + '/atividades.html?o=canal'); await pgv.wait_for_timeout(900); await pgv.goto(B + '/reservas.html'); await pgv.wait_for_timeout(900); await pgv.goto(B + '/o-parque.html'); await pgv.wait_for_timeout(1200)
        ok(len(sb.dispositivos_log) == 1 and set(sb.dispositivos_log[0]) == {'p_tipo', 'p_so', 'p_navegador'}, f"3 páginas na mesma sessão: o aparelho é contado 1 vez ({sb.dispositivos_log})")
        # ---------- área restrita ----------
        eq = await br.new_context(viewport={'width': 1280, 'height': 1000}, locale='pt-BR', accept_downloads=True); await eq.add_init_script("window.PR_VISITAS_FORCAR = true"); await eq.route(URL_SB + '/**', sb.tratar)
        e = await eq.new_page(); e.on('pageerror', lambda x: erros.append('equipe: ' + str(x)))
        await e.goto(B + '/login.html?servidor=1'); await e.wait_for_selector('#e')
        await e.fill('#e', 'leonidasfrancaemedi@gmail.com'); await e.fill('#s', 'senhaLeo123'); await e.click('#f button.btn-large')
        await e.wait_for_url('**/area-restrita.html*', timeout=15000); await e.wait_for_timeout(2500)
        # (a visita à tela de login conta como visita; limpa e semeia de novo)
        psql("delete from visitas_site_dia; delete from visitas_dispositivo_dia; delete from cliques_saida_dia")
        sem(0, 'instagram', 'index', 4, 6); sem(0, 'linktree', 'index', 3, 3); sem(1, 'canal', 'index', 2, 5); sem(1, 'instagram', 'atividades', 5, 5); sem(2, 'email', 'index', 2, 2); sem(2, 'wifi', 'index', 1, 1)
        sem(9, 'instagram', 'index', 5, 5); sem(35, 'instagram', 'index', 1, 1)
        psql(f"insert into cliques_saida_dia(dia, origem, destino, cliques) values ({HJ}, 'linktree', 'canal', 3), ({HJ}, 'linktree', 'instagram', 2), ({HJ}, 'canal', 'instagram', 4)")
        psql(f"insert into visitas_dispositivo_dia(dia, tipo, so, navegador, visitas) values ({HJ}, 'mobile', 'android', 'chrome', 6), ({HJ}, 'desktop', 'windows', 'edge', 2), ({HJ}, 'tablet', 'ios', 'safari', 2)")
        await e.goto(B + '/area-restrita.html#t=comunicacao&s=site'); await e.wait_for_timeout(2500)
        if not await e.locator('#vp-per').count():
            await e.evaluate("""()=>{const b=[...document.querySelectorAll('button,a')].find(x=>/Comunica[cç]ão/.test(x.textContent)&&/tab|menu|btn/i.test(x.className+x.id)); if(b) b.click();}""")
            await e.wait_for_timeout(800)
            await e.evaluate("""()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Site'); if(b) b.click();}"""); await e.wait_for_timeout(2000)
        ok(await e.locator('#vp-per').count() == 1, "Comunicação › Site tem o Painel de visitantes")
        ok(await e.locator('#site-banners').count() == 1 and await e.locator('#vl-f').count() == 1 and await e.locator('#vv-a').count() == 1, "visitas simples, gerador de links e banners continuam na tela")
        abas = await e.eval_on_selector_all('[data-aba]', 'x => x.map(a => a.textContent)')
        ok(abas == ['Visão geral', 'Origem dos acessos', 'Redes sociais', 'Linktree', 'E-mail e Wi-Fi', 'Páginas mais acessadas', 'Dispositivos', 'Relatórios'], f"menu do painel: {abas}")
        pr = lambda: e.inner_text('#site-painel')
        await e.select_option('#vp-per', '7'); await e.wait_for_timeout(1200)
        t = await pr()
        ok('Visitas (sessões)' in t and '17' in t and 'Páginas vistas' in t and '22' in t, "Visão geral (7 dias): 17 visitas e 22 páginas vistas")
        ok('Páginas por visita' in t and 'Média de visitas por dia' in t, "indicadores derivados")
        await e.check('#vp-cmp'); await e.wait_for_timeout(1500); t = await pr()
        ok('▲' in t and 'vs. período anterior' in t and 'comparando com' in t, "comparação com o período anterior mostra a variação")
        await e.uncheck('#vp-cmp'); await e.wait_for_timeout(1200)
        await e.click('[data-aba="origem"]'); t = await pr()
        ok('Instagram' in t and '(52,9%)' in t.replace(' ', ' ').replace('\xa0', ' ') or '52,9%' in t, "Origem dos acessos com percentual")
        await e.click('[data-or="linktree"]'); await e.wait_for_timeout(300); t = await e.inner_text('#vp-det')
        ok('Linktree' in t and 'Canal do Parque Retiro (WhatsApp)' in t and '3' in t, "clicar na origem mostra os detalhes (cliques para as redes)")
        await e.click('[data-aba="redes"]'); t = await pr()
        ok('Linktree × link direto' in t and 'Cliques do Linktree para a rede' in t and 'Canal do Parque Retiro (WhatsApp)' in t, "Redes sociais: Linktree × link direto")
        linhas = await e.eval_on_selector_all('#vp-corpo tbody tr', 'r => r.map(x => [...x.cells].map(c => c.textContent.trim()))')
        inst = next(l for l in linhas if l[0] == 'Instagram'); canal = next(l for l in linhas if l[0].startswith('Canal'))
        ok(inst[1:] == ['9', '2', '4'] and canal[1:] == ['2', '3', '0'], f"números por rede (Instagram {inst[1:]}, Canal {canal[1:]})")
        await e.click('[data-aba="linktree"]'); t = await pr()
        ok('Visitas ao site vindas do Linktree' in t and 'Cliques por botão do Linktree' in t and 'Canal do Parque Retiro (WhatsApp)' in t, "aba Linktree: cliques por botão")
        await e.click('[data-aba="emailwifi"]'); t = await pr()
        ok('Campanhas de e-mail' in t and 'Acessos via Wi-Fi' in t and '2' in t, "aba E-mail e Wi-Fi")
        await e.click('[data-aba="paginas"]'); t = await pr()
        ok('Páginas mais acessadas' in t and 'Início' in t and 'Atividades' in t, "Páginas mais acessadas com percentual")
        await e.click('[data-aba="dispositivos"]'); t = await pr()
        ok('Celular / smartphone' in t and 'Android' in t and 'Chrome' in t and '60%' in t.replace('\xa0', ' '), "Dispositivos em %: celular 60%")
        await e.click('[data-aba="relatorio"]'); t = await pr()
        ok('Qual rede social trouxe mais visitantes?' in t and 'Instagram (9)' in t, "Relatório responde: a rede com mais visitantes")
        ok('Ainda não disponível' in t and 'celular' in t.lower() and 'Linktree:' in t, "Relatório é honesto sobre o que ainda não existe (localização)")
        async with e.expect_download() as d: await e.click('#vp-csv')
        dl = await d.value; txt = open(await dl.path(), 'rb').read().decode('utf-8')
        ok(txt.startswith('﻿"Seção";"Item"') and 'Origem' in txt and 'Clique para rede' in txt and 'Dispositivo (tipo)' in txt, "exporta CSV do período")
        await e.select_option('#vp-per', 'custom'); await e.wait_for_selector('#vp-ini'); await e.wait_for_timeout(800)
        await e.fill('#vp-ini', '2026-01-01'); await e.fill('#vp-fim', '2026-01-31'); await e.wait_for_timeout(1300)
        ok('Sem dados' in await pr() or '0' in await pr(), "período personalizado (janeiro): sem dados, sem erro")
        await e.select_option('#vp-per', 'mes-anterior'); await e.wait_for_timeout(1000); ok(await e.locator('#vp-corpo').count() == 1, "Mês anterior carrega")
        psql("drop function pr_relatorio_visitas(date, date)")
        await e.click('#vp-at'); await e.wait_for_timeout(1200); t = await pr()
        ok(('migração 0024' in t or 'Não foi possível' in t) and 'Painel de visitantes' in t, "sem a 0024: aviso claro, tela inteira")
        ok(not erros, "sem erros de JavaScript: " + str(erros))
        await br.close()
    srv.terminate(); print("\nTODOS OS TESTES PASSARAM")

try: asyncio.run(main())
finally: srv.terminate()
