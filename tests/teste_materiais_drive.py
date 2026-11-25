"""Teste dos materiais no Drive: cada link das páginas aponta para baixar.html?arquivo=NOME,
e baixar.html leva ao endereço certo do Drive (ou mostra 'em breve' quando não há endereço)."""
import re, glob, http.server, threading, functools, os, sys, urllib.parse as u
from playwright.sync_api import sync_playwright

RAIZ = os.path.join(os.path.dirname(__file__), '..')
h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=RAIZ)
h.log_message = lambda *a, **k: None
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), h)
threading.Thread(target=srv.serve_forever, daemon=True).start()
B = 'http://127.0.0.1:%d/' % srv.server_address[1]
falhas = []
def ok(c, m):
    print(('OK   ' if c else 'FALHA ') + m)
    if not c: falhas.append(m)

# 1) nenhum link antigo sobrou; todo link novo tem arquivo na agenda
alvos = ['nivelamento.html', 'centro-estudo.html'] + glob.glob(os.path.join(RAIZ, 'i18n', '*.js'))
velhos = sum(len(re.findall(r'wp-content', open(os.path.join(RAIZ, f) if not os.path.isabs(f) else f, encoding='utf8').read())) for f in alvos)
ok(velhos == 0, 'nenhum link wp-content restante (%d)' % velhos)
nomes = set()
for f in alvos:
    s = open(os.path.join(RAIZ, f) if not os.path.isabs(f) else f, encoding='utf8').read()
    nomes |= {u.unquote(x) for x in re.findall(r'baixar\.html\?arquivo=([^"\'\s<>\\]+)', s)}
ok(len(nomes) == 95, '95 nomes distintos nos links (%d)' % len(nomes))

with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page()
    pg.goto(B + 'materiais.js'.replace('materiais.js', 'baixar.html?arquivo=x'))
    pg.wait_for_timeout(200)
    perdidos = [n for n in nomes if not pg.evaluate('n => window.PR_MATERIAIS.url(n)', n)]
    ok(not perdidos, 'todo nome tem endereço na agenda %s' % perdidos[:3])
    # 2) redireciona para o Drive (intercepta a navegação)
    destinos = []
    pg.route('https://drive.google.com/**', lambda r: (destinos.append(r.request.url), r.fulfill(status=200, body='ok')))
    pg.goto(B + 'baixar.html?arquivo=' + u.quote('08_as_falsas_esperanças.mp3'))
    pg.wait_for_timeout(1200)
    ok(destinos and destinos[0] == 'https://drive.google.com/file/d/1OfdJUbA8Clfo45Dq7-IA_-JCI6_t1_74/view', 'áudio 08 abre o endereço do Drive: %s' % destinos[:1])
    # 3) arquivo desconhecido e endereço vindo da barra não são abertos
    for q in ['nao_existe.pdf', 'https://evil.example/x', '']:
        destinos.clear()
        pg.goto(B + 'baixar.html?lang=pt&arquivo=' + u.quote(q)); pg.wait_for_timeout(700)
        ok(not destinos and pg.url.startswith(B + 'baixar.html') and 'Em breve' in pg.text_content('#titulo'), 'sem endereço mostra "Em breve": %r' % q)
    # 4) idioma
    pg.goto(B + 'baixar.html?lang=en&arquivo=zzz'); pg.wait_for_timeout(300)
    ok('Coming soon' in pg.text_content('#titulo'), 'mensagem em inglês')
    # 5) páginas: links novos presentes, em português e traduzidos
    for pagina in ['nivelamento.html', 'centro-estudo.html']:
        for lang in ['pt', 'en', 'es']:
            pg.goto(B + pagina + '?lang=' + lang); pg.wait_for_timeout(900)
            hrefs = pg.eval_on_selector_all('a[href*="baixar.html"]', 'els => els.map(e => e.getAttribute("href"))')
            ok(len(hrefs) >= 40, '%s [%s]: %d links para baixar.html' % (pagina, lang, len(hrefs)))
    b.close()
srv.shutdown()
print('\nFALHAS: %d' % len(falhas)); sys.exit(1 if falhas else 0)
