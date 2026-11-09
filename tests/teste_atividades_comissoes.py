# Teste de Atividades (antigo Eventos), menus renomeados e páginas de Comissões.
# Rodar a partir da pasta do site:  python3 tests/teste_atividades_comissoes.py
import asyncio, subprocess, time, os, base64, io
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen(["python3","-m","http.server","8782","-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
U="http://localhost:8782/"
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
def img(w,h,cor):
    from PIL import Image
    b=io.BytesIO(); Image.new('RGB',(w,h),cor).save(b,'JPEG'); return b.getvalue()
async def aba(pg,t):
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo').click()}",t)
    await pg.evaluate("t=>{const g=document.querySelector(`[data-tab=${t}]`).closest('.area-grupo');if(g&&!g.classList.contains('aberto'))g.querySelector('.area-grupo-bt').click()}",t)
    await pg.click(f'[data-tab="{t}"]')
async def main():
    open('/tmp/_foto.jpg','wb').write(img(900,700,'green')); open('/tmp/_ban.jpg','wb').write(img(2400,900,'navy'))
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("dialog",lambda d:asyncio.ensure_future(d.accept()))
        # ---------- menus ----------
        await pg.goto(U+"index.html")
        nav=await pg.text_content('header nav')
        ok('Quem somos' in nav and 'Comece Aqui' not in nav,"menu principal: Comece Aqui virou Quem somos")
        ok('Nivelação' in nav and 'Nivelamento' not in nav,"menu Centro de Estudo > Escola: Nivelação")
        ok('Atividades' in nav and 'Eventos' in nav and 'Encontros' in nav and 'Retiros' in nav and 'Reuniões' in nav,"menu Atividades com Eventos / Encontros / Retiros / Reuniões")
        ok(await pg.evaluate("[...document.querySelectorAll('header nav a')].filter(a=>/^Eventos$/.test(a.textContent.trim())).every(a=>a.getAttribute('href')==='atividades.html?cat=evento')"),"'Eventos' só existe como tipo dentro de Atividades")
        ok('Comissões' in nav and 'Jardinagem / Área Externa' in nav and 'Comunicação, Redes Sociais e Site' in nav,"Ajude o Parque tem Comissões com as duas páginas")
        # ---------- lista vazia / voluntário preselecionado ----------
        await pg.goto(U+"atividades.html"); ok('Volte em breve' in await pg.inner_text('#atv-lista'),"lista vazia mostra aviso")
        await pg.goto(U+"eventos.html"); await pg.wait_for_url("**/atividades.html"); ok(True,"eventos.html redireciona para atividades.html")
        await pg.goto(U+"voluntario.html?area=comunicacao#voluntario-form"); await pg.wait_for_selector('#vl-form')
        ok(await pg.evaluate("[...document.querySelectorAll('[name=va]:checked')].map(i=>i.value).join()")=='Comunicação, redes sociais e site',"?area=comunicacao já marca a área")
        await pg.goto(U+"voluntario.html?area=jardinagem"); await pg.wait_for_selector('#vl-form')
        ok(await pg.evaluate("[...document.querySelectorAll('[name=va]:checked')].map(i=>i.value).join()")=='Jardinagem e área externa',"?area=jardinagem já marca a área")
        for pagina,link in [('comissoes.html',None),('comissao-jardinagem.html','voluntario.html?area=jardinagem#voluntario-form'),('comissao-comunicacao.html','voluntario.html?area=comunicacao#voluntario-form')]:
            await pg.goto(U+pagina); ok(await pg.is_visible('.page-hero'),pagina+" abre")
            if link: ok(await pg.evaluate("l=>!!document.querySelector(`a.btn-visit[href='${l}']`)",link),pagina+" tem o caminho para ser voluntário")
        # ---------- área restrita ----------
        await pg.goto(U+"login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Admin Teste'); await pg.fill('#e','a@t.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        ok(await pg.evaluate("!!document.querySelector('.area-col[data-area=com] [data-tab=atividades]')"),"Atividades está em Comissões Parque Retiro")
        ok(await pg.evaluate("!!document.querySelector('.area-col[data-area=com] [data-tab=jardinagem]') && !document.querySelector('[data-tab=jardinagem]').closest('.area-grupo')"),"Jardinagem / Área Externa direto em Comissões Parque Retiro")
        ok(await pg.evaluate("!!document.querySelector('.area-col[data-area=com] [data-tab=comunicacao]')"),"Comunicação, Redes Sociais e Site direto em Comissões")
        ok(not await pg.evaluate("!!document.querySelector('[data-tab=voluntarios]').closest('.area-grupo') === false"),"Voluntários continua no grupo Ajude o Parque")
        await aba(pg,'album'); ok('Fotos por atividade' in await pg.inner_text('#tab') and 'Fotos por evento' not in await pg.inner_text('#tab'),"Álbum: 'Fotos por atividade'")
        await aba(pg,'atividades'); await pg.click('#at-novo')
        await pg.click('#at-form button.btn-large'); ok('título' in (await pg.inner_text('#at-er')).lower(),"valida título")
        await pg.fill('#at-t','Retiro de Primavera'); await pg.select_option('#at-c','retiro'); await pg.fill('#at-d','2026-09-26')
        await pg.fill('#at-li','Dois dias de estudo e reflexão no Parque.'); await pg.fill('#at-x','Primeiro parágrafo.\n\nSegundo parágrafo com <b>tag</b> e https://exemplo.org/x')
        await pg.set_input_files('#at-f','/tmp/_foto.jpg'); await pg.wait_for_selector('#at-fp img')
        await pg.check('#at-dest'); await pg.click('#at-form button.btn-large'); ok('banner' in (await pg.inner_text('#at-er')).lower(),"destacar exige imagem do banner")
        await pg.set_input_files('#at-b','/tmp/_ban.jpg'); await pg.wait_for_selector('#at-bp img'); await pg.fill('#at-ba','Retiro de primavera no Parque')
        await pg.select_option('#at-s','publicada'); await pg.click('#at-form button.btn-large')
        a=await pg.evaluate("PR_DADOS.db.get('atividades',[])"); ok(len(a)==1 and a[0]['status']=='publicada' and a[0]['destaque'] and a[0]['autor']=='Admin Teste',"atividade gravada, publicada e com autor")
        dim=await pg.evaluate("new Promise(r=>{const i=new Image();i.onload=()=>r([i.width,i.height]);i.src=PR_DADOS.db.get('atividades',[])[0].banner})"); ok(dim[0]*1.0/dim[1]>2.99 and dim[0]*1.0/dim[1]<3.01,"banner recortado na proporção 3:1 "+str(dim))
        # segunda: externa, sem banner, rascunho -> não aparece
        await pg.click('#at-novo'); await pg.fill('#at-t','Mostra na Cidade'); await pg.select_option('#at-o','externa'); await pg.fill('#at-og','Prefeitura'); await pg.fill('#at-u','https://exemplo.org')
        await pg.fill('#at-d','2026-10-01'); await pg.fill('#at-li','Mostra com participação do Parque.'); await pg.fill('#at-x','Texto externo.'); await pg.click('#at-form button.btn-large')
        ids=await pg.evaluate("PR_DADOS.db.get('atividades',[]).map(a=>[a.id,a.titulo,a.status])"); ok(len(ids)==2 and [x for x in ids if x[1]=='Mostra na Cidade'][0][2]=='rascunho',"segunda atividade (externa) salva como rascunho")
        # ---------- público com dados ----------
        await pg.goto(U+"atividades.html"); t=await pg.inner_text('#atv-lista')
        ok('Retiro de Primavera' in t and 'Mostra na Cidade' not in t and 'leia mais' in t,"lista mostra só publicadas, com 'Clique aqui e leia mais'")
        ok(await pg.is_visible('.atv-item img.atv-img') and 'Dois dias' in t,"lista tem foto pequena, título e lide")
        await pg.goto(U+"atividades.html?cat=encontro"); ok('Ainda não há' in await pg.inner_text('#atv-lista'),"filtro por Encontros vazio")
        await pg.goto(U+"atividades.html?cat=retiro"); ok('Retiro de Primavera' in await pg.inner_text('#atv-lista'),"filtro por Retiros")
        await pg.click('.atv-mais'); await pg.wait_for_selector('#atv-artigo .atv-titulo')
        t=await pg.inner_text('#atv-artigo'); ok('Primeiro parágrafo.' in t and '<b>' in t and await pg.evaluate("!document.querySelector('.atv-corpo b')"),"artigo mostra o texto (HTML escapado)")
        ok(await pg.evaluate("!!document.querySelector('.atv-corpo a[href=\"https://exemplo.org/x\"]')"),"link no texto vira clicável")
        ok('Autor: Admin Teste' in t.replace('\n',' '),"artigo termina com o autor")
        # publica a externa e confere outras atividades clicáveis
        await pg.evaluate("(()=>{const l=PR_DADOS.db.get('atividades',[]);l.forEach(a=>a.status='publicada');PR_DADOS.db.set('atividades',l)})()")
        await pg.reload(); await pg.wait_for_selector('.atv-outras a')
        ok('Mostra na Cidade' in await pg.inner_text('.atv-outras'),"lista 'Outras atividades' no fim do artigo")
        await pg.click('.atv-outras a'); await pg.wait_for_selector('.atv-titulo'); t=await pg.inner_text('#atv-artigo')
        ok('Atividade externa' in t and 'Prefeitura' in t and await pg.is_visible('a:has-text("Mais informações")'),"atividade externa mostra selo, organizador e link")
        await pg.goto(U+"atividade.html?id=nao-existe"); ok('não foi encontrada' in await pg.inner_text('#atv-artigo'),"id inexistente mostra aviso")
        # ---------- banner do Início ----------
        await pg.goto(U+"index.html"); await pg.wait_for_selector('.pr-banner .pr-b-slide')
        n=await pg.evaluate("document.querySelectorAll('.pr-banner .pr-b-slide').length"); ok(n==2,"Início: carrossel com a imagem atual + 1 atividade em destaque (%d)"%n)
        href=await pg.evaluate("document.querySelectorAll('.pr-banner .pr-b-slide a')[0].getAttribute('href')"); ok(href.startswith('atividade.html?id='),"slide da atividade leva ao artigo")
        await pg.evaluate("document.querySelector('.pr-b-next').click()"); await pg.click('.pr-banner .pr-b-slide.on a'); await pg.wait_for_url("**/atividade.html?id=*"); ok('Retiro de Primavera' in await pg.inner_text('.atv-titulo'),"clicar no banner abre a atividade")
        ok(not errs,"sem erros de JavaScript "+str(errs))
        await b.close()
try: asyncio.run(main()); print("TUDO OK")
finally: srv.terminate()
