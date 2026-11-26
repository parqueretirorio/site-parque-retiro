# Teste (26/11/2026): exportação dos números do contador (migração 0025) pela tela Backup e Segurança.
#  - função no banco: só logado, devolve todas as tabelas de contagem; sem a 0022 continua funcionando;
#  - navegador: botão baixa um CSV (; com BOM) com as 5 tabelas, protege contra fórmulas, mostra a data do último download;
#  - sem a 0025: aviso claro.
import asyncio, subprocess, time, os, sys, json, re, csv, io
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from supabase_falso import SupabaseFalso, preparar_banco, psql, ErroBanco
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8875
URL_SB = 'https://yhzsuokwglznehvbclwd.supabase.co'
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}"
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
def q(sql, **kw):
    r = psql(sql, **kw); return r[-1] if r else ''
HJ = "(now() at time zone 'America/Sao_Paulo')::date"

async def main():
    sql = open(SITE + '/supabase/migrations/0025_exportar_numeros_visitas.sql', encoding='utf-8').read()
    ok('pr_enviar_publico' not in re.sub(r'--[^\n]*', '', sql), "a 0025 não mexe em pr_enviar_publico (lição da 0018)")
    ok(not re.search(r'\b(insert|update|delete|drop|alter|truncate)\b', re.sub(r'--[^\n]*', '', sql), re.I), "a 0025 só lê: nenhum insert/update/delete/drop/alter")
    preparar_banco(); sb = SupabaseFalso(URL_SB)
    uid = sb.criar_conta('leonidasfrancaemedi@gmail.com', 'senhaLeo123', 'Leonidas França', nivel='administrador', status='aprovado', whatsapp='21999990000')
    try: psql("select pr_exportar_numeros_visitas()", papel='anon'); ok(False, "visitante não deveria exportar")
    except ErroBanco as e: ok('permission denied' in str(e), "visitante (sem login) não executa a exportação")
    vazio = json.loads(q("select pr_exportar_numeros_visitas()::text", papel='authenticated', uid=uid))
    ok(all(vazio[k] == [] for k in ('visitas', 'dispositivos', 'cliques', 'links', 'acessos_links')), "sem dados: cinco listas vazias, sem erro")
    psql(f"insert into visitas_site_dia(dia, origem, pagina, visitas, paginas_vistas) values ({HJ}, 'linktree', 'index', 4, 6), ({HJ} - 1, 'instagram', 'atividades', 2, 3)")
    psql(f"insert into visitas_dispositivo_dia(dia, tipo, so, navegador, visitas) values ({HJ}, 'mobile', 'android', 'chrome', 6)")
    psql(f"insert into cliques_saida_dia(dia, origem, destino, cliques) values ({HJ}, 'linktree', 'canal', 3)")
    psql("insert into links_rastreaveis(codigo, nome, categoria, utm_source, observacoes) values ('abc123', '=SOMA(1;1) Festival; \"20/12\"', 'festival', 'instagram', 'linha1')")
    psql(f"insert into links_acessos_dia(dia, codigo, visitas, paginas_vistas, cliques) values ({HJ}, 'abc123', 5, 7, 1)")
    cheio = json.loads(q("select pr_exportar_numeros_visitas()::text", papel='authenticated', uid=uid))
    ok((len(cheio['visitas']), len(cheio['dispositivos']), len(cheio['cliques']), len(cheio['links']), len(cheio['acessos_links'])) == (2, 1, 1, 1, 1), "devolve todas as linhas das 5 tabelas, sem filtro de período")
    ok('criado_por' not in cheio['links'][0], "não leva o identificador de quem criou o link")
    psql("alter table cliques_saida_dia rename to cliques_saida_dia_x")
    sem22 = json.loads(q("select pr_exportar_numeros_visitas()::text", papel='authenticated', uid=uid))
    ok(sem22['cliques'] == [] and len(sem22['visitas']) == 2, "sem a tabela da 0022 a exportação continua (só sem cliques)")
    psql("alter table cliques_saida_dia_x rename to cliques_saida_dia")

    erros = []
    async with async_playwright() as p:
        br = await p.chromium.launch()
        eq = await br.new_context(viewport={'width': 1280, 'height': 1000}, locale='pt-BR', accept_downloads=True)
        await eq.route(URL_SB + '/**', sb.tratar)
        e = await eq.new_page(); e.on('pageerror', lambda x: erros.append(str(x))); e.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
        await e.goto(B + '/login.html?servidor=1'); await e.wait_for_selector('#e')
        await e.fill('#e', 'leonidasfrancaemedi@gmail.com'); await e.fill('#s', 'senhaLeo123'); await e.click('#f button.btn-large')
        await e.wait_for_url('**/area-restrita.html*', timeout=15000); await e.wait_for_timeout(2500)
        await e.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo').click()}", 'backup')
        await e.click('[data-tab="backup"]'); await e.wait_for_selector('#bk-numeros', timeout=15000)
        txt = await e.inner_text('#bk-num-ultimo'); ok('Ainda não baixado' in txt, "antes do primeiro download: 'Ainda não baixado neste navegador.'")
        ok('não inclui' in await e.inner_text('body'), "a tela explica que o backup completo não inclui esses números")
        async with e.expect_download() as dl: await e.click('#bk-numeros')
        d = await dl.value; ok(re.fullmatch(r'numeros-site-parque-retiro-\d{4}-\d{2}-\d{2}\.csv', d.suggested_filename) is not None, f"nome do arquivo: {d.suggested_filename}")
        raw = open(await d.path(), 'rb').read(); ok(raw.startswith(b'\xef\xbb\xbf'), "CSV com BOM (abre com acentos no Excel)")
        linhas = list(csv.reader(io.StringIO(raw.decode('utf-8-sig')), delimiter=';'))
        cab = linhas[0]; ok(cab[:3] == ['tabela', 'dia', 'origem'] and 'cliques' in cab and 'utm_source' in cab, "cabeçalho com as colunas esperadas")
        por = {}
        for l in linhas[1:]: por.setdefault(l[0], []).append(dict(zip(cab, l)))
        ok({k: len(v) for k, v in por.items()} == {'visitas_por_origem_e_pagina': 2, 'dispositivos': 1, 'cliques_para_as_redes': 1, 'links_cadastrados': 1, 'acessos_por_link': 1}, "uma linha por registro das 5 tabelas")
        ok(any(r['origem'] == 'linktree' and r['visitas'] == '4' and r['paginas_vistas'] == '6' for r in por['visitas_por_origem_e_pagina']), "visitas por origem e página corretas")
        ok(por['dispositivos'][0]['tipo'] == 'mobile' and por['dispositivos'][0]['visitas'] == '6', "dispositivos corretos")
        ok(por['cliques_para_as_redes'][0]['destino'] == 'canal' and por['cliques_para_as_redes'][0]['cliques'] == '3', "cliques para as redes corretos")
        lk = por['links_cadastrados'][0]; ok(lk['codigo'] == 'abc123' and lk['utm_source'] == 'instagram' and lk['ativo'] == 'true', "link cadastrado correto")
        ok(lk['nome'].startswith("'=SOMA") and '"20/12"' in lk['nome'] and ';' in lk['nome'], "texto que começa com '=' é neutralizado e aspas/; ficam preservados (sem fórmula no Excel)")
        ok(por['acessos_por_link'][0]['codigo'] == 'abc123' and por['acessos_por_link'][0]['visitas'] == '5', "acessos por link corretos")
        ok('Números baixados' in await e.inner_text('body') and 'Último download neste navegador' in await e.inner_text('#bk-num-ultimo'), "mostra a confirmação e a data do último download")
        psql("drop function pr_exportar_numeros_visitas()")
        await e.click('#bk-numeros'); await e.wait_for_timeout(1500); t = await e.inner_text('body')
        ok('migração 0025' in t, "sem a 0025: aviso claro de que falta aplicar a migração")
        ok(not erros, "sem erros de JavaScript: " + str(erros))
        await br.close()
    srv.terminate(); print("\nTODOS OS TESTES PASSARAM")

try: asyncio.run(main())
finally: srv.terminate()
