# Teste: Documentos e Calendários > Atas > "Importar ata preparada" (pacote .json com atas, encaminhamentos, vídeos e datas).
# Rodar a partir da pasta do site:  python3 tests/teste_importar_ata.py [pacote.json]
import asyncio, subprocess, time, os, sys, json
from playwright.async_api import async_playwright
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8861
PAC = sys.argv[1] if len(sys.argv) > 1 else '/tmp/pacote_teste.json'
if not os.path.exists(PAC):
    json.dump({'tipo': 'pr-atas', 'versao': 1, 'atas': [{'id': 'ata-x', 'titulo': 'Reunião X', 'data': '2026-11-01', 'videos': [{'titulo': 'Vídeo do dia', 'url': 'https://youtu.be/abc'}],
               'codigo': 'RE-2026.2', 'enc': [{'id': 'e1', 'texto': 'Fazer a Fonte', 'resp': 'Ana', 'data': '2027-03-01', 'cal': True}, {'id': 'e2', 'texto': 'Comprar geladeira', 'status': 'Feito'}]}],
               'atividades': [{'id': 't1', 'titulo': 'Almoço', 'data': '2026-11-22', 'categoria': 'Celebração / Evento'}]}, open(PAC, 'w'))
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
U = f"http://localhost:{PORT}/"
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
async def main():
    p0 = json.load(open(PAC)); nA = len(p0['atas']); nE = sum(len(a.get('enc', [])) for a in p0['atas'])
    nCal = len({t['id'] for t in p0.get('atividades', [])}) + sum(1 for a in p0['atas'] for e in a.get('enc', []) if e.get('cal') and e.get('data'))
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 1280, 'height': 900}); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}")
        pg = await ctx.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(U + "login.html#criar-conta")
        await pg.fill('#n', 'Admin Teste'); await pg.fill('#e', 'a@t.com'); await pg.fill('#s', 'senha12345'); await pg.fill('#s2', 'senha12345'); await pg.fill('#w', '21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        ativ0 = await pg.evaluate("PR_DADOS.db.get('ativ',[]).length")
        await pg.evaluate("document.querySelector('[data-tab=documentos]').click()"); await pg.wait_for_timeout(600)
        await pg.evaluate("document.querySelector('#tab [data-s=atas]').click()"); await pg.wait_for_timeout(300)
        ok(await pg.locator('label[for="d-imp"]').count() == 1, "botão 'Importar ata preparada' nas Atas")
        await pg.set_input_files('#d-imp', PAC); await pg.wait_for_selector('#imp-ok')
        t = await pg.inner_text('#tab'); ok('Conferir antes de importar' in t and p0['atas'][0]['titulo'] in t, "mostra tudo para conferir antes de gravar")
        await pg.screenshot(path='/tmp/importar-conferir.png', full_page=True)
        ok(await pg.evaluate("PR_DADOS.db.get('docs',[]).length") == 0, "nada gravado antes de confirmar")
        await pg.click('#imp-ok'); await pg.wait_for_timeout(300)
        docs = await pg.evaluate("PR_DADOS.db.get('docs',[])"); ativ = await pg.evaluate("PR_DADOS.db.get('ativ',[])")
        ok(len(docs) == nA and sum(len(d.get('enc', [])) for d in docs) == nE, f"{nA} ata(s) e {nE} encaminhamento(s) gravados")
        ids = [a['id'] for a in ativ]
        ok(all(ids.count(i) == 1 for i in ids) and all(t['id'] in ids for t in p0.get('atividades', [])), f"datas no calendário, sem repetir ({len(ativ) - ativ0} novas)")
        ok(await pg.locator('#tab a[href^="https://youtu"]').count() == sum(len(a.get('videos', [])) for a in p0['atas']), "botões dos vídeos em cada ata")
        await pg.screenshot(path='/tmp/importar-feito.png', full_page=True)
        # responsável e repetição semanal
        ok(all(a.get('resp') for a in ativ if a['id'] in {t['id'] for t in p0.get('atividades', []) if t.get('resp')}), "responsável gravado em cada data do calendário")
        await pg.evaluate("""(()=>{const a=PR_DADOS.db.get('ativ',[]);a.push({id:'sem-x',titulo:'Encontro semanal X',data:'2026-11-12',hora:'19:00',semanal:true,resp:'Admin Teste e Fulano',categoria:'Outras atividades'});PR_DADOS.db.set('ativ',a)})()""")
        n = await pg.evaluate("PR_DOCUMENTOS.eventos(PR_DADOS.db,'2026-11-01','2026-12-31').filter(e=>e.id==='sem-x').map(e=>e.data)")
        ok(n[:3] == ['2026-11-12', '2026-11-19', '2026-11-26'] and len(n) == 8, f"atividade semanal repete toda quinta ({len(n)} vezes em nov-dez)")
        await pg.evaluate("document.querySelector('#tab [data-s=mes]').click()"); await pg.wait_for_timeout(300)
        await pg.evaluate("document.querySelector('#tab [data-s=mes]').click()"); await pg.wait_for_timeout(300)
        html = await pg.evaluate("document.querySelector('#tab').innerHTML")
        ok('fa-user-check' in html, "quem tem cadastro aparece marcado (✓) como responsável")
        ok('(sem cadastro)' in html or 'Fulano' in html, "quem não tem cadastro aparece pelo nome")
        await pg.screenshot(path='/tmp/importar-calendario.png', full_page=True)
        # Pendências: encaminhamentos em aberto com o código da ata de origem, sem data e sem responsável
        pend = [(a, e) for a in p0['atas'] for e in a.get('enc', []) if e.get('status', 'Em aberto') == 'Em aberto']
        await pg.evaluate("document.querySelector('#tab [data-s=pend]').click()"); await pg.wait_for_timeout(300)
        ok(await pg.locator('#p-res tbody tr').count() == len(pend), f"Pendências lista os {len(pend)} encaminhamentos em aberto")
        if any(a.get('codigo') for a, e in pend): ok(await pg.locator('#p-res [data-pa] .badge-status').first.inner_text() in {a.get('codigo') for a, e in pend}, "cada pendência mostra o código da ata de origem")
        nsd = sum(1 for a, e in pend if not e.get('data'))
        await pg.click('[data-pf=semData]'); await pg.wait_for_timeout(200)
        ok(await pg.locator('#p-res tbody tr').count() == nsd, f"filtro 'Sem data' ({nsd})")
        nsr = sum(1 for a, e in pend if not (e.get('resp') or '').strip() or e['resp'].strip().lower() == 'a definir')
        await pg.click('[data-pf=semResp]'); await pg.wait_for_timeout(200)
        ok(await pg.locator('#p-res tbody tr').count() == nsr, f"filtro 'Sem responsável' ({nsr})")
        await pg.screenshot(path='/tmp/pendencias.png', full_page=True)
        await pg.click('[data-pf=""]'); await pg.wait_for_timeout(200)
        await pg.select_option('#p-res select >> nth=0', 'Feito'); await pg.wait_for_timeout(200)
        ok(await pg.locator('#p-res tbody tr').count() == len(pend) - 1, "marcar Feito tira da lista de pendências")
        await pg.evaluate("(()=>{const l=PR_DADOS.db.get('docs',[]);l.forEach(d=>(d.enc||[]).forEach(e=>{if(e.status==='Feito'&&e.id==='%s')e.status='Em aberto'}));PR_DADOS.db.set('docs',l)})()" % pend[0][1]['id'])
        await pg.evaluate("document.querySelector('#tab [data-s=pend]').click()"); await pg.wait_for_timeout(300)
        await pg.locator('#p-res [data-pa]').first.click(); await pg.wait_for_timeout(300)
        ok(await pg.locator('#d-imp').count() == 1 and await pg.locator('#l-res .doc-item').count() >= 1, "clicar no código abre a ata de origem")
        await pg.evaluate("document.querySelector('#tab [data-s=atas]').click()"); await pg.wait_for_timeout(300)
        nAtiv = await pg.evaluate("PR_DADOS.db.get('ativ',[]).length")
        await pg.set_input_files('#d-imp', PAC); await pg.wait_for_selector('#imp-ok')
        ok('já existe: será atualizada' in await pg.inner_text('#tab'), "importar de novo avisa que vai atualizar")
        await pg.click('#imp-ok'); await pg.wait_for_timeout(300)
        ok(await pg.evaluate("PR_DADOS.db.get('docs',[]).length") == nA and await pg.evaluate("PR_DADOS.db.get('ativ',[]).length") == nAtiv, "importar de novo não duplica nada")
        bad = '/tmp/pacote_ruim.json'; open(bad, 'w').write('{"x":1}')
        await pg.set_input_files('#d-imp', bad); await pg.wait_for_timeout(300)
        ok('não é um pacote' in await pg.inner_text('#tab'), "arquivo errado é recusado com aviso")
        ok(not errs, "sem erros de JavaScript " + str(errs[:3]))
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
