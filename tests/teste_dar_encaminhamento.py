# Teste: Documentos e Calendários > "Dar encaminhamento" (só o pendente da última Reunião de Escola + aviso ao Grupo de Mestres).
# Rodar a partir da pasta do site:  python3 tests/teste_dar_encaminhamento.py pacote.json
import asyncio, subprocess, time, os, sys, json, re
from playwright.async_api import async_playwright
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8862
PAC = sys.argv[1] if len(sys.argv) > 1 else '/mnt/user-data/outputs/atas-reuniao-escola-2026.json'
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
U = f"http://localhost:{PORT}/"
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
async def main():
    p0 = json.load(open(PAC))
    ult = max((a for a in p0['atas'] if re.match(r'RE-\d{4}\.\d+', a.get('codigo', ''))), key=lambda a: a['data'])['codigo'][:9]
    abertos = [(a, e) for a in p0['atas'] if a.get('codigo', '').startswith(ult) for e in a['enc'] if e.get('status', 'Em aberto') == 'Em aberto']
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 1280, 'height': 900})
        pg = await ctx.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(U + "login.html#criar-conta")
        await pg.fill('#n', 'Leonidas Teste'); await pg.fill('#e', 'a@t.com'); await pg.fill('#s', 'senha12345'); await pg.fill('#s2', 'senha12345'); await pg.fill('#w', '21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        await pg.evaluate("document.querySelector('[data-tab=documentos]').click()"); await pg.wait_for_timeout(600)
        await pg.evaluate("document.querySelector('#tab [data-s=atas]').click()"); await pg.wait_for_timeout(300)
        await pg.set_input_files('#d-imp', PAC); await pg.wait_for_selector('#imp-ok'); await pg.click('#imp-ok'); await pg.wait_for_timeout(300)
        tabs = await pg.locator('#tab .tabs.sub [data-s]').all_inner_texts()
        ok(tabs.index('Dar encaminhamento') == tabs.index('Pendências') + 1, "aba 'Dar encaminhamento' ao lado de Pendências")
        await pg.click('#tab [data-s=dar]'); await pg.wait_for_timeout(300)
        n = await pg.locator('#de-lista [data-de]').count()
        ok(n == len(abertos), f"mostra só os {len(abertos)} pendentes da {ult}")
        cods = set(await pg.locator('#de-lista [data-de] .badge-status').filter(has_text='RE-').all_inner_texts())
        ok(all(c.startswith(ult) for c in cods), f"nenhum item de outra reunião ({sorted(cods)})")
        await pg.screenshot(path='/tmp/dar-encaminhamento.png', full_page=True)
        # a mensagem com o status de cada ponto já aparece pronta no topo
        ok(await pg.locator('#de-txt').count() == 1, "mensagem para os Mestres já aberta no topo da aba")
        t2 = await pg.input_value('#de-txt')
        ok(t2.startswith('*Pendências que ficaram para decidir e fazer encaminhamento em relação à 2ª Reunião de Escola 2026*') and all(f'{k}. ' in t2 for k in range(1, len(abertos) + 1)), f"cada um dos {len(abertos)} pontos, um por um")
        ok('sem responsável' in t2 and 'sem data' in t2 and 'próximos 45 dias' in t2, "sinaliza sem responsável, sem data e prazos próximos")
        ok((await pg.get_attribute('#de-wa', 'href')).startswith('https://wa.me/?text='), "botão Abrir no WhatsApp com o texto")
        print('---\n' + t2[:700] + '\n...')
        await pg.click('[data-dm=resumo]'); await pg.wait_for_timeout(200)
        t = await pg.input_value('#de-txt')
        ok(t.startswith('*Pendências que ficaram') and 'Precisam de alguém' in t and 'area-restrita.html' in t, "versão curta (resumo) disponível")
        await pg.click('[data-dm=status]'); await pg.wait_for_timeout(200)
        # dar encaminhamento a um sem responsável e sem data
        box = pg.locator('#de-lista [data-de]').first
        txt = await box.locator('strong').first.inner_text()
        await box.locator('[data-k=resp]').fill('Leonidas Teste'); await box.locator('[data-k=data]').fill('2026-12-05'); await box.locator('[data-k=passo]').fill('Chamar a comissão no grupo')
        await box.locator('[data-de-ok]').click(); await pg.wait_for_timeout(300)
        d = await pg.evaluate("PR_DADOS.db.get('docs',[]).flatMap(d=>d.enc||[]).find(e=>e.texto===%s)" % json.dumps(txt))
        ok(d['resp'] == 'Leonidas Teste' and d['data'] == '2026-12-05' and d['passo'] and d['atualizado'], "salva quem assume, prazo e próximo passo")
        ok('Chamar a comissão no grupo' in await pg.input_value('#de-txt'), "a mensagem se atualiza com o novo status")
        ok(await pg.evaluate("PR_DADOS.db.get('ativ',[]).some(a=>a.id===%s && a.data==='2026-12-05')" % json.dumps(d['ativ'])), "o prazo novo entra no calendário")
        ok('fa-user-check' in await pg.inner_text('#de-lista') or await pg.locator('#de-lista .fa-user-check').count() > 0, "quem tem cadastro aparece marcado")
        # mensagem em espanhol
        await pg.click('[data-dl=es]'); await pg.wait_for_timeout(200)
        te = await pg.input_value('#de-txt')
        ok(te.startswith('*Pendientes que quedaron por decidir y encaminar en relación con la 2ª Reunión de Escuela 2026*') and 'Reunión de Escuela' in te and 'sin responsable' in te and 'Un fuerte abrazo' in te, "mensagem em espanhol")
        if all(e.get('es') for a, e in abertos): ok('(sem cadastro)' not in te and 'Precisam' not in te and any(e['es'][:30] in te for a, e in abertos), "pontos com o texto em espanhol")
        print('--- ES ---\n' + te[:600] + '\n...')
        await pg.click('[data-dl=pt]'); await pg.wait_for_timeout(200)
        # importar de novo não desfaz o que foi atualizado na plataforma
        await pg.evaluate("document.querySelector('#tab [data-s=atas]').click()"); await pg.wait_for_timeout(300)
        await pg.set_input_files('#d-imp', PAC); await pg.wait_for_selector('#imp-ok'); await pg.click('#imp-ok'); await pg.wait_for_timeout(300)
        d2 = await pg.evaluate("PR_DADOS.db.get('docs',[]).flatMap(d=>d.enc||[]).find(e=>e.texto===%s)" % json.dumps(txt))
        ok(d2['resp'] == 'Leonidas Teste' and d2['data'] == '2026-12-05' and d2['passo'] == 'Chamar a comissão no grupo', "importar de novo mantém o que foi atualizado na plataforma")
        await pg.evaluate("document.querySelector('#tab [data-s=dar]').click()"); await pg.wait_for_timeout(300)
        b2 = pg.locator('#de-lista [data-de]').first; await b2.locator('[data-k=status]').select_option('Feito'); await b2.locator('[data-de-ok]').click(); await pg.wait_for_timeout(300)
        ok(await pg.locator('#de-lista [data-de]').count() == len(abertos) - 1, "marcar Feito tira da lista")
        ok(not errs, "sem erros de JavaScript " + str(errs[:3]))
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
