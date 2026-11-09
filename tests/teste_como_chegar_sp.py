# Teste: página Como Chegar com os ônibus São Paulo ⇄ Maricá (empresa, horários nos dois sentidos, contatos e aviso para conferir).
# Rodar a partir da pasta do site:  python3 tests/teste_como_chegar_sp.py
import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT=8793
srv=subprocess.Popen(["python3","-m","http.server",str(PORT),"-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(); errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
        await pg.goto(f"http://localhost:{PORT}/como-chegar.html",wait_until="domcontentloaded")
        t=await pg.inner_text('#sao-paulo')+await pg.inner_text('#sao-paulo ~ .content-grid')
        corpo=await pg.inner_text('.container')
        ok('Viação 1001' in corpo,"empresa Viação 1001 informada")
        ok('São Paulo → Maricá' in corpo and 'Maricá → São Paulo' in corpo,"os dois sentidos aparecem")
        ok('23:00' in corpo and '07:50' in corpo and '22:15' in corpo and '07:15' in corpo,"horários de saída e chegada nos dois sentidos")
        ok('(11) 97264-5808' in corpo and '4004-5001' in corpo and '0800 941 3334' in corpo,"meios de contato com a empresa")
        ok('Confira antes de comprar' in corpo and '31/10/2026' not in corpo,"aviso para conferir, sem datas do calendário")
        ok(corpo.count('Todos os dias')==2 and 'todos os dias da semana' in corpo and 'de segunda a domingo' in corpo,"dias da semana: todos os dias, nos dois sentidos")
        ok(await pg.locator('a.quick-link-btn[href="#sao-paulo"]').count()==1,"atalho no topo leva à seção")
        ok('E15' in corpo and 'E15A' in corpo,"continua com as linhas E15 e E15A e o aplicativo EPT")
        ok(await pg.locator('a[href="https://www.1001.com.br"]').get_attribute('rel')=='noopener',"link externo com rel=noopener")
        ok(not errs,f"sem erros de JavaScript ({errs[:1]})")
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
