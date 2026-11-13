# Teste: app CONecta Retiro (1.6.1) > "Dar encaminhamento" (atalho no início e aba em Documentos e Calendários),
# contra o PostgreSQL local com as migrações do Supabase.  Rodar:  python3 tests/teste_app_dar.py [pacote.json]
import asyncio, subprocess, time, os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from supabase_falso import SupabaseFalso, preparar_banco
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8863
URL_SB = 'https://yhzsuokwglznehvbclwd.supabase.co'
PAC = sys.argv[1] if len(sys.argv) > 1 else '/mnt/user-data/outputs/atas-reuniao-escola-2026.json'
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}"
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
async def main():
    preparar_banco(); sb = SupabaseFalso(URL_SB)
    sb.criar_conta('leonidasfrancaemedi@gmail.com', 'senhaLeo123', 'Leonidas França', nivel='administrador', status='aprovado', whatsapp='21999990000')
    p0 = json.load(open(PAC))
    async with async_playwright() as p:
        br = await p.chromium.launch(); ctx = await br.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='pt-BR')
        await ctx.route(URL_SB + '/**', sb.tratar)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(B + '/app/?servidor=1'); await pg.wait_for_selector('#fe')
        await pg.fill('#e', 'leonidasfrancaemedi@gmail.com'); await pg.fill('#s', 'senhaLeo123'); await pg.click('#be')
        await pg.wait_for_selector('.topo-ola', timeout=10000)
        # atas do pacote gravadas no servidor (como depois de "Importar ata preparada")
        docs = [dict(a, area='atas', ano=int(a['data'][:4]), anexos=[], arquivo='') for a in p0['atas']]
        await pg.evaluate("async d=>{PR_DADOS.db.set('docs',d); await PR_DADOS.sincronizar();}", docs)
        await pg.reload(); await pg.wait_for_selector('.topo-ola', timeout=10000)
        n0 = await pg.evaluate("PR_DOCUMENTOS.darEncaminhamento(PR_DADOS.db, new Date().toISOString().slice(0,10), '').itens.length")
        ok(n0 > 0 and await pg.locator('a.cartao[href="#documentos/dar"]').count() == 1, "atalho 'Dar encaminhamento' no início do app")
        ok(str(n0) in await pg.inner_text('a.cartao[href="#documentos/dar"]'), f"atalho mostra quantos estão em aberto ({n0})")
        await pg.screenshot(path='/tmp/app-dar-inicio.png')
        await pg.click('a.cartao[href="#documentos/dar"]'); await pg.wait_for_selector('[data-de]')
        ok(await pg.locator('nav.sub a[href="#documentos/dar"].on').count() == 1, "aba Dar encaminhamento dentro de Documentos e Calendários")
        ok(await pg.locator('[data-de]').count() == n0, f"lista os {n0} pontos da última Reunião de Escola")
        await pg.screenshot(path='/tmp/app-dar.png')
        ok(await pg.locator('#dtxt').count() == 1, "mensagem para os Mestres já aberta no topo")
        t = await pg.input_value('#dtxt')
        ok(t.startswith('*Status dos encaminhamentos') and f'{n0}. ' in t and 'sem responsável' in t, "cada ponto com o status")
        ok((await pg.get_attribute('#dwa', 'href')).startswith('https://wa.me/?text='), "abre no WhatsApp")
        ok(f'{B}/area-restrita.html' in t, "link da mensagem leva à área restrita do site")
        await pg.click('[data-dm=resumo]'); await pg.wait_for_selector('#dtxt')
        ok('Dar encaminhamento' in await pg.input_value('#dtxt'), "versão curta disponível")
        await pg.click('[data-dm=status]'); await pg.wait_for_selector('#dtxt')
        c = pg.locator('[data-de]').first; await c.locator('summary').click()
        await c.locator('[data-k=resp]').fill('Leonidas França'); await c.locator('[data-k=data]').fill('2026-12-05'); await c.locator('[data-k=passo]').fill('Chamar no grupo'); await c.locator('[data-dok]').click(); await pg.wait_for_timeout(500)
        ok(await pg.evaluate("PR_DADOS.db.get('docs',[]).flatMap(d=>d.enc||[]).some(e=>e.resp==='Leonidas França'&&e.data==='2026-12-05'&&e.passo&&e.atualizado)"), "salvar no app grava quem assume, prazo e próximo passo")
        ok('Chamar no grupo' in await pg.input_value('#dtxt'), "a mensagem se atualiza com o novo status")
        await pg.screenshot(path='/tmp/app-dar-msg.png')
        c = pg.locator('[data-de]').first; await c.locator('summary').click(); await c.locator('[data-dfeito]').click(); await pg.wait_for_timeout(500)
        ok(await pg.locator('[data-de]').count() == n0 - 1, "Feito tira da lista")
        ok(not errs, "sem erros de JavaScript " + str(errs[:3]))
        await br.close()
try: asyncio.run(main())
finally: srv.terminate()
