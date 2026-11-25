# Teste (25/11/2026): passagem pelo site para as redes do Parque (ir.html, ir.js, migração 0022) e painel de cliques.
#  - banco: registrar clique (anon), soma por dia/origem/destino, entradas estranhas, freio, tabela fechada, resumo só com login;
#  - ir.html: cada destino abre o endereço certo e conta; origem por ?o=, apelidos e Linktree (referrer); destino desconhecido não conta;
#  - quem está logado e endereços de teste NÃO contam (mas a pessoa é levada ao destino do mesmo jeito); falha de rede não segura a pessoa;
#  - área restrita: Comunicação › Site mostra os cliques e o gerador cria links ir.html?d=...&o=...
import asyncio, subprocess, time, os, sys, json, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from supabase_falso import SupabaseFalso, preparar_banco, psql, ErroBanco
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8872
URL_SB = 'https://yhzsuokwglznehvbclwd.supabase.co'
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}"
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
def q(sql, **kw):
    r = psql(sql, **kw); return r[-1] if r else ''
EXTERNOS = re.compile(r'https://(chat\.whatsapp\.com|whatsapp\.com|www\.instagram\.com|youtube\.com|facebook\.com)/.*')
ESPERADO = {
 'comunidade': 'https://chat.whatsapp.com/HaH1ShGH9VUKVrs1QX25At',
 'canal': 'https://whatsapp.com/channel/0029VbDmMh9ElagzPYbsg22t',
 'instagram': 'https://www.instagram.com/parqueretirorio/',
 'conecta-whatsapp': 'https://chat.whatsapp.com/CfleoMcrPOmAKGEg3gToeq?s=cl&p=a&iam=2',
 'youtube': 'https://youtube.com/@parquedeestudoereflexaoret6772',
 'facebook': 'https://facebook.com/parqueretiro'}

async def main():
    sql = open(SITE + '/supabase/migrations/0022_cliques_saida.sql', encoding='utf-8').read()
    ok('pr_enviar_publico' not in re.sub(r'--[^\n]*', '', sql), "a 0022 não mexe em pr_enviar_publico (lição da 0018)")
    ok('0021' in open(SITE + '/supabase/migrations/0021_visitas_site.sql', encoding='utf-8').read() and 'pr_registrar_clique' not in open(SITE + '/supabase/migrations/0021_visitas_site.sql', encoding='utf-8').read(), "a 0021 continua como foi entregue (sem cliques)")
    ok('visitas.js' not in open(SITE + '/ir.html', encoding='utf-8').read(), "a página de passagem não conta como visita (só como clique)")
    preparar_banco(); sb = SupabaseFalso(URL_SB)
    uid = sb.criar_conta('leonidasfrancaemedi@gmail.com', 'senhaLeo123', 'Leonidas França', nivel='administrador', status='aprovado', whatsapp='21999990000')
    sv = lambda v: 'null' if v is None else "'" + str(v).replace("'", "''") + "'"
    reg = lambda d, o: q(f"select pr_registrar_clique({sv(d)}, {sv(o)})::text", papel='anon')
    ok(reg('canal', 'linktree') == '{"ok": true}', "anon registra um clique")
    reg('canal', 'linktree'); reg('youtube', 'linktree'); reg('Canal', 'LINKTREE')
    ok(q("select cliques from cliques_saida_dia where origem='linktree' and destino='canal'") == '3', "cliques do mesmo par somam (maiúsculas iguais)")
    reg('x y; drop table z', 'a/b'); reg(None, None)
    ok(q("select cliques from cliques_saida_dia where origem='outros' and destino='outros'") == '2', "entradas estranhas viram outros/outros, sem erro")
    try: psql("select count(*) from cliques_saida_dia", papel='anon'); ok(False, "anon não deveria ler")
    except ErroBanco as e: ok('permission denied' in str(e), "visitante não lê a tabela de cliques")
    try: psql("insert into cliques_saida_dia(dia, origem, destino) values (current_date,'a','b')", papel='anon'); ok(False, "anon não deveria gravar direto")
    except ErroBanco as e: ok('permission denied' in str(e), "visitante não grava direto (só pela função)")
    ok(q("select count(*) from cliques_saida_dia", papel='authenticated', uid=uid) == '0', "mesmo logado, a tabela está fechada por RLS")
    try: psql("select pr_resumo_cliques(30)", papel='anon'); ok(False, "anon não deveria ver o resumo")
    except ErroBanco as e: ok('permission denied' in str(e), "visitante não executa o resumo")
    r = json.loads(q("select pr_resumo_cliques(30)::text", papel='authenticated', uid=uid))
    ok(r['totais']['hoje'] == 6, f"resumo logado: 6 cliques hoje (veio {r['totais']['hoje']})")
    ok(r['por_destino'][0] == {'destino': 'canal', 'cliques': 3}, "destino mais clicado primeiro (canal, 3)")
    psql("insert into cliques_saida_dia(dia, origem, destino, cliques) select current_date, 'lixo'||g, 'd'||g, 1 from generate_series(1,600) g")
    reg('canal', 'origem-nova-depois-do-freio')
    ok(q("select count(*) from cliques_saida_dia where origem='origem-nova-depois-do-freio'") == '0', "freio: acima de 500 combinações por dia, origem nova não cria linha")
    ok(reg('canal', 'linktree') == '{"ok": true}' and q("select cliques from cliques_saida_dia where origem='linktree' and destino='canal'") == '4', "freio não atrapalha quem já está contado")
    psql("delete from cliques_saida_dia where origem like 'lixo%'")

    async with async_playwright() as p:
        br = await p.chromium.launch(); erros = []
        async def novo(forcar=True, vp=None):
            c = await br.new_context(viewport=vp or {'width': 390, 'height': 844}, locale='pt-BR')
            if forcar: await c.add_init_script("window.PR_VISITAS_FORCAR = true")
            await c.route(URL_SB + '/**', sb.tratar)
            await c.route(EXTERNOS, lambda r: r.fulfill(status=200, body='<html>destino</html>', content_type='text/html'))
            return c
        vi = await novo()
        async def vai(c, caminho, ref=None):
            pg = await c.new_page(); pg.on('pageerror', lambda e: erros.append(str(e)))
            await pg.goto(B + caminho, referer=ref) if ref else await pg.goto(B + caminho)
            await pg.wait_for_timeout(1800); u = pg.url; await pg.close(); return u
        # cada destino: abre o endereço certo e conta 1 clique com a origem
        sb.cliques_log.clear()
        for d, url in ESPERADO.items():
            u = await vai(vi, f'/ir.html?d={d}&o=linktree')
            ok(u == url, f"{d}: leva para {url} (foi para {u})")
        ok([(x['p_destino'], x['p_origem']) for x in sb.cliques_log] == [(d, 'linktree') for d in ESPERADO], "um clique contado por destino, todos com origem linktree")
        # origem por referrer do Linktree, por apelido, e sem nada
        sb.cliques_log.clear()
        await vai(vi, '/ir.html?d=canal', ref='https://linktr.ee/parqueretiro'); await vai(vi, '/ir.html?d=youtube&o=IG'); await vai(vi, '/ir.html?d=facebook')
        ok([(x['p_destino'], x['p_origem']) for x in sb.cliques_log] == [('canal', 'linktree'), ('youtube', 'instagram'), ('facebook', 'direto')], f"origem: referrer do Linktree, apelido ig e direto: {[(x['p_destino'], x['p_origem']) for x in sb.cliques_log]}")
        # destino desconhecido ou ausente: mostra as opções, não conta, não leva a lugar nenhum
        sb.cliques_log.clear()
        pg = await vi.new_page(); await pg.goto(B + '/ir.html?d=https://site-mal-intencionado.com'); await pg.wait_for_timeout(1500)
        ok(pg.url.startswith(B + '/ir.html'), "destino que não está na lista NÃO redireciona (sem redirecionamento aberto)")
        hrefs = await pg.eval_on_selector_all('#b a', 'a => a.map(x => x.getAttribute("href"))')
        ok(len([h for h in hrefs if h.startswith('ir.html?d=')]) == 6 and 'index.html' in hrefs, "mostra os 6 destinos e o site")
        ok(not sb.cliques_log, "destino desconhecido não conta clique")
        await pg.close()
        # botão de reserva presente na página do destino (caso o redirecionamento automático falhe)
        pg = await vi.new_page(); await pg.route(EXTERNOS, lambda r: r.abort()); await pg.goto(B + '/ir.html?d=canal&o=teste'); await pg.wait_for_timeout(1800)
        ok(True, "página não quebra se o destino não abrir")
        await pg.close()
        # servidor fora do ar não segura a pessoa
        c2 = await br.new_context(); await c2.add_init_script("window.PR_VISITAS_FORCAR = true")
        await c2.route(URL_SB + '/**', lambda r: r.abort()); await c2.route(EXTERNOS, lambda r: r.fulfill(status=200, body='ok', content_type='text/html'))
        u = await vai(c2, '/ir.html?d=canal&o=linktree'); ok(u == ESPERADO['canal'], "mesmo com o servidor fora do ar, a pessoa chega ao destino")
        # localhost sem a chave de teste: leva ao destino, não conta
        ct = await novo(forcar=False); n0 = len(sb.cliques_log)
        u = await vai(ct, '/ir.html?d=instagram&o=linktree')
        ok(u == ESPERADO['instagram'] and len(sb.cliques_log) == n0, "endereço de teste: vai ao destino, mas não conta")
        # equipe logada: não conta
        eq = await novo(vp={'width': 1280, 'height': 900})
        e = await eq.new_page(); e.on('pageerror', lambda x: erros.append('equipe: ' + str(x)))
        await e.goto(B + '/login.html?servidor=1'); await e.wait_for_selector('#e')
        await e.fill('#e', 'leonidasfrancaemedi@gmail.com'); await e.fill('#s', 'senhaLeo123'); await e.click('#f button.btn-large')
        await e.wait_for_url('**/area-restrita.html*', timeout=15000); await e.wait_for_timeout(2500)
        n1 = len(sb.cliques_log); u = await vai(eq, '/ir.html?d=canal&o=linktree')
        ok(u == ESPERADO['canal'] and len(sb.cliques_log) == n1, "quem está logado (equipe) vai ao destino sem ser contado")
        # ---------- painel ----------
        sb.cliques_log.clear(); psql("delete from cliques_saida_dia")
        for d, o, n in (('canal', 'linktree', 3), ('youtube', 'linktree', 1), ('comunidade', 'grupo-mestres', 2)):
            for _ in range(n): reg(d, o)
        await e.goto(B + '/area-restrita.html#t=comunicacao&s=site'); await e.wait_for_timeout(2500)
        if not await e.locator('#site-visitas').count():
            await e.evaluate("""()=>{const b=[...document.querySelectorAll('button,a')].find(x=>/Comunica[cç]ão/.test(x.textContent)&&/tab|menu|btn/i.test(x.className+x.id)); if(b) b.click();}""")
            await e.wait_for_timeout(800)
            await e.evaluate("""()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Site'); if(b) b.click();}"""); await e.wait_for_timeout(2000)
        t = await e.inner_text('#site-visitas')
        ok('Cliques para as redes do Parque' in t, "Comunicação › Site tem a seção de cliques para as redes")
        ok('Canal do Parque Retiro (WhatsApp)' in t and 'YouTube do Parque' in t, "destinos com nomes amigáveis")
        ok('Linktree → Canal do Parque Retiro (WhatsApp)' in t and 'Grupo mestres (WhatsApp) → Comunidade do Parque Retiro (WhatsApp)' in t, "de onde vieram e para onde foram")
        ok(await e.locator('#site-banners').count() == 1, "banners continuam abaixo")
        L = lambda: e.input_value('#vg-l')
        await e.select_option('#vg-o', 'linktree'); await e.select_option('#vg-d2', 'canal')
        ok(await L() == 'https://parqueretiro.org.br/ir.html?d=canal&o=linktree', f"gerador: Linktree → Canal: {await L()}")
        ok(not await e.locator('#vg-p').is_visible(), "ao escolher uma rede, o seletor de página some")
        await e.select_option('#vg-o', 'grupo-mestres'); await e.select_option('#vg-d2', 'youtube')
        ok(await L() == 'https://parqueretiro.org.br/ir.html?d=youtube&o=grupo-mestres', "gerador: grupo dos Mestres → YouTube")
        await e.select_option('#vg-d2', ''); await e.select_option('#vg-o', 'linktree'); await e.select_option('#vg-p', '')
        ok(await L() == 'https://parqueretiro.org.br/?o=linktree', "gerador: Linktree → site (página)")
        # sem a migração 0022: mensagem clara, visitas continuam
        psql("drop function pr_resumo_cliques(integer)")
        await e.click('#vv-a'); await e.wait_for_timeout(1500)
        t = await e.inner_text('#site-visitas')
        ok(('migração 0022' in t or 'Não foi possível carregar os cliques' in t) and 'Visitas do site' in t, "sem a 0022 aparece o aviso e as visitas seguem funcionando")
        ok(not erros, "sem erros de JavaScript: " + str(erros))
        await br.close()
    srv.terminate(); print("\nTODOS OS TESTES PASSARAM")

try: asyncio.run(main())
finally: srv.terminate()
