# Teste do app CONecta Retiro (Fase 2, bloco 1) contra o PostgreSQL local com as migrações do Supabase.
# Rodar a partir da pasta do site:  python3 tests/teste_app_bloco1.py   (precisa do PostgreSQL 16 local ligado)
import asyncio, subprocess, time, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from supabase_falso import SupabaseFalso, preparar_banco, psql

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8853
URL_SB = 'https://yhzsuokwglznehvbclwd.supabase.co'
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}"; OUT = os.environ.get('SHOTS', '/tmp')
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m

async def main():
    preparar_banco()
    sb = SupabaseFalso(URL_SB)
    sb.criar_conta('leonidasfrancaemedi@gmail.com', 'senhaLeo123', 'Leonidas França', nivel='administrador', status='aprovado', whatsapp='21999990000')
    sb.criar_conta('beto@x.com', 'senhaBeto123', 'Beto Silva', nivel='leitor', status='aprovado', funcoes=['jardinagem'], whatsapp='21988887777')
    sb.criar_conta('cida@x.com', 'senhaCida123', 'Cida Souza', whatsapp='21977776666')  # pendente
    hoje = time.strftime('%Y-%m-%d')
    psql("select 1", 'prt_teste')
    async with async_playwright() as p:
        br = await p.chromium.launch()
        ctx = await br.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        await ctx.route(URL_SB + '/**', sb.tratar)
        pg = await ctx.new_page(); erros = []; pg.on('pageerror', lambda e: erros.append(str(e)))

        await pg.goto(B + '/app/?servidor=1')
        ok(await pg.locator('#fe').count() == 1, "app abre na tela Entrar")
        ok(await pg.evaluate("!!document.querySelector('link[rel=manifest]')") and await pg.locator('#ajuda').is_visible(), "app instalável e com 'Preciso de ajuda' à vista")
        ok(await pg.locator('.instalar img').count() == 1 and 'Tenha o app no celular' in await pg.inner_text('.instalar'), "ao abrir o app aparece o aviso de instalar, com o ícone")
        ok('versão 1.1.1' in await pg.inner_text('.versao'), "versão do app à vista")
        await pg.screenshot(path=OUT + '/app-1-entrar.png', full_page=True)
        await pg.click('#fecha-instalar'); ok(await pg.locator('.instalar').count() == 0, "'Agora não' esconde o aviso de instalar")
        # aviso de atualização quando há versão nova publicada
        await ctx.route('**/app/versao.json*', lambda r: r.fulfill(status=200, content_type='application/json', body='{"versao":"1.2.0","data":"2026-11-20","novidades":["Telas do Alojamento"]}'))
        await pg.reload(); await pg.wait_for_selector('.atualizar')
        ok('Nova versão 1.2.0' in await pg.inner_text('.atualizar') and await pg.locator('#bt-atualizar').count() == 1, "aviso de nova versão com botão Atualizar agora")
        await pg.screenshot(path=OUT + '/app-1b-atualizar.png')
        await ctx.unroute('**/app/versao.json*')
        # página Entrar do site: ícone do app, versão e botão Baixar o app
        await pg.goto(B + '/login.html'); await pg.wait_for_function("document.getElementById('app-ver').textContent.includes('11/11/2026')")
        ok(await pg.locator('#app-promo img').count() == 1 and 'Versão 1.1.1' in await pg.inner_text('#app-promo') and await pg.locator('#app-promo a[href="app/"]').count() == 1, "página Entrar do site mostra o app, a versão e 'Baixar o app'")
        await pg.screenshot(path=OUT + '/app-0-login-site.png', full_page=True)
        await pg.goto(B + '/app/?servidor=1'); await pg.wait_for_selector('#fe')
        await pg.fill('#e', 'cida@x.com'); await pg.fill('#s', 'senhaCida123'); await pg.click('#be')
        await pg.wait_for_function("document.querySelector('#er') && !document.querySelector('#er').hidden"); ok('aprovação' in await pg.inner_text('#er'), "cadastro pendente não entra no app")
        await pg.fill('#e', 'leonidasfrancaemedi@gmail.com'); await pg.fill('#s', 'senhaLeo123'); await pg.click('#be')
        await pg.wait_for_selector('.topo-ola', timeout=10000)
        t = await pg.inner_text('#tela')
        ok('Olá, Leonidas!' in t and 'Minhas responsabilidades' in t and 'Para toda a equipe' in t, "Início do administrador")
        ok(await pg.locator('.linha:has-text("Gestão de Responsáveis") .selo').inner_text() == '1', "Início mostra 1 cadastro aguardando aprovação")
        await pg.screenshot(path=OUT + '/app-2-inicio.png', full_page=True)

        # dados para a biblioteca e a agenda
        await pg.evaluate(f"""()=>{{PR_DADOS.db.set('livros',[{{id:'l1',titulo:'Humanizar a Terra',autor:'Silo',exemplares:1}},{{id:'l2',titulo:'O Olhar Interno',autor:'Silo',exemplares:1}}]);
          PR_DADOS.db.set('emprest',[{{id:'e1',livro:'l1',nome:'Leonidas França',saida:'{hoje}',prevista:'2026-12-31',devolvido:''}}]);
          PR_DADOS.db.set('ativ',[{{id:'a1',titulo:'Mutirão de jardinagem',data:'{hoje}',hora:'09:00',local:'Parque'}}]);}}""")
        await pg.wait_for_function("PR_DADOS.estadoSync().pendentes===0", timeout=10000)
        await pg.click('a.cartao[href="#agenda"]'); await pg.wait_for_selector('.topo h1:has-text("Avisos e agenda")')
        t = await pg.inner_text('#tela'); ok('Mutirão de jardinagem' in t and 'Hoje' in t, "Avisos e agenda mostra a atividade de hoje")
        await pg.screenshot(path=OUT + '/app-3-agenda.png', full_page=True)
        await pg.click('.voltar'); await pg.click('a.cartao[href="#biblioteca"]'); await pg.wait_for_selector('.topo h1:has-text("Biblioteca")')
        t = await pg.inner_text('#tela'); ok('Devolver até 31/12/2026' in t, "Biblioteca: livro comigo com data de devolução")
        await pg.fill('#bb', 'olhar'); t = await pg.inner_text('#res'); ok('O Olhar Interno' in t and 'Humanizar' not in t and 'Disponível' in t, "Biblioteca: busca por título")
        await pg.screenshot(path=OUT + '/app-4-biblioteca.png', full_page=True)
        await pg.click('.voltar'); await pg.click('a[href="#areas"]'); await pg.wait_for_selector('.topo h1:has-text("Todas as áreas")')
        t = await pg.inner_text('#tela'); ok('Comissões Parque Retiro' in t and 'Administração' in t, "Todas as áreas: Comissões e Administração")
        await pg.screenshot(path=OUT + '/app-5-areas.png', full_page=True)
        # abre a ferramenta completa na área restrita, já na aba certa, com Voltar ao app
        await pg.click('.linha:has-text("Gestão de Responsáveis")'); await pg.wait_for_url('**/area-restrita.html?app=1#t=users', timeout=10000)
        await pg.wait_for_selector('#volta-app'); ok(await pg.evaluate("document.body.classList.contains('modo-app')") and 'Cida Souza' in await pg.inner_text('#tab'), "ferramenta abre direto (Gestão de Responsáveis) em modo app")
        await pg.screenshot(path=OUT + '/app-6-ferramenta.png')
        await pg.click('#volta-app'); await pg.wait_for_selector('.topo-ola'); ok(True, "Voltar ao app")
        # sair
        await pg.click('#sair'); await pg.wait_for_selector('#fe', timeout=10000); ok(True, "Sair volta para Entrar")

        # leitor com uma função: só a responsabilidade dele, sem Administração
        await pg.fill('#e', 'beto@x.com'); await pg.fill('#s', 'senhaBeto123'); await pg.click('#be'); await pg.wait_for_selector('.topo-ola', timeout=10000)
        t = await pg.inner_text('#tela'); ok('Jardinagem' in t and 'Gestão de Responsáveis' not in t, "leitor vê só a própria responsabilidade")
        await pg.click('a[href="#areas"]'); await pg.wait_for_selector('.topo h1:has-text("Todas as áreas")'); ok('Mapa de Contas' not in await pg.inner_text('#tela'), "leitor não vê ferramentas da administração")
        ok(not erros, "sem erros de JavaScript " + str(erros))
        await br.close()
try:
    asyncio.run(main())
finally:
    srv.terminate()
