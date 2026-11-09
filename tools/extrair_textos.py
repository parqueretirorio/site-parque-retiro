# Extrai de TODAS as páginas públicas os textos em português que o idioma.js sabe traduzir (mesma lógica do navegador).
# Saída: i18n/_chaves.json  {texto: [páginas onde aparece]}. Rodar da pasta do site:  python3 tools/extrair_textos.py
import asyncio, subprocess, time, os, json, glob
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT=8795
srv=subprocess.Popen(["python3","-m","http.server",str(PORT),"-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
async def main():
    pgs=[f for f in sorted(os.listdir(SITE)) if f.endswith('.html') and 'idioma.js' in open(os.path.join(SITE,f),encoding='utf-8').read()]
    out={}
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page()
        for f in pgs:
            await pg.goto(f"http://localhost:{PORT}/{f}",wait_until="domcontentloaded"); await pg.wait_for_timeout(500)
            for k in await pg.evaluate("PR_IDIOMA.coletar()"): out.setdefault(k,[]).append(f)
        await b.close()
    json.dump(out,open(os.path.join(SITE,'i18n','_chaves.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=0)
    print(len(pgs),'páginas;',len(out),'textos únicos;',sum(len(k) for k in out),'caracteres')
try: asyncio.run(main())
finally: srv.terminate()
