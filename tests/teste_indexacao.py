# Teste: páginas não públicas com noindex; sitemap sem elas; Ajuda por último no menu; nada chamado blogger no site.
import re,glob,sys
f=0
def ok(c,m):
    global f
    print(('OK  ' if c else 'FALHA ')+m); f+= (not c)
sm=open('sitemap.xml',encoding='utf-8').read()
urls=re.findall(r'<loc>https://parqueretiro.org.br/([^<]*)</loc>',sm)
for p in 'area-restrita login cadastro-wifi atividade pagar descadastro baixar ajuda ajuda-area-restrita noticias-conecta calendario'.split():
    t=open(p+'.html',encoding='utf-8').read()
    ok(re.search(r'<meta name="robots" content="noindex',t) is not None,p+': noindex')
    ok(p+'.html' not in urls,p+': fora do sitemap')
for p in urls:
    if p.endswith('.html'):
        t=open(p,encoding='utf-8').read()
        ok('noindex' not in t,p+': no sitemap e sem noindex')
rob=open('robots.txt').read()
for p in ('ajuda','noticias-conecta','calendario'):
    ok(p not in rob,p+': fora do robots.txt (senão o Google não veria o noindex)')
for p in ('blog.html','blog-escola-parque-dos-sonhos.html','ajuda-conteudo.js'):
    ok('Blogger' not in open(p,encoding='utf-8').read(),p+': sem "Blogger"')
sys.exit(1 if f else 0)
