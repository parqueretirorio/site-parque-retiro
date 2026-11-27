# Teste (26/11/2026): inscrição em evento com contribuição — página pública, Pix, painel na área restrita, botão e banner (0027).
import asyncio, subprocess, time, os, sys, json, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from supabase_falso import SupabaseFalso, preparar_banco, psql
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8878
URL_SB = 'https://yhzsuokwglznehvbclwd.supabase.co'
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}"
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
def q(sql):
    r = psql(sql); return r[-1] if r else ''
async def main():
    preparar_banco(); sb = SupabaseFalso(URL_SB); erros = []
    sb.criar_conta('leonidasfrancaemedi@gmail.com', 'senhaLeo123', 'Leonidas França', nivel='administrador', status='aprovado', whatsapp='21999990000')
    async with async_playwright() as p:
        br = await p.chromium.launch()
        async def ctx(w=390, h=900):
            c = await br.new_context(viewport={'width': w, 'height': h}, locale='pt-BR'); await c.route(URL_SB + '/**', sb.tratar); return c
        # --- 0) sem configuração: página avisa ---
        c = await ctx(); pg = await c.new_page(); pg.on('pageerror', lambda e: erros.append(str(e)))
        await pg.goto(B + '/participar.html?id=atv1'); await pg.wait_for_timeout(1200)
        ok('não está recebendo inscrições' in await pg.inner_text('#pa-app'), "evento sem configuração: aviso claro")
        # --- 1) administrador configura pelo painel da área restrita ---
        e = await ctx(1200, 1000); ad = await e.new_page(); ad.on('pageerror', lambda x: erros.append(str(x)))
        await ad.goto(B + '/login.html?servidor=1'); await ad.wait_for_selector('#e')
        await ad.fill('#e', 'leonidasfrancaemedi@gmail.com'); await ad.fill('#s', 'senhaLeo123'); await ad.click('#f button.btn-large'); await ad.wait_for_timeout(2500)
        await ad.goto(B + '/area-restrita.html#t=atividades'); await ad.wait_for_timeout(2500)
        await ad.evaluate("""()=>{const d=window.PR_DADOS.db; d.set('atividades',[{id:'atv1',titulo:'Entre Princípios e Vivências',categoria:'evento',origem:'parque',dataAtiv:'2026-11-29',local:'Parque Retiro, Maricá/RJ',lide:'x',texto:'y',foto:'',banner:'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AL+AB//Z',bannerAlt:'b',destaque:true,autor:'Adm',status:'publicada',respEmail:'leonidasfrancaemedi@gmail.com',criadoPorEmail:'leonidasfrancaemedi@gmail.com'}]);}""")
        await ad.goto(B + '/area-restrita.html#t=atividades'); await ad.reload(); await ad.wait_for_timeout(2500)
        ok(await ad.locator('[data-part="atv1"]').count() == 1, "lista de atividades tem o botão Participação")
        await ad.click('[data-part="atv1"]'); await ad.wait_for_selector('#pa-cfg', state='attached', timeout=8000)
        ok('0' in await ad.inner_text('.pa-cards') and await ad.locator('#pc-ativo').count() == 1, "painel abre com resumo e configuração")
        await ad.evaluate("document.querySelector('details.pa-conf-det').open = true")
        await ad.check('#pc-ativo')
        await ad.fill('.pa-on', 'Domingo 29/11'); await ad.fill('.pa-ov', '35,00')
        await ad.click('#pc-add'); await ad.wait_for_timeout(200)
        await ad.locator('.pa-on').nth(1).fill('Sábado e domingo'); await ad.locator('.pa-ov').nth(1).fill('60')
        await ad.fill('#pc-k', '(21) 99917-5882'); await ad.fill('#pc-n', 'Maria da Conceição Ribeiro'); await ad.fill('#pc-c', 'Maricá')
        ok(await ad.is_checked('#pc-ativo') and await ad.input_value('#pc-k') == '(21) 99917-5882', "incluir opção não apaga o que já foi digitado")
        await ad.click('#pa-cfg button.btn-large'); await ad.wait_for_timeout(1500)
        ok('Configuração salva' in await ad.inner_text('.pa-painel'), "configuração salva pelo painel")
        ok(q("select pix_chave||'|'||pix_nome||'|'||ativo::text from participacao_eventos where id='atv1'") == '+5521999175882|MARIA DA CONCEIÇÃO RIBEIR|true', "chave normalizada (+55…) e nome para o Pix")
        ok(json.loads(q("select opcoes::text from participacao_eventos where id='atv1'"))[1]['valor_centavos'] == 6000, "valores em reais viram centavos")
        lk = await ad.input_value('#pa-lk'); ok(lk.endswith('/participar.html?id=atv1'), "link do formulário para copiar")
        # --- 2) visitante se inscreve (celular) ---
        pg = await c.new_page(); pg.on('pageerror', lambda x: erros.append(str(x)))
        await pg.goto(B + '/participar.html?id=atv1'); await pg.wait_for_selector('#pa-form', timeout=8000)
        ok('Entre Princípios e Vivências' in await pg.inner_text('#pa-titulo') and 'Domingo, 29' not in await pg.inner_text('#pa-info') and '29/11/2026' in await pg.inner_text('#pa-info'), "cabeçalho com título, data e local do evento")
        await pg.click('#pa-segue'); ok('nome e sobrenome' in await pg.inner_text('.form-erro'), "etapa 1 exige nome e sobrenome")
        await pg.fill('#pa-nome', 'Ana Souza'); await pg.fill('#pa-email', 'ana@t.com'); await pg.fill('#pa-tel', '(21) 99999-1111'); await pg.fill('#pa-cep', '24900-000')
        await pg.click('#pa-segue'); ok('Informações importantes' in await pg.inner_text('#pa-app h3'), "etapa 2: Informações importantes")
        await pg.click('#pa-segue'); ok('alimentação' in await pg.inner_text('.form-erro'), "etapa 2 exige escolher a alimentação")
        await pg.check('input[value=vegetariano]'); await pg.click('#pa-segue')
        ok('Contribuição' in await pg.inner_text('#pa-app h3') and 'R$ 35,00' in await pg.inner_text('#pa-app') and 'R$ 60,00' in await pg.inner_text('#pa-app'), "etapa 3 mostra as opções com valores")
        await pg.click('#pa-segue'); ok('escolha' in (await pg.inner_text('.form-erro')).lower(), "etapa 3 exige a opção")
        await pg.locator('input[name=pa-opcao]').first.check(); await pg.click('#pa-segue'); ok('confirmação' in await pg.inner_text('.form-erro'), "sem marcar a confirmação não conclui")
        await pg.click('#pa-volta'); await pg.click('#pa-volta'); ok(await pg.input_value('#pa-nome') == 'Ana Souza', "voltar mantém o que foi digitado")
        await pg.click('#pa-segue'); await pg.click('#pa-segue'); await pg.locator('input[name=pa-opcao]').first.check(); await pg.check('#pa-ok')
        ok('Confirmo minha participação no evento e estou ciente da contribuição' in await pg.inner_text('.pa-conf'), "texto da confirmação pedido")
        await pg.click('#pa-segue'); await pg.wait_for_selector('.pa-res', timeout=8000)
        t = await pg.inner_text('.pa-res'); cod = q("select codigo from participacao_inscricoes where email='ana@t.com'")
        extra = int(q("select extra_centavos from participacao_inscricoes where email='ana@t.com'"))
        ok(cod in t and f'R$ 35,{extra:02d}' in t and 'MARIA DA CONCEIÇÃO' in t.upper(), f"resultado mostra código, valor com centavos de identificação (35,{extra:02d}) e o recebedor")
        copia = await pg.input_value('#pa-copia')
        ok(copia.startswith('000201') and f'5405' in copia and f'35.{extra:02d}' in copia and ('PR' + cod) in copia and '+5521999175882' in copia, "Pix Copia e Cola com chave, valor e identificador")
        crc = await pg.evaluate("c => PR_PIX.crc16(c.slice(0,-4))", copia); ok(crc == copia[-4:], "CRC16 do código Pix confere")
        ok(await pg.locator('.pa-qr svg').count() == 1, "QR Code desenhado")
        await pg.click('#pa-jap'); await pg.wait_for_timeout(800)
        ok(q(f"select status from participacao_inscricoes where codigo='{cod}'") == 'informou' and 'Avisamos a equipe' in await pg.inner_text('.pa-res'), "“Já paguei” avisa a equipe")
        await pg.reload(); await pg.wait_for_selector('.pa-res', timeout=8000); ok(cod in await pg.inner_text('.pa-res'), "ao reabrir o link a pessoa vê o mesmo código e Pix")
        # segunda pessoa, presencial
        c2 = await ctx(); p2 = await c2.new_page(); await p2.goto(B + '/participar.html?id=atv1'); await p2.wait_for_selector('#pa-form')
        await p2.fill('#pa-nome', 'Bia Lima'); await p2.fill('#pa-email', 'bia@t.com'); await p2.fill('#pa-tel', '21988887777'); await p2.fill('#pa-cep', '24900000'); await p2.click('#pa-segue')
        await p2.check('input[value=nao_vegetariano]'); await p2.click('#pa-segue'); await p2.locator('input[name=pa-opcao]').nth(1).check(); await p2.check('input[value=presencial]'); await p2.check('#pa-ok'); await p2.click('#pa-segue')
        await p2.wait_for_selector('.pa-res'); ok('presencialmente' in await p2.inner_text('.pa-res') and 'R$ 60,00' in await p2.inner_text('.pa-res') and await p2.locator('#pa-copia').count() == 0, "escolha presencial: sem Pix, valor cheio")
        # --- 3) painel: confirmar pagamento, presença, CSV, totais ---
        await ad.click('#pa-rec'); await ad.wait_for_timeout(1000)
        tt = await ad.inner_text('.pa-painel'); ok('Ana Souza' in tt and 'Bia Lima' in tt and 'Disse que pagou' in tt and 'Vegetariano' in tt, "painel lista as duas inscrições com situação e alimentação")
        await ad.locator('[data-a=confirmar]').first.click(); await ad.wait_for_timeout(1000)
        ok(q(f"select status from participacao_inscricoes where codigo='{cod}'") == 'confirmado', "um clique confirma o pagamento")
        await ad.locator('[data-a=presente]').first.click(); await ad.wait_for_timeout(1000)
        cards = await ad.inner_text('.pa-cards'); ok(re.search(r'2\s*inscritos', cards) and re.search(r'1\s*presentes', cards) and re.search(r'1\s*vegetarianos', cards) and f'R$ 35,{extra:02d}' in cards, "totais: inscritos, presentes, vegetarianos e recebido")
        async with ad.expect_download() as d: await ad.click('#pa-csv')
        arq = await d.value; txt = open(await arq.path(), encoding='utf-8-sig').read()
        ok('Ana Souza' in txt and 'Bia Lima' in txt and 'Vegetariano' in txt and txt.splitlines()[0].startswith('"Código"'), "CSV com a lista completa")
        # --- 4) botão na atividade e banner do Início ---
        r = await ad.evaluate("()=>PR_SUPABASE.rpc('pr_gravar_colecao',{p_nome:'atividades',p_versao_base:0,p_dados:PR_DADOS.db.get('atividades',[])}).then(x=>x.status)"); ok(r in (200, 204), f'atividades gravadas no servidor ({r})')
        a = await (await ctx(1200, 900)).new_page(); await a.goto(B + '/atividade.html?id=atv1'); await a.wait_for_timeout(2000)
        dados = await ad.evaluate("()=>JSON.stringify(PR_DADOS.db.get('atividades',[]))"); await a.evaluate('d => localStorage.setItem("pr_atividades", d)', dados); await a.reload(); await a.wait_for_timeout(2500)
        ok(await a.locator('a[href^="participar.html?id=atv1"]').count() == 1, "página da atividade ganha o botão Quero participar")
        # banner: marcar a opção e conferir o link do Início
        await ad.evaluate("()=>{const l=window.PR_DADOS.db.get('atividades',[]); l[0].bannerParticipar=true; window.PR_DADOS.db.set('atividades',l);}")
        links = await ad.evaluate("()=>window.PR_ATIVIDADES.slidesBanner().map(s=>s.link)")
        ok(links == ['participar.html?id=atv1'], "banner do Início leva ao formulário quando marcado")
        await c.close()
        await br.close()
    ok(not erros, f"sem erros de JavaScript ({erros[:2]})")
    print("\nTODOS OS TESTES PASSARAM")
try: asyncio.run(main())
finally: srv.terminate()
