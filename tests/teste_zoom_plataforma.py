# Teste: ligação Zoom ↔ plataforma (função zoom simulada, PostgreSQL local com as migrações reais).
#  - Atas › "Gravações do Zoom": lista, cria ata pela transcrição, apaga da nuvem
#  - Calendário: "Criar a reunião no Zoom" põe o link de entrada na atividade
import asyncio, subprocess, time, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from supabase_falso import SupabaseFalso, preparar_banco
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8867
URL_SB = 'https://yhzsuokwglznehvbclwd.supabase.co'
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}"
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
VTT = 'WEBVTT\n\n1\n00:00:03.000 --> 00:00:06.000\nLeonidas França: Boa noite, começando a Frente de Ação.\n\n2\n00:00:07.000 --> 00:00:10.000\nCristina Souza: Proponho o mutirão no dia 29.\n'
async def entra(pg, email, senha):
    await pg.goto(B + '/login.html?servidor=1'); await pg.fill('#e', email); await pg.fill('#s', senha); await pg.click('#f button.btn-large')
    await pg.wait_for_url('**/area-restrita.html', timeout=10000)
    await pg.evaluate("document.querySelector('[data-tab=documentos]').click()"); await pg.wait_for_timeout(600)
async def main():
    preparar_banco(); sb = SupabaseFalso(URL_SB)
    sb.criar_conta('leonidasfrancaemedi@gmail.com', 'senhaLeo123', 'Leonidas França', nivel='administrador', status='aprovado', whatsapp='21999990000')
    async with async_playwright() as p:
        br = await p.chromium.launch(); ctx = await br.new_context(viewport={'width': 1280, 'height': 900}); await ctx.route(URL_SB + '/**', sb.tratar)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
        await entra(pg, 'leonidasfrancaemedi@gmail.com', 'senhaLeo123')
        await pg.evaluate("document.querySelector('#tab [data-s=atas]').click()"); await pg.wait_for_timeout(300)
        # sem configurar: aviso claro
        await pg.click('#d-zoom'); await pg.wait_for_selector('#zm-box .form-erro')
        ok('ainda não foi configurada' in await pg.inner_text('#zm-box'), "sem os códigos do Zoom: aviso claro")
        await pg.click('#zm-x')
        sb.zoom = True
        sb.zoom_gravacoes = [
            {'uuid': 'u1/=', 'topico': 'Frente de Ação CONecta Retiro', 'inicio': '2026-11-19T22:00:05Z', 'duracao': 62, 'tamanho': 350 * 1048576, 'transcricao': VTT},
            {'uuid': 'u2', 'topico': 'Reunião antiga', 'inicio': '2026-11-02T13:00:00Z', 'duracao': 120, 'tamanho': 2 * 1073741824, 'transcricao': None}]
        await pg.click('#d-zoom'); await pg.wait_for_selector('#zm-box table')
        t = await pg.inner_text('#zm-box')
        ok('2 gravação(ões)' in t and 'com transcrição' in t and 'sem transcrição' in t and '19/11/2026' in t and '19:00' in t, "lista as gravações (data e hora de Brasília, com/sem transcrição)")
        await pg.screenshot(path='/tmp/zoom-lista.png', full_page=True)
        await pg.click('[data-zma="0"]'); await pg.wait_for_selector('#trs-box')
        ok('Leonidas França, Cristina Souza' in await pg.inner_text('#trs-box') and await pg.input_value('#tr-d') == '2026-11-19', "transcrição do Zoom vira rascunho de ata")
        await pg.click('#tr-ok'); await pg.wait_for_selector('#fd')
        d = await pg.evaluate("PR_DADOS.db.get('docs',[]).find(d=>d.zoomUuid==='u1/=')")
        ok(d and 'Proponho o mutirão' in d['transcricao'], "ata criada com a transcrição")
        await pg.click('#d-x'); await pg.wait_for_timeout(200)
        await pg.click('#d-zoom'); await pg.wait_for_selector('#zm-box table')
        await pg.click('[data-zmx="1"]'); await pg.wait_for_timeout(800)
        ok(len(sb.zoom_gravacoes) == 1 and '1 gravação(ões)' in await pg.inner_text('#zm-box'), "apagar da nuvem do Zoom")
        await pg.click('#zm-x')
        # calendário: criar reunião no Zoom
        await pg.evaluate("document.querySelector('#tab [data-s=mes]').click()"); await pg.wait_for_timeout(300)
        await pg.click('#a-novo'); await pg.wait_for_selector('#a-zoom')
        await pg.fill('#a-t', 'Frente de Ação CONecta Retiro'); await pg.fill('#a-d', '2026-11-26'); await pg.check('#a-zoom'); await pg.click('#fa button.btn-large')
        ok('informe a hora' in (await pg.inner_text('#fa')).lower(), "sem hora: pede a hora")
        await pg.fill('#a-h', '19:00'); await pg.check('#a-sem'); await pg.click('#fa button.btn-large'); await pg.wait_for_timeout(800)
        a = await pg.evaluate("PR_DADOS.db.get('ativ',[]).find(a=>a.titulo==='Frente de Ação CONecta Retiro')")
        ok(a and a.get('zoom', '').startswith('https://us02web.zoom.us/j/') and sb.zoom_reunioes[-1]['inicio'] == '2026-11-26T19:00' and sb.zoom_reunioes[-1]['semanal'], "cria a reunião (semanal) no Zoom e guarda o link")
        ok(await pg.locator('#tab a[href^="https://us02web.zoom.us/j/"]').count() >= 1, "link 'Zoom' aparece no calendário")
        await pg.screenshot(path='/tmp/zoom-cal.png', full_page=True)
        ok(not errs, "sem erros de JavaScript " + str(errs[:3]))
        await br.close()
try: asyncio.run(main())
finally: srv.terminate()
