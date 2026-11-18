# Teste: chat ao vivo (Tawk.to) ao lado do WhatsApp. Desligado = nada aparece; ligado = botão acima do WhatsApp,
# o serviço externo só carrega no clique, e não aparece na área restrita nem no login.
import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8872
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}"
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(); ctx = await br.new_context(viewport={'width': 1280, 'height': 900}); pedidos = []
        async def rota(r):
            pedidos.append(r.request.url)
            await r.fulfill(status=200, content_type='application/javascript', body="window.Tawk_API.maximize=function(){window.__max=1};setTimeout(function(){window.Tawk_API.onLoad&&window.Tawk_API.onLoad()},10);")
        await ctx.route('https://embed.tawk.to/**', rota)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(B + '/index.html'); await pg.wait_for_timeout(500)
        ok(await pg.locator('#pr-chat-btn').count() == 0 and await pg.locator('.whatsapp-float').count() == 1, "desligado: só o WhatsApp aparece")
        lig = lambda i: "window.PR_CONFIG_DADOS.livechat={provedor:'tawkto',ativo:true,id:'%s'}" % i
        await pg.route('**/config-dados.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=open(SITE + '/config-dados.js').read() + ";" + lig('abc123/1xyz')))
        await pg.goto(B + '/index.html'); await pg.wait_for_selector('#pr-chat-btn')
        ok(await pg.locator('.whatsapp-float').count() == 1, "ligado: o WhatsApp continua")
        bc, bw = await pg.locator('#pr-chat-btn').bounding_box(), await pg.locator('.whatsapp-float').bounding_box()
        ok(bc['y'] + bc['height'] <= bw['y'] and abs(bc['x'] - bw['x']) < 2, "o botão do chat fica logo acima do WhatsApp, sem sobrepor")
        ok(not pedidos, "antes do clique nada do Tawk.to é carregado")
        await pg.click('#pr-chat-btn'); await pg.wait_for_function('window.__max===1', timeout=5000)
        ok(pedidos == ['https://embed.tawk.to/abc123/1xyz'], "no clique carrega o widget certo e abre o chat")
        ok(await pg.locator('#pr-chat-btn').count() == 0, "o botão sai, o widget do Tawk.to assume o lugar")
        for pagina in ['area-restrita.html', 'login.html']:
            pg2 = await ctx.new_page(); await pg2.route('**/config-dados.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=open(SITE + '/config-dados.js').read() + ";" + lig('abc123/1xyz')))
            await pg2.goto(B + '/' + pagina); await pg2.wait_for_timeout(700)
            ok(await pg2.locator('#pr-chat-btn').count() == 0, f"não aparece em {pagina}"); await pg2.close()
        pg3 = await ctx.new_page(); await pg3.route('**/config-dados.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=open(SITE + '/config-dados.js').read() + ";" + lig('x"><script>/inválido')))
        await pg3.goto(B + '/index.html'); await pg3.wait_for_timeout(600)
        ok(await pg3.locator('#pr-chat-btn').count() == 0, "código inválido não liga o chat")
        ok(not errs, f"sem erros de JavaScript {errs}")
        await br.close()
try: asyncio.run(main())
finally: srv.terminate()
