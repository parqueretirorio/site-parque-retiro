# Teste da Ajuda do app CONecta Retiro (1.3.0): guia do app, busca, "?" de cada ferramenta, artigos da Central de Ajuda,
# ajuda sem entrar, espanhol e botão "Ajuda" dentro das ferramentas.
# Rodar a partir da pasta do site:  python3 tests/teste_app_ajuda.py   (precisa do PostgreSQL 16 local ligado)
import asyncio, subprocess, time, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from supabase_falso import SupabaseFalso, preparar_banco

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8855
URL_SB = 'https://yhzsuokwglznehvbclwd.supabase.co'
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}"; OUT = os.environ.get('SHOTS', '/tmp')
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m

async def main():
    preparar_banco()
    sb = SupabaseFalso(URL_SB)
    sb.criar_conta('leonidasfrancaemedi@gmail.com', 'senhaLeo123', 'Leonidas França', nivel='administrador', status='aprovado', whatsapp='21999990000')
    sb.criar_conta('beto@x.com', 'senhaBeto123', 'Beto Silva', nivel='leitor', status='aprovado', funcoes=['jardinagem'], whatsapp='21988887777')
    async with async_playwright() as p:
        br = await p.chromium.launch()
        ctx = await br.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='pt-BR')
        await ctx.route(URL_SB + '/**', sb.tratar)
        pg = await ctx.new_page(); erros = []; pg.on('pageerror', lambda e: erros.append(str(e)))

        # sem entrar: a ajuda já está disponível na tela Entrar
        await pg.goto(B + '/app/?servidor=1'); await pg.wait_for_selector('#fe')
        ok(await pg.locator('.links a[href="#ajuda"]').count() == 1, "tela Entrar tem o link Ajuda")
        await pg.click('.links a[href="#ajuda"]'); await pg.wait_for_selector('.topo h1:has-text("Ajuda")')
        ok(await pg.locator('#aguia .linha[href^="#guia/"]').count() == 8, "sem entrar: guia do app com 8 assuntos")
        ok(await pg.locator('a[href^="#ajuda-f/"]').count() == 0, "sem entrar: não lista ferramentas")
        await pg.click('a[href="#guia/entrar"]'); await pg.wait_for_selector('.passos-ajuda li')
        ok('Esqueci minha senha' in await pg.inner_text('main'), "guia 'Entrar' explica o Esqueci minha senha")
        await pg.screenshot(path=OUT + '/app-ajuda-1-guia.png', full_page=True)
        await pg.click('.voltar'); await pg.fill('#ab', 'senha'); await pg.wait_for_selector('.artigo-link')
        txt = await pg.inner_text('#ares')
        ok('Entrar, criar conta e esqueci a senha' in txt and 'Artigos da Central de Ajuda' in txt, "busca acha no guia e nos artigos da Central de Ajuda")
        await pg.click('.voltar-entrar'); await pg.wait_for_selector('#fe'); ok(True, "da ajuda volta para Entrar")

        # entrar como administrador
        await pg.fill('#e', 'leonidasfrancaemedi@gmail.com'); await pg.fill('#s', 'senhaLeo123'); await pg.click('#be')
        await pg.wait_for_selector('.topo-ola', timeout=10000)
        ok(await pg.locator('#bt-ajuda').count() == 1, "Início tem o botão Ajuda")
        nq = await pg.locator('.linha-f .q').count(); ok(nq >= 3, f"'?' ao lado de cada ferramenta ({nq})")
        await pg.screenshot(path=OUT + '/app-ajuda-2-inicio.png', full_page=True)
        await pg.click('.linha-f .q[href="#ajuda-f/users"]'); await pg.wait_for_selector('.artigo h1, main.artigo')
        h1 = await pg.inner_text('.topo h1'); ok('responsáveis' in h1.lower() or 'Gestão' in h1, f"'?' de Responsáveis abre o artigo certo ({h1})")
        ok(await pg.locator('main a.bt-principal[href*="area-restrita.html?app=1#t=users"]').count() == 1, "artigo tem 'Abrir a ferramenta'")
        ok(await pg.locator('main .passos-ajuda li').count() >= 2, "artigo mostra o passo a passo")
        await pg.screenshot(path=OUT + '/app-ajuda-3-artigo.png', full_page=True)
        await pg.click('#bt-ajuda') if await pg.locator('#bt-ajuda').count() else await pg.goto(B + '/app/?servidor=1#ajuda')
        await pg.wait_for_selector('.topo h1:has-text("Ajuda")')
        nf = await pg.locator('a[href^="#ajuda-f/"]').count(); ok(nf > 20, f"Ajuda lista a ajuda de cada ferramenta ({nf})")
        await pg.click('a[href="#artigo/usar-o-app"]') if await pg.locator('a[href="#artigo/usar-o-app"]').count() else await pg.goto(B + '/app/?servidor=1#artigo/usar-o-app')
        await pg.wait_for_selector('main.artigo'); ok('Usar o app CONecta Retiro' in await pg.inner_text('.topo h1'), "artigo novo 'Usar o app CONecta Retiro'")
        # dentro de uma ferramenta: botão Ajuda ao lado de Voltar ao app
        await pg.goto(B + '/area-restrita.html?app=1#t=reservas'); await pg.wait_for_selector('#ajuda-app', timeout=10000)
        ok(await pg.get_attribute('#ajuda-app', 'href') == 'app/#ajuda-f/reservas', "ferramenta aberta pelo app tem o botão Ajuda")
        await pg.click('#ajuda-app'); await pg.wait_for_selector('main.artigo', timeout=10000)
        ok('Alojamento' in await pg.inner_text('.topo h1') or 'reserva' in (await pg.inner_text('.topo h1')).lower(), "botão Ajuda abre a explicação do Alojamento")

        # espanhol
        await pg.goto(B + '/app/?servidor=1&lang=es#ajuda'); await pg.wait_for_selector('.topo h1:has-text("Ayuda")')
        txt = await pg.inner_text('main'); ok('Cómo usar la app' in txt and 'Ayuda de cada herramienta' in txt, "Ajuda em espanhol")
        await pg.click('a[href="#guia/instalar"]'); await pg.wait_for_selector('.passos-ajuda li')
        ok('Agregar a pantalla de inicio' in await pg.inner_text('main'), "guia em espanhol")
        await pg.goto(B + '/app/?servidor=1&lang=es#ajuda-f/reservas'); await pg.wait_for_selector('main.artigo')
        t_es = await pg.inner_text('main'); ok('todavía está en portugués' not in t_es and 'Paso a paso' in t_es and 'Abrir la herramienta' in t_es, "artigo da Central de Ajuda em espanhol")
        ok('Alojamiento' in await pg.inner_text('.topo h1'), "título do artigo em espanhol")
        await pg.screenshot(path=OUT + '/app-ajuda-4-es.png', full_page=True)

        # pessoa com uma função: só a ajuda das ferramentas que pode abrir
        await pg.goto(B + '/app/?servidor=1&lang=pt#inicio'); await pg.wait_for_selector('#sair'); await pg.click('#sair'); await pg.wait_for_selector('#fe', timeout=10000)
        await pg.fill('#e', 'beto@x.com'); await pg.fill('#s', 'senhaBeto123'); await pg.click('#be'); await pg.wait_for_selector('.topo-ola', timeout=10000)
        await pg.goto(B + '/app/?servidor=1#ajuda'); await pg.wait_for_selector('.topo h1:has-text("Ajuda")')
        hs = await pg.eval_on_selector_all('a[href^="#ajuda-f/"]', 'l => l.map(a => a.getAttribute("href"))')
        ok('#ajuda-f/jardinagem' in hs and '#ajuda-f/users' not in hs, "Beto vê a ajuda da Jardinagem e não a de Responsáveis")
        ok(not erros, f"sem erros de JavaScript {erros}")
        await br.close()
try: asyncio.run(main())
finally: srv.terminate()
