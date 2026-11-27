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
    sb.criar_conta('conceicao@t.com', 'senhaLeo123', 'Conceição Ribeiro', status='aprovado', whatsapp='21999990010')
    sb.criar_conta('ana@t.com', 'senhaLeo123', 'Ana Paula', status='aprovado', whatsapp='21999990011')
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
        # --- co-responsáveis: Conceição responsável, Ana co-responsável ---
        await ad.reload(); await ad.wait_for_timeout(2500)
        await ad.click('[data-ed="almoco-29-11-2026"]'); await ad.wait_for_selector('#at-r')
        await ad.select_option('#at-r', 'conceicao@t.com')
        ok(await ad.locator('.at-coc').count() >= 2, "campo Co-responsáveis lista as pessoas cadastradas")
        await ad.click('#at-co-s'); ok(not await ad.locator('.at-coc[value="conceicao@t.com"]').is_visible() and await ad.locator('.at-coc[value="ana@t.com"]').is_visible(), "a pessoa escolhida como responsável não aparece na lista de co-responsáveis")
        await ad.locator('.at-coc[value="ana@t.com"]').check()
        ok('1 pessoa marcada' in await ad.inner_text('#at-co-s'), "o campo mostra quantas pessoas foram marcadas")
        await ad.click('#at-form button.btn-large'); await ad.wait_for_timeout(2000)
        ok(q("select resp_email||'|'||co_emails::text from participacao_eventos where id='almoco-29-11-2026'") == 'conceicao@t.com|{ana@t.com}', "responsável e co-responsável chegam ao servidor ao salvar a atividade")
        a = (await ad.evaluate("PR_DADOS.db.get('atividades',[])"))[0]; ok(a['respEmail'] == 'conceicao@t.com' and a['coResp'] == ['ana@t.com'], "atividade guarda o responsável e o co-responsável")
        psql("update participacao_eventos set ativo=true where id='almoco-29-11-2026'")
        import json as _j
        for n, em in (('Pedro Inscrito', 'p1@t.com'), ('Maria Inscrita', 'p2@t.com')):
            psql(f"select pr_participacao_inscrever('almoco-29-11-2026','{n}','{em}','(21) 98888-7777','24900-000','vegetariano','alergia','almoco','pix',true)")
        async def abre(email):
            c = await br.new_context(viewport={'width': 1200, 'height': 1000}, locale='pt-BR'); await c.route(URL_SB + '/**', sb.tratar); pg = await c.new_page(); pg.on('pageerror', lambda x: erros.append(str(x)))
            await pg.goto(B + '/login.html?servidor=1'); await pg.wait_for_selector('#e'); await pg.fill('#e', email); await pg.fill('#s', 'senhaLeo123'); await pg.click('#f button.btn-large'); await pg.wait_for_timeout(3000)
            await pg.goto(B + '/area-restrita.html#t=atividades'); await pg.wait_for_timeout(1500); await pg.reload(); await pg.wait_for_timeout(3000); return pg
        # a lista de atividades da Ana vem do servidor (coleção); grava a coleção para as outras contas enxergarem
        r = await ad.evaluate("()=>PR_SUPABASE.rpc('pr_gravar_colecao',{p_nome:'atividades',p_versao_base:0,p_dados:PR_DADOS.db.get('atividades',[])}).then(x=>x.status)")
        an = await abre('ana@t.com'); ok(await an.locator('[data-part="almoco-29-11-2026"]').count() == 1 and await an.locator('[data-ed="almoco-29-11-2026"]').count() == 0, "a Ana vê o botão Participação, mas não Editar nem Excluir")
        await an.click('[data-part="almoco-29-11-2026"]'); await an.wait_for_selector('.pa-painel table', timeout=8000)
        tx = await an.inner_text('.pa-painel')
        ok('co-responsável' in tx and 'Pedro Inscrito' in tx and '(21) 98888-7777' in tx, "a Ana vê nome e WhatsApp dos inscritos")
        ok('p1@t.com' not in tx and '24900-000' not in tx and 'alergia' not in tx and 'Vegetariano' not in tx.split('Inscrições')[-1] and await an.locator('#pa-cfg').count() == 0 and await an.locator('#pa-csv').count() == 0, "a Ana não vê e-mail, CEP, alimentação, configuração nem CSV")
        ok(await an.locator('[data-a=cancelar]').count() == 0 and await an.locator('[data-a=confirmar]').count() == 2, "a Ana confirma pagamentos mas não cancela")
        await an.locator('[data-a=confirmar]').first.click(); await an.wait_for_timeout(1200)
        ok(q("select count(*) from participacao_inscricoes where status='confirmado'") == '1', "a Ana confirma um pagamento")
        co_ = await abre('conceicao@t.com'); await co_.click('[data-part="almoco-29-11-2026"]'); await co_.wait_for_selector('.pa-painel table', timeout=8000)
        ok('p1@t.com' in await co_.inner_text('.pa-painel') and await co_.locator('[data-a=cancelar]').count() >= 1, "a Conceição (responsável) vê todos os dados do inscrito e pode cancelar")
        cm2 = await abre('comum@t.com'); ok(await cm2.locator('[data-part]').count() == 0, "pessoa comum não vê o botão Participação")
        await br.close()
    ok(not erros, f"sem erros de JavaScript ({erros[:2]})"); print("\nTODOS OS TESTES PASSARAM")
try: asyncio.run(main())
finally: srv.terminate()
