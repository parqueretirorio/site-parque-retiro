# Teste (27/11/2026): atividade com banner do computador (3:1) e banner opcional para celular (4:3).
import asyncio, subprocess, time, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from supabase_falso import SupabaseFalso, preparar_banco
from PIL import Image
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8882
URL_SB = 'https://yhzsuokwglznehvbclwd.supabase.co'
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}"
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
Image.new('RGB', (1599, 533), (30, 120, 40)).save('/tmp/bn_pc.jpg'); Image.new('RGB', (1200, 900), (200, 160, 20)).save('/tmp/bn_cel.jpg')
async def main():
    preparar_banco(); sb = SupabaseFalso(URL_SB); erros = []
    sb.criar_conta('leonidasfrancaemedi@gmail.com', 'senhaLeo123', 'Leonidas França', nivel='administrador', status='aprovado', whatsapp='21999990000')
    async with async_playwright() as p:
        br = await p.chromium.launch(); c = await br.new_context(viewport={'width': 1200, 'height': 1000}, locale='pt-BR'); await c.route(URL_SB + '/**', sb.tratar)
        pg = await c.new_page(); pg.on('pageerror', lambda x: erros.append(str(x)))
        await pg.goto(B + '/login.html?servidor=1'); await pg.wait_for_selector('#e'); await pg.fill('#e', 'leonidasfrancaemedi@gmail.com'); await pg.fill('#s', 'senhaLeo123'); await pg.click('#f button.btn-large'); await pg.wait_for_timeout(3000)
        await pg.goto(B + '/area-restrita.html#t=atividades'); await pg.wait_for_timeout(1500); await pg.reload(); await pg.wait_for_timeout(3000)
        await pg.click('#at-novo'); await pg.wait_for_selector('#at-bm')
        await pg.fill('#at-t', 'Almoço teste'); await pg.fill('#at-li', 'Lide do teste.'); await pg.fill('#at-x', 'Texto do teste.')
        await pg.set_input_files('#at-b', '/tmp/bn_pc.jpg'); await pg.wait_for_selector('#at-bp img')
        await pg.set_input_files('#at-bm', '/tmp/bn_cel.jpg'); await pg.wait_for_selector('#at-bmp img')
        ok(await pg.locator('#at-bmx').count() == 1, "prévia do banner do celular com botão remover")
        await pg.fill('#at-ba', 'Banner do almoço'); await pg.check('#at-dest') if await pg.locator('#at-dest').count() else None
        await pg.click('#at-form button.btn-large'); await pg.wait_for_timeout(2000)
        a = (await pg.evaluate("PR_DADOS.db.get('atividades',[])"))[0]
        ok(a['banner'].startswith('data:image') and a['bannerM'].startswith('data:image'), "atividade guarda banner e banner do celular")
        dims = await pg.evaluate("""()=>Promise.all([PR_DADOS.db.get('atividades',[])[0]].map(a=>Promise.all([a.banner,a.bannerM].map(s=>new Promise(r=>{const i=new Image();i.onload=()=>r([i.width,i.height]);i.src=s;})))))""")
        ok(dims[0][0][0] / dims[0][0][1] > 2.9 and abs(dims[0][1][0] / dims[0][1][1] - 4 / 3) < 0.01 and dims[0][1][0] == 1200, "banner 3:1 e celular 4:3 (1200 px)")
        await pg.evaluate("(()=>{const l=PR_DADOS.db.get('atividades',[]);l[0].destaque=true;l[0].status='publicada';PR_DADOS.db.set('atividades',l)})()")
        s = await pg.evaluate("PR_ATIVIDADES.slidesBanner()")
        ok(len(s) == 1 and s[0]['mobile'].startswith('data:image'), "slide do Início leva a imagem do celular")
        ok(not erros, "sem erros: " + str(erros)); await br.close()
    srv.terminate()
asyncio.run(main())
