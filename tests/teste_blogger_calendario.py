# Teste: Dia do Testemunho (4 de maio, todos os anos) no calendário de uso e página Blogger com matérias selecionadas da Pressenza.
# Rodar a partir da pasta do site:  python3 tests/teste_blogger_calendario.py
import subprocess, time, os
from playwright.sync_api import sync_playwright
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8798
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
U = f"http://localhost:{PORT}/"
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_context().new_page(); errs = []; ext = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("request", lambda r: ext.append(r.url) if not r.url.startswith(U) and not r.url.startswith("data:") and 'cdnjs' not in r.url and 'fonts.' not in r.url else None)
        pg.goto(U + "calendario.html", wait_until="domcontentloaded")
        for ano in (2026, 2027, 2031):
            pg.select_option('#cal-ano', str(ano)) if ano <= pg.evaluate("new Date().getFullYear()") + 3 else pg.evaluate(f"irPara({ano}, 4)")
            pg.select_option('#cal-mes', '4') if ano <= pg.evaluate("new Date().getFullYear()") + 3 else None
            pg.wait_for_timeout(150)
            cel = pg.locator(f'.cal-day[data-data="{ano}-05-04"]')
            ok(cel.count() == 1 and 'Dia do Testemunho' in cel.inner_text(), f"{ano}: 4 de maio mostra Dia do Testemunho")
            ok(pg.locator(f'.cal-day[data-data="{ano}-05-05"] .cal-data').count() == 0, f"{ano}: outros dias sem data comemorativa")
        pg.select_option('#cal-ano', '2026'); pg.select_option('#cal-mes', '4'); pg.click('.cal-day[data-data="2026-05-04"]')
        ok(pg.is_visible('#dia-data') and 'Dia do Testemunho' in pg.inner_text('#dia-data'), "detalhe do dia mostra a data comemorativa")
        pg.click('.cal-day[data-data="2026-05-06"]'); ok(pg.is_hidden('#dia-data'), "dia comum esconde a linha de data comemorativa")
        pg.goto(U + "calendario.html?lang=en", wait_until="domcontentloaded"); pg.select_option('#cal-mes', '4'); pg.select_option('#cal-ano', '2026'); pg.wait_for_timeout(400)
        ok('Day of Testimony' in pg.inner_text('.cal-day[data-data="2026-05-04"]'), "em inglês: Day of Testimony")
        pg.goto(U + "blogger.html?lang=pt", wait_until="domcontentloaded")
        ok(pg.locator('.blog-card').count() == 10, "Blogger mostra 10 matérias")
        ok(all(h.startswith('https://www.pressenza.com/') for h in pg.eval_on_selector_all('.blog-card a', 'a=>a.map(x=>x.href)')), "cada matéria leva à fonte original na Pressenza")
        ok(pg.locator('.blog-card:has-text("Fonte: Pressenza")').count() == 10, "todas creditam a fonte")
        pg.click('.blog-filtro[data-f="clima"]'); ok(pg.locator('.blog-card:visible').count() == 2, "filtro Clima mostra 2")
        pg.click('.blog-filtro[data-f=""]'); ok(pg.locator('.blog-card:visible').count() == 10, "Todas volta a mostrar 10")
        pg.goto(U + "blogger.html?lang=fr", wait_until="domcontentloaded"); pg.wait_for_timeout(500)
        ok('Lire l' in pg.inner_text('.blog-card >> nth=0') and 'Source' in pg.inner_text('.blog-card >> nth=0'), "interface do Blogger traduzida (FR)")
        ok(pg.evaluate("document.querySelector('.blog-card h3').getAttribute('lang')") == 'pt-BR', "título da matéria continua no original")
        ok(not errs, f"sem erros de JavaScript {errs}"); ok(not ext, f"nenhuma requisição externa {ext}")
        b.close()
finally:
    srv.kill()
