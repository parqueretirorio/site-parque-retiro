# Teste (26/11/2026): banners no padrão 1920 × 640 e imagem opcional para celular (1200 × 900, telas até 700 px).
import asyncio, subprocess, time, os, json, zipfile, shutil, sys
from PIL import Image, ImageDraw
from playwright.async_api import async_playwright
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); T = "/tmp/claude-0/bn_cel"; os.makedirs(T, exist_ok=True)
def img(nome, w, h, cor):
    i = Image.new('RGB', (w, h), cor); ImageDraw.Draw(i).rectangle([w // 10, h // 10, w * 9 // 10, h * 9 // 10], outline='white', width=8); i.save(f"{T}/{nome}", quality=90); return f"{T}/{nome}"
DESK = img('desk.jpg', 1920, 640, (30, 90, 60)); CEL = img('cel.jpg', 1200, 900, (200, 120, 20)); ANT = img('antigo.jpg', 1600, 533, (40, 40, 120))
RUIM = img('ruim.jpg', 1516, 420, (90, 0, 0)); CELQ = img('celq.jpg', 1080, 1080, (0, 90, 90))
srv = subprocess.Popen(["python3", "-m", "http.server", "8771", "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
async def aba(pg, t):
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-header,button,h3')&&c.querySelector('.area-header,button,h3').click()}", t)
    await pg.click(f'[data-tab="{t}"]')
async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(accept_downloads=True)
        await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}")
        pg = await ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("dialog", lambda d: asyncio.ensure_future(d.accept()))
        await pg.goto("http://localhost:8771/login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n', 'Admin Teste'); await pg.fill('#e', 'a@t.com'); await pg.fill('#s', 'senha12345'); await pg.fill('#s2', 'senha12345'); await pg.fill('#w', '21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large'); await pg.wait_for_url("**/area-restrita.html")
        await aba(pg, 'comunicacao'); await pg.click('[data-s="site"]')
        txt = await pg.inner_text('[data-slug="doacao"]')
        ok('1920 × 640' in txt, "painel mostra a medida 1920 × 640")
        await pg.click('[data-slug="doacao"] [data-a="abrir"]')
        await pg.set_input_files('#up-doacao', RUIM); await pg.wait_for_selector('.form-erro[role=alert]')
        ok('1516 × 420' in await pg.inner_text('.form-erro[role=alert]'), "imagem fora de 3:1 é recusada com mensagem clara")
        await pg.set_input_files('#up-doacao', ANT); await pg.wait_for_selector('[data-slug="doacao"] .bn-slide')
        ok('pouca nitidez' in await pg.inner_text('body'), "banner antigo 1600 × 533 é aceito (3:1) com aviso de nitidez")
        # remove e envia a nova de 1920
        await pg.click('[data-slug="doacao"] [data-a="del"]'); await pg.set_input_files('#up-doacao', DESK); await pg.wait_for_selector('[data-slug="doacao"] .bn-slide')
        ok('pouca nitidez' not in await pg.inner_text('[data-slug="doacao"]'), "1920 × 640 sem aviso")
        txt = await pg.inner_text('[data-slug="doacao"] .bn-cel'); ok('1200 × 900' in txt and 'opcional' in txt, "cada slide tem o campo da imagem para celular (1200 × 900, opcional)")
        await pg.set_input_files('input[data-a="upm"]', CELQ); await pg.wait_for_selector('.form-erro[role=alert]')
        ok('1080 × 1080' in await pg.inner_text('.form-erro[role=alert]'), "celular fora de 4:3 é recusado")
        await pg.click('[data-slug="doacao"] [data-a="abrir"]') if False else None
        await pg.set_input_files('input[data-a="upm"]', CEL); await pg.wait_for_selector('[data-slug="doacao"] [data-a="delm"]')
        ok(await pg.evaluate("PR_DADOS.db.get('site_banners',[]).find(x=>x.id==='doacao').slides[0].imgM.startsWith('data:image/jpeg')"), "imagem do celular gravada no rascunho")
        await pg.fill('[data-slug="doacao"] [data-i="0"] [data-f="alt"]', 'Banner Doação'); await pg.click('[data-slug="doacao"] [data-a="salvar"]')
        # outra página só com imagem do computador (fallback)
        await pg.click('[data-slug="reservas"] [data-a="abrir"]'); await pg.set_input_files('#up-reservas', DESK); await pg.wait_for_selector('[data-slug="reservas"] .bn-slide')
        await pg.fill('[data-slug="reservas"] [data-i="0"] [data-f="alt"]', 'Banner Reservas'); await pg.click('[data-slug="reservas"] [data-a="salvar"]')
        async with pg.expect_download() as dl: await pg.click('#bn-zip')
        zp = await (await dl.value).path(); z = zipfile.ZipFile(zp); nomes = z.namelist()
        ok('banners/doacao-1-m.jpg' in nomes and 'banners/reservas-1-m.jpg' not in nomes, "ZIP leva a imagem de celular só onde existe")
        j = json.loads(z.read('banners/banners.json')); ok(j['slots']['doacao']['slides'][0].get('mobile') == 'banners/doacao-1-m.jpg' and 'mobile' not in j['slots']['reservas']['slides'][0], "banners.json tem o campo mobile só onde existe")
        im = Image.open(z.open('banners/doacao-1-m.jpg')); ok(im.size == (1200, 900), "arquivo do celular tem 1200 × 900")
        im = Image.open(z.open('banners/doacao-1.jpg')); ok(im.size == (1920, 640), "arquivo do computador tem 1920 × 640")
        # site público (sem login)
        tmp = "/tmp/claude-0/pub_cel"; shutil.rmtree(tmp, ignore_errors=True); shutil.copytree(SITE, tmp, ignore=shutil.ignore_patterns('tests', 'docs', 'supabase')); z.extractall(tmp)
        srv2 = subprocess.Popen(["python3", "-m", "http.server", "8772", "-d", tmp], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
        try:
            async def mede(w, h, pag):
                c = await b.new_context(viewport={'width': w, 'height': h}); q = await c.new_page(); q.on("pageerror", lambda e: errs.append(str(e)))
                await q.goto(f"http://localhost:8772/{pag}.html"); await q.wait_for_selector('.pr-banner img'); await q.wait_for_timeout(600)
                r = await q.evaluate("(()=>{const i=document.querySelector('.pr-banner img');const r=i.getBoundingClientRect();return {src:i.currentSrc.split('/').pop(),w:Math.round(r.width),h:Math.round(r.height),sw:document.documentElement.scrollWidth,sh:Math.round(document.querySelector('.pr-b-box').getBoundingClientRect().height)}})()")
                await c.close(); return r
            r = await mede(390, 844, 'doacao'); ok(r['src'] == 'doacao-1-m.jpg' and r['sw'] == 390 and abs(r['h'] - 292) <= 3, f"celular (390 px): usa a imagem do celular, 4:3 ({r})")
            r = await mede(700, 900, 'doacao'); ok(r['src'] == 'doacao-1-m.jpg', "700 px ainda usa a do celular")
            r = await mede(701, 900, 'doacao'); ok(r['src'] == 'doacao-1.jpg', "701 px já usa a do computador")
            r = await mede(1920, 1080, 'doacao'); ok(r['src'] == 'doacao-1.jpg' and r['w'] == 1920 and r['h'] == 640, f"Full HD: banner ocupa 1920 × 640 ({r})")
            r = await mede(2560, 1440, 'doacao'); ok(r['w'] == 1920, "tela de 2560 px: limite de 1920 px")
            r = await mede(390, 844, 'reservas'); ok(r['src'] == 'reservas-1.jpg' and abs(r['h'] - 130) <= 3, f"sem imagem de celular: usa a do computador, 3:1 ({r})")
        finally: srv2.terminate()
        await b.close()
    ok(not errs, f"sem erros de JavaScript {errs}")
    print("\nTODOS OS TESTES PASSARAM")
try: asyncio.run(main())
finally: srv.terminate()
