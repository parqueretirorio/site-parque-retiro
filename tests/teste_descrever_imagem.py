# Teste (27/11/2026): ajuda para descrever imagens (Caminho A, sem IA e sem custo) em Atividades e Banners.
import asyncio, subprocess, time, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from supabase_falso import SupabaseFalso, preparar_banco
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8881
URL_SB = 'https://yhzsuokwglznehvbclwd.supabase.co'
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}"
PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
async def main():
    preparar_banco(); sb = SupabaseFalso(URL_SB); erros = []
    sb.criar_conta('leonidasfrancaemedi@gmail.com', 'senhaLeo123', 'Leonidas França', nivel='administrador', status='aprovado', whatsapp='21999990000')
    async with async_playwright() as p:
        br = await p.chromium.launch()
        c = await br.new_context(viewport={'width': 1200, 'height': 1000}, locale='pt-BR', permissions=['clipboard-read', 'clipboard-write']); await c.route(URL_SB + '/**', sb.tratar)
        pg = await c.new_page(); pg.on('pageerror', lambda x: erros.append(str(x)))
        await pg.goto(B + '/login.html?servidor=1'); await pg.wait_for_selector('#e'); await pg.fill('#e', 'leonidasfrancaemedi@gmail.com'); await pg.fill('#s', 'senhaLeo123'); await pg.click('#f button.btn-large'); await pg.wait_for_timeout(3000)
        await pg.goto(B + '/area-restrita.html#t=atividades'); await pg.wait_for_timeout(1500); await pg.reload(); await pg.wait_for_timeout(3000)
        await pg.click('#at-novo'); await pg.wait_for_selector('#at-desc')
        await pg.click('#at-desc'); await pg.wait_for_timeout(300)
        ok(await pg.locator('.dsc-box').count() == 0 and 'Escolha antes' in await pg.inner_text('#at-er'), "sem imagem, avisa em vez de abrir")
        await pg.evaluate("(u)=>{ window.__img=u }", PNG)
        ok(await pg.evaluate("typeof PR_DESCREVER.abrir") == 'function', "módulo carregado")
        campo = await pg.evaluate("(u)=>{ const i=document.querySelector('#at-ba'); PR_DESCREVER.abrir({imagem:u,campo:i,titulo:'Almoço'}); return true }", PNG)
        await pg.wait_for_selector('.dsc-box')
        ok(await pg.evaluate("document.activeElement.id") == 'dsc-o', "foco vai ao primeiro campo")
        ok(await pg.locator('#dsc-clw').is_hidden(), "campo de clima só no modo 4")
        await pg.fill('#dsc-o', 'imagem de ilustração do Parque com árvores'); await pg.fill('#dsc-tx', 'Almoço 29/11'); await pg.fill('#dsc-d', 'tons de verde')
        await pg.click('#dsc-g'); v = await pg.input_value('#dsc-r')
        ok(v == 'Ilustração do Parque com árvores, com o texto “Almoço 29/11”, tons de verde.', "modo 1 monta texto sem prefixo 'imagem de': " + v)
        ok('tamanho bom' in await pg.inner_text('#dsc-cont'), "contador indica tamanho bom")
        await pg.click('#dsc-m'); ok(await pg.locator('#dsc-lista').is_visible(), "lista de modos abre"); await pg.click('.dsc-op[data-m="2"]')
        ok(await pg.locator('#dsc-lista').is_hidden(), "lista fecha ao escolher")
        ok((await pg.input_value('#dsc-r')).startswith('A imagem mostra ilustração'), "trocar de modo remonta o texto")
        ok(await pg.evaluate("localStorage.getItem('pr-desc-modo')") == '2', "lembra o modo escolhido")
        await pg.click('#dsc-m'); await pg.keyboard.press('Escape'); ok(await pg.locator('.dsc-box').count() == 1 and await pg.locator('#dsc-lista').is_hidden(), "Esc fecha só a lista")
        await pg.click('.dsc-op[data-m="1"]', force=True) if False else None
        await pg.click('#dsc-m'); await pg.click('.dsc-op[data-m="1"]')
        await pg.click('#dsc-p'); cb = await pg.evaluate("navigator.clipboard.readText()")
        ok('Almoço 29/11' in cb and 'acessibilidade' in cb and 'anexando' in cb, "copia pedido pronto para o Claude")
        await pg.click('#dsc-g'); await pg.click('#dsc-u'); await pg.wait_for_timeout(200)
        ok(await pg.locator('.dsc-box').count() == 0 and (await pg.input_value('#at-ba')).startswith('Ilustração do Parque'), "Usar no campo preenche e fecha")
        ok(await pg.evaluate("document.activeElement.id") == 'at-desc', "foco volta ao botão")
        await pg.evaluate("(u)=>PR_DESCREVER.abrir({imagem:u,campo:document.querySelector('#at-ba')})", PNG); await pg.wait_for_selector('.dsc-box')
        await pg.keyboard.press('Escape'); ok(await pg.locator('.dsc-box').count() == 0, "Esc fecha o painel")
        # espanhol
        await pg.evaluate("PR_IDIOMA.aplica('es', false)"); await pg.wait_for_timeout(500)
        await pg.evaluate("(u)=>PR_DESCREVER.abrir({imagem:u,campo:document.querySelector('#at-ba')})", PNG); await pg.wait_for_selector('.dsc-box'); await pg.wait_for_timeout(500)
        tx = await pg.inner_text('.dsc-box'); ok('Describir la imagen' in tx and 'Armar texto' in tx and 'Usar en el campo' in tx, "painel traduzido para espanhol")
        await pg.fill('#dsc-o', 'ilustração do Parque'); await pg.click('#dsc-g'); ok('buen tamaño' in await pg.inner_text('#dsc-cont'), "contador traduzido")
        await pg.keyboard.press('Escape'); await pg.evaluate("PR_IDIOMA.aplica('pt', false)"); await pg.wait_for_timeout(300)
        # celular
        await pg.set_viewport_size({'width': 390, 'height': 800}); await pg.evaluate("(u)=>PR_DESCREVER.abrir({imagem:u,campo:document.querySelector('#at-ba')})", PNG); await pg.wait_for_selector('.dsc-box')
        bx = await pg.locator('.dsc-box').bounding_box(); ok(bx['width'] >= 385 and bx['y'] > 50, "no celular vira painel no rodapé")
        await pg.keyboard.press('Escape')
        # banners
        await pg.set_viewport_size({'width': 1200, 'height': 1000})
        ok(not erros, "sem erros de página: " + str(erros))
        await br.close()
    srv.terminate()
asyncio.run(main())
