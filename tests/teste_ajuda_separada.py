# Teste: a Central pública não mostra ajuda da área restrita (nem para quem está logado); a Central da área restrita mostra; o botão Ajuda da área restrita leva a ela.
import subprocess,time,sys
from playwright.sync_api import sync_playwright
srv=subprocess.Popen(['python3','-m','http.server','8777'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
U='http://localhost:8777/'; f=0
def ok(c,m):
    global f; print(('OK  ' if c else 'FALHOU ')+m); f+=(not c)
try:
    with sync_playwright() as p:
        b=p.chromium.launch(); ctx=b.new_context(); pg=ctx.new_page()
        ids="()=>PR_AJUDA.conteudo().artigos.map(a=>a.id)"
        # visitante, Central pública
        pg.goto(U+'ajuda.html?lang=pt'); pg.wait_for_selector('#central-ajuda .pr-aj-grade, #central-ajuda a'); 
        t=pg.inner_text('#central-ajuda'); ok('Prestação de Contas' not in t and 'Backup e restauração' not in t,'visitante: Central pública sem artigos da área restrita')
        # logado (sessão simulada), Central pública
        pg.evaluate("sessionStorage.setItem('pr_sess','1')"); pg.goto(U+'ajuda.html?lang=pt'); pg.wait_for_selector('#central-ajuda a')
        t=pg.inner_text('#central-ajuda'); ok('Prestação de Contas' not in t and 'Backup e restauração' not in t and 'Ferramentas das comissões' not in t,'logado: Central pública continua sem a ajuda da área restrita')
        pg.goto(U+'ajuda.html?lang=pt&a=prestacao-contas'); pg.wait_for_timeout(800)
        ok('Prestação de Contas: lançamentos' not in pg.inner_text('#central-ajuda'),'logado: artigo da área restrita não abre na Central pública')
        # Central da área restrita
        pg.goto(U+'ajuda-area-restrita.html?lang=pt'); pg.wait_for_selector('#central-ajuda a')
        t=pg.inner_text('#central-ajuda'); ok('Ferramentas das comissões' in t and 'Administração e finanças' in t,'logado: Central da área restrita mostra as categorias da área restrita')
        pg.goto(U+'ajuda-area-restrita.html?lang=pt&a=prestacao-contas'); pg.wait_for_timeout(800)
        ok('Prestação de Contas' in pg.inner_text('#central-ajuda'),'logado: artigo da área restrita abre na Central da área restrita')
        # visitante na Central da área restrita
        pg.evaluate("sessionStorage.clear()"); pg.goto(U+'ajuda-area-restrita.html?lang=pt'); pg.wait_for_timeout(800)
        t=pg.inner_text('#central-ajuda'); ok('Entre na área restrita' in t and 'Prestação de Contas' not in t,'visitante: Central da área restrita pede o login e não mostra nada')
        ok(pg.locator('meta[name=robots][content=noindex]').count()==1,'Central da área restrita com noindex')
        # botão Ajuda no site público e na área restrita
        pg.goto(U+'index.html'); pg.wait_for_selector('#pr-aj-botao',state='attached'); ok(pg.get_attribute('#pr-aj-botao','href').endswith('ajuda.html'),'site público: botão Ajuda leva à Central pública')
        # a página do painel usa data-page="painel": é isso que faz o botão Ajuda apontar para a Central da área restrita (a página em si exige login e não abre sem sessão real)
        ok('<body data-page="painel">' in open('area-restrita.html',encoding='utf-8').read(),'área restrita: página marcada como painel (botão Ajuda leva à Central da área restrita)')
finally:
    srv.terminate()
sys.exit(1 if f else 0)
