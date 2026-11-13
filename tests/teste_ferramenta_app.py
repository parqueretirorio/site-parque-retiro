# Teste: área restrita aberta dentro do app (app/ferramenta.html) com cara de app e sem estourar a largura do celular.
# Rodar a partir da pasta do site:  python3 tests/teste_ferramenta_app.py
import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8852
U = f"http://localhost:{PORT}/"
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
# 1) app/ferramenta.html está em dia com area-restrita.html
base = open(os.path.join(SITE, 'area-restrita.html'), encoding='utf-8').read()
app = open(os.path.join(SITE, 'app', 'ferramenta.html'), encoding='utf-8').read()
limpa = lambda s: s.split('<body', 1)[1]
ok(limpa(base) == limpa(app) and '<base href="../">' in app, "app/ferramenta.html em dia com area-restrita.html (rode tools/gerar_ferramenta_app.py)")
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}")
        pg = await ctx.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(U + "app/ferramenta.html?app=1#t=users"); await pg.wait_for_url("**/app/**")
        ok('/app/' in pg.url and 'ferramenta' not in pg.url, "sem login, volta para a entrada do app (não a do site)")
        await pg.goto(U + "login.html#criar-conta")
        await pg.fill('#n', 'Admin Teste'); await pg.fill('#e', 'a@t.com'); await pg.fill('#s', 'senha12345'); await pg.fill('#s2', 'senha12345'); await pg.fill('#w', '21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        tabs = await pg.evaluate("PR_AREA.abasDe(PR_DADOS.db.get('users',[])[0]).map(t=>[t[0],t[2]])")
        largas = []
        for i, (t, nome) in enumerate(tabs):
            await pg.goto(U + f"app/ferramenta.html?app=1&n={i}#t={t}"); await pg.wait_for_selector('#app-titulo'); await pg.wait_for_timeout(250)
            if i == 0:
                ok(await pg.is_visible('#app-barra') and not await pg.is_visible('body > header') and not await pg.is_visible('#areas'), "barra do app no topo, sem cabeçalho do site nem menus de áreas")
                ok(await pg.get_attribute('#volta-app', 'href') == 'app/', "Início volta ao app")
            if await pg.inner_text('#app-titulo') != nome: largas.append(t + ': título ' + await pg.inner_text('#app-titulo'))
            w = await pg.evaluate("document.documentElement.scrollWidth")
            fora = await pg.evaluate("[...document.querySelectorAll('#tab *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+2&&!e.closest('.tabs')&&!e.closest('table')}).length")
            if w > 392 or fora: largas.append(f"{t}: largura {w}, {fora} elemento(s) para fora")
        ok(not largas, f"{len(tabs)} ferramentas com o nome certo no topo e sem nada mais largo que o celular {largas[:5]}")
        await pg.goto(U + "app/ferramenta.html?app=1&n=x#t=comunicacao"); await pg.wait_for_selector('#app-titulo')
        await pg.click('#tab .tabs .tab-btn >> nth=4'); await pg.wait_for_timeout(200)
        ok(await pg.evaluate("document.querySelector('#tab .tabs').scrollWidth > document.querySelector('#tab .tabs').clientWidth"), "abas internas numa linha que desliza")
        await pg.goto(U + "app/ferramenta.html?app=1&n=y#t=users"); await pg.wait_for_selector('#app-titulo')
        await pg.click('#volta-app'); await pg.wait_for_url("**/app/"); ok(True, "botão Início leva ao app")
        ok(not errs, "sem erros de JavaScript " + str(errs[:3]))
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
