# Teste (26/11/2026): botão "Cadastrar esta atividade" (almoço de 29/11) em Atividades, com a inscrição já configurada (inativa até confirmar o Pix).
import asyncio, subprocess, time, os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from supabase_falso import SupabaseFalso, preparar_banco, psql
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8879
URL_SB = 'https://yhzsuokwglznehvbclwd.supabase.co'
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}"
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
def q(s): r = psql(s); return r[-1] if r else ''
async def main():
    preparar_banco(); sb = SupabaseFalso(URL_SB); erros = []
    sb.criar_conta('leonidasfrancaemedi@gmail.com', 'senhaLeo123', 'Leonidas França', nivel='administrador', status='aprovado', whatsapp='21999990000')
    sb.criar_conta('comum@t.com', 'senhaLeo123', 'Pessoa Comum', status='aprovado', whatsapp='21999990001')
    async with async_playwright() as p:
        br = await p.chromium.launch()
        async def entra(email):
            c = await br.new_context(viewport={'width': 1200, 'height': 1000}, locale='pt-BR'); await c.route(URL_SB + '/**', sb.tratar)
            pg = await c.new_page(); pg.on('pageerror', lambda x: erros.append(str(x)))
            await pg.goto(B + '/login.html?servidor=1'); await pg.wait_for_selector('#e'); await pg.fill('#e', email); await pg.fill('#s', 'senhaLeo123'); await pg.click('#f button.btn-large'); await pg.wait_for_timeout(3000)
            await pg.goto(B + '/area-restrita.html#t=atividades'); await pg.wait_for_timeout(1500); await pg.reload(); await pg.wait_for_timeout(3000); return pg
        cm = await entra('comum@t.com'); ok(await cm.locator('#at-almoco').count() == 0, "pessoa comum não vê o botão da atividade pronta")
        ad = await entra('leonidasfrancaemedi@gmail.com'); ok(await ad.locator('#at-almoco').count() == 1, "administrador vê o botão")
        await ad.click('#at-almoco'); await ad.wait_for_timeout(1800)
        a = await ad.evaluate("PR_DADOS.db.get('atividades',[])"); ok(len(a) == 1 and a[0]['status'] == 'publicada' and a[0]['dataAtiv'] == '2026-11-29' and a[0]['bannerParticipar'] and 'R$ 35,00' in a[0]['texto'], "atividade cadastrada, publicada, com o texto do briefing")
        ok(await ad.locator('#at-almoco').count() == 0, "o botão some depois de cadastrar (não duplica)")
        ok(q("select ativo::text||'|'||pix_chave||'|'||(opcoes->0->>'valor_centavos') from participacao_eventos where id='almoco-29-11-2026'") == 'false|+5521999175882|3500', "inscrição pré-configurada (R$ 35,00, Pix) e ainda inativa")
        await ad.click('[data-part="almoco-29-11-2026"]'); await ad.wait_for_selector('#pc-ativo', state='attached'); await ad.evaluate("document.querySelector('details.pa-conf-det').open = true")
        await ad.check('#pc-ativo'); await ad.click('#pa-cfg button.btn-large'); await ad.wait_for_timeout(1500)
        ok(q("select ativo::text from participacao_eventos where id='almoco-29-11-2026'") == 'true', "um clique em “Receber inscrições” ativa o formulário")
        await br.close()
    ok(not erros, f"sem erros de JavaScript ({erros[:2]})"); print("\nTODOS OS TESTES PASSARAM")
try: asyncio.run(main())
finally: srv.terminate()
