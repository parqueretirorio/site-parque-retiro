# Teste: links diretos para os Mestres (area-restrita.html#t=...&s=...) sobrevivem ao login e abrem a aba certa.
import asyncio, subprocess, time, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from supabase_falso import SupabaseFalso, preparar_banco
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8871
URL_SB = 'https://yhzsuokwglznehvbclwd.supabase.co'
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}"
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
async def main():
    preparar_banco(); sb = SupabaseFalso(URL_SB); sb.zoom = True
    sb.zoom_gravacoes = [{'uuid': 'u9', 'topico': 'Reunião grande', 'inicio': '2026-03-02T13:00:00Z', 'duracao': 90, 'tamanho': 3 * 1073741824, 'transcricao': None}]
    sb.criar_conta('leonidasfrancaemedi@gmail.com', 'senhaLeo123', 'Leonidas França', nivel='administrador', status='aprovado', whatsapp='21999990000')
    async with async_playwright() as p:
        br = await p.chromium.launch(); ctx = await br.new_context(viewport={'width': 1280, 'height': 900}); await ctx.route(URL_SB + '/**', sb.tratar)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(B + '/login.html?servidor=1'); await pg.wait_for_timeout(500)
        await pg.goto(B + '/area-restrita.html#t=documentos&s=dar'); await pg.wait_for_url('**/login.html*', timeout=10000)
        ok(True, "sem login: vai para a tela de entrar")
        await pg.fill('#e', 'leonidasfrancaemedi@gmail.com'); await pg.fill('#s', 'senhaLeo123'); await pg.click('#f button.btn-large')
        await pg.wait_for_url('**/area-restrita.html#t=documentos&s=dar', timeout=10000); await pg.wait_for_timeout(800)
        ok(await pg.inner_text('#tab .tab-btn.active') == 'Dar encaminhamento', "depois de entrar, abre direto em Dar encaminhamento")
        await pg.goto(B + '/area-restrita.html#t=album&s=lote'); await pg.reload(); await pg.wait_for_timeout(1000)
        ok('Enviar em lote' in await pg.inner_text('.tabs.sub .tab-btn.active'), "link do Álbum abre em Enviar em lote")
        await pg.goto(B + '/area-restrita.html#t=documentos&s=atas&z=zoom'); await pg.reload(); await pg.wait_for_selector('#zm-box table', timeout=10000)
        t = await pg.inner_text('#zm-box')
        ok('Últimos 12 meses' in t and 'Reunião grande' in t, "link do Zoom abre as gravações dos últimos 12 meses")
        ok(not errs, f"sem erros de JavaScript {errs}")
        await br.close()
try: asyncio.run(main())
finally: srv.terminate()
