# Teste do botão flutuante do WhatsApp: todas as páginas com o botão usam o número central (script.js), sem o convite da Comunidade.
# Rodar a partir da pasta do site:  python3 tests/teste_whatsapp_flutuante.py
import asyncio, subprocess, time, os, glob
from playwright.async_api import async_playwright
SITE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen(["python3","-m","http.server","8777","-d",SITE],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
def ok(c,m):
    print(("OK  " if c else "FALHOU ")+m); assert c,m
async def main():
    pgs=sorted(os.path.basename(f) for f in glob.glob(SITE+'/*.html') if 'whatsapp-float' in open(f,encoding='utf-8').read())
    ok(len(pgs)>=53,f"53 páginas ou mais (inclui a Central de Ajuda) têm o botão flutuante ({len(pgs)})")
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await (await b.new_context()).new_page(); errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
        ruins=[]
        for f in pgs:
            await pg.goto("http://localhost:8777/"+f); h=await pg.get_attribute('.whatsapp-float','href')
            if not (h or '').startswith('https://wa.me/552128881830'): ruins.append((f,h))
        ok(not ruins,f"todas as {len(pgs)} páginas apontam para o número 55 21 2888-1830 ({ruins[:2]})")
        await pg.goto("http://localhost:8777/index.html"); h=await pg.get_attribute('.whatsapp-float','href'); ok('text=' in h,"a mensagem inicial é anexada pelo script central")
        # trocar o número em um único lugar muda o botão (simulação: sobrescreve a configuração antes do script rodar)
        await pg.add_init_script("Object.defineProperty(window,'PR_WHATSAPP',{configurable:true,set(v){this._w=Object.assign({},v,{numero:'5521999990000'})},get(){return this._w}})")
        await pg.goto("http://localhost:8777/index.html"); h=await pg.get_attribute('.whatsapp-float','href'); ok(h.startswith('https://wa.me/5521999990000'),"mudar só a configuração central muda o botão")
        ok(not errs,f"sem erros de JavaScript ({errs[:1]})"); await b.close()
try: asyncio.run(main())
finally: srv.terminate()
