import asyncio, subprocess, time, os, json, zipfile, shutil
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen(["python3","-m","http.server","8768","-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
B=os.path.join(os.path.dirname(os.path.abspath(__file__)),"imagens")+"/"
async def aba(pg,t,**k):
    # CONecta Retiro: as ferramentas ficam numa caixa flutuante; abre a caixa da área e clica na ferramenta
    await pg.evaluate("t=>{const b=document.querySelector(`[data-tab=${t}]`);const c=b&&b.closest('.area-col');if(c&&!c.classList.contains('aberta')&&!document.querySelector('.areas.inicio'))c.querySelector('.area-titulo').click()}",t)
    await pg.click(f'[data-tab="{t}"]',**k)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(accept_downloads=True); await ctx.add_init_script("try{localStorage.setItem('pr_imp2611_auto','true')}catch(e){}"); pg=await ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("dialog",lambda d:asyncio.ensure_future(d.accept()))
        await pg.goto("http://localhost:8768/login.html"); await pg.click('[data-m="cadastro"]')
        await pg.fill('#n','Admin Teste'); await pg.fill('#e','a@t.com'); await pg.fill('#s','senha12345'); await pg.fill('#s2','senha12345'); await pg.fill('#w','21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        await aba(pg,'comunicacao'); await pg.click('[data-s="site"]')
        cards=await pg.eval_on_selector_all('.bn-card','c=>c.map(x=>x.querySelector("h4").innerText+" | "+x.querySelector("p").innerText.split("·").slice(1,2).join(""))')
        print(len(cards),"espaços"); print("\n".join(cards[:3])); print("...")
        # 1) fixo em o-parque (já tinha banner)
        await pg.click('[data-slug="o-parque"] [data-a="abrir"]')
        await pg.set_input_files('#up-o-parque',B+'quadrada.jpg'); await pg.wait_for_selector('.form-erro[role=alert]')
        print("ERRO esperado:",(await pg.inner_text('.form-erro[role=alert]'))[:200])
        await pg.set_input_files('#up-o-parque',B+'home.jpg'); await pg.wait_for_selector('[data-slug="o-parque"] .bn-slide')
        # 2) carrossel em doacao com 3 imagens + 1 pequena (aviso)
        await pg.click('[data-slug="doacao"] [data-a="abrir"]'); await pg.check('[data-slug="doacao"] input[value="carrossel"]')
        await pg.set_input_files('#up-doacao',[B+'ok1.jpg',B+'ok2.png',B+'ok3.jpg'])
        await pg.wait_for_function("document.querySelectorAll('[data-slug=\"doacao\"] .bn-slide').length==3")
        dims=await pg.evaluate("(async()=>{const l=PR_DADOS.db.get('site_banners',[]).find(x=>x.id==='doacao');return Promise.all(l.slides.map(s=>new Promise(r=>{const i=new Image();i.onload=()=>r(i.width+'x'+i.height);i.src=s.img})))})()"); print("DIMENSOES gravadas:",dims); assert dims==['1600x533']*3
        await pg.fill('[data-slug="doacao"] [data-i="0"] [data-f="alt"]','Banner 1'); await pg.fill('[data-slug="doacao"] [data-i="0"] [data-f="link"]','reservas.html')
        await pg.click('[data-slug="doacao"] [data-a="salvar"]')
        await pg.click('[data-slug="doacao"] [data-a="down"] >> nth=0')  # reordena
        await pg.click('[data-slug="doacao"] [data-a="prev"]'); await pg.wait_for_selector('#pv-doacao .pr-b-dot')
        print("pré-visualização: dots =",await pg.eval_on_selector_all('#pv-doacao .pr-b-dot','d=>d.length'))
        # 3) rascunho visível na página pública (logado)
        pg2=await ctx.new_page(); pg2.on("pageerror",lambda e:errs.append(str(e)))
        await pg2.goto("http://localhost:8768/doacao.html"); await pg2.wait_for_selector('.pr-banner .pr-b-dot')
        a0=await pg2.eval_on_selector('.pr-b-slide.on img','i=>i.src.slice(0,30)')
        await pg2.click('.pr-b-next'); a1=await pg2.eval_on_selector('.pr-b-slide.on img','i=>i.src.slice(0,30)')
        print("avança:",await pg2.eval_on_selector_all('.pr-b-slide','s=>s.map(x=>x.classList.contains("on"))'), "rascunho badge:",await pg2.inner_text('.pr-b-rasc'))
        # autoplay: intervalo 2s
        await pg.fill('#iv-doacao','2'); await pg.click('[data-slug="doacao"] [data-a="salvar"]')
        await pg2.reload(); await pg2.bring_to_front(); await pg2.wait_for_selector('.pr-b-dot'); print('hidden?',await pg2.evaluate('document.hidden'),'intervalo',await pg2.evaluate("JSON.parse(localStorage.pr_site_banners).find(x=>x.id==='doacao').intervalo")); i0=await pg2.eval_on_selector_all('.pr-b-slide','s=>s.findIndex(x=>x.classList.contains("on"))'); await pg2.mouse.move(5,700); await pg2.wait_for_timeout(2600); i1=await pg2.eval_on_selector_all('.pr-b-slide','s=>s.findIndex(x=>x.classList.contains("on"))'); print("autoplay",i0,"->",i1); assert i1!=i0
        # o-parque: banner fixo substituiu, h1.sr-only mantido
        await pg2.goto("http://localhost:8768/o-parque.html"); await pg2.wait_for_selector('.pr-banner img')
        print("o-parque: h1 sr-only:",await pg2.eval_on_selector_all('.pr-banner h1.sr-only','h=>h.length'),"dots:",await pg2.eval_on_selector_all('.pr-b-dot','d=>d.length'))
        # ZIP
        await pg.bind_to_front() if False else None
        async with pg.expect_download() as dl: await pg.click('#bn-zip')
        zp=await (await dl.value).path(); z=zipfile.ZipFile(zp); print("ZIP:",z.namelist(), z.testzip())
        j=json.loads(z.read('banners/banners.json')); print({k:(v['modo'],len(v['slides'])) for k,v in j['slots'].items()}); assert j['slots']['doacao']['slides'][0]['src']=='banners/doacao-1.jpg'
        # 4) público (sem login/localStorage): copia do site + pasta banners publicada
        tmp="/tmp/claude-0/pub"; shutil.rmtree(tmp,ignore_errors=True); shutil.copytree(SITE,tmp,ignore=shutil.ignore_patterns('tests','docs','supabase')); z.extractall(tmp)
        srv2=subprocess.Popen(["python3","-m","http.server","8769","-d",tmp],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
        c2=await b.new_context(); q=await c2.new_page(); q.on("pageerror",lambda e:errs.append(str(e)))
        await q.goto("http://localhost:8769/doacao.html"); await q.wait_for_selector('.pr-b-dot')
        print("PÚBLICO doacao: slides",await q.eval_on_selector_all('.pr-b-slide','s=>s.length'),"rascunho badge:",await q.eval_on_selector_all('.pr-b-rasc','x=>x.length'),"link:",await q.eval_on_selector_all('.pr-b-slide a','a=>a.map(x=>x.getAttribute("href"))'))
        await q.goto("http://localhost:8769/silo.html"); await q.wait_for_timeout(500)
        print("PÚBLICO silo (sem config) mantém banner original:",await q.eval_on_selector('.hero-banner img','i=>i.getAttribute("src")'))
        await q.goto("http://localhost:8769/partido-humanista.html"); await q.wait_for_timeout(300); print("partido (sem config): banners",await q.eval_on_selector_all('.pr-banner','x=>x.length'))
        srv2.terminate(); print("ERROS JS:",errs); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
