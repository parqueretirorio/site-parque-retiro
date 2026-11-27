# Teste (27/11/2026): "Já tem cadastro? Entrar" na inscrição — volta ao formulário com os dados preenchidos; sem login segue normal.
import asyncio, subprocess, time, os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from supabase_falso import SupabaseFalso, preparar_banco, psql
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8883
URL_SB = 'https://yhzsuokwglznehvbclwd.supabase.co'
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}"
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
async def main():
    preparar_banco(); sb = SupabaseFalso(URL_SB); erros = []
    adm = sb.criar_conta('leonidasfrancaemedi@gmail.com', 'senhaLeo123', 'Leonidas França', nivel='administrador', status='aprovado', whatsapp='21999990000')
    sb.criar_conta('maria@t.com', 'senhaLeo123', 'Maria Cadastrada', status='aprovado', whatsapp='21988887777')
    CFG = {'titulo': 'Almoço', 'data_texto': 'Domingo', 'local_texto': 'Parque', 'aviso': '', 'ativo': True, 'opcoes': [{'id': 'dom', 'nome': 'Domingo', 'valor_centavos': 3500}], 'pix_chave': '+5521999175882', 'pix_nome': 'maria', 'pix_cidade': 'marica', 'vagas': None, 'prazo': None, 'resp_email': ''}
    psql("select pr_participacao_config_salvar('t1', '" + json.dumps(CFG) + "'::jsonb)::text", papel='authenticated', uid=adm)
    async with async_playwright() as p:
        br = await p.chromium.launch(); c = await br.new_context(viewport={'width': 1000, 'height': 1000}, locale='pt-BR'); await c.route(URL_SB + '/**', sb.tratar)
        pg = await c.new_page(); pg.on('pageerror', lambda x: erros.append(str(x)))
        await pg.goto(B + '/participar.html?id=t1'); await pg.wait_for_selector('#pa-nome')
        ok(await pg.locator('#pa-entrar').count() == 1 and await pg.input_value('#pa-nome') == '', "sem login: caixa 'Já tem cadastro? Entrar' e campos vazios")
        ok('não é preciso criar conta' in await pg.inner_text('#pa-app'), "avisa que quem não tem cadastro segue normalmente")
        await pg.click('#pa-entrar'); await pg.wait_for_url('**/login.html*')
        ok(await pg.evaluate("sessionStorage.getItem('pr_volta')") == 'participar.html?id=t1', "guarda para onde voltar")
        await pg.goto(B + '/login.html?servidor=1'); await pg.wait_for_selector('#e')
        await pg.fill('#e', 'maria@t.com'); await pg.fill('#s', 'senhaLeo123'); await pg.click('#f button.btn-large')
        await pg.wait_for_url('**/participar.html?id=t1', timeout=15000); await pg.wait_for_selector('#pa-nome')
        ok(await pg.input_value('#pa-nome') == 'Maria Cadastrada' and await pg.input_value('#pa-email') == 'maria@t.com' and await pg.input_value('#pa-tel') == '21988887777', "depois do login volta ao formulário com nome, e-mail e WhatsApp preenchidos")
        ok(await pg.get_attribute('#pa-email', 'readonly') is not None and await pg.locator('#pa-entrar').count() == 0, "e-mail do cadastro fixo; some o botão Entrar")
        ok('Maria Cadastrada' in await pg.inner_text('#pa-app'), "mostra quem entrou")
        await pg.fill('#pa-cep', '24900-000'); await pg.click('#pa-segue'); await pg.check('input[name=pa-rest][value=nao_vegetariano]'); await pg.click('#pa-segue')
        await pg.check('input[name=pa-opcao]'); await pg.check('#pa-ok'); await pg.click('#pa-segue'); await pg.wait_for_selector('.pa-res', timeout=8000)
        ok(psql("select email||'|'||nome from participacao_inscricoes where evento_id='t1'")[-1] == 'maria@t.com|Maria Cadastrada', "inscrição concluída com o e-mail do cadastro")
        ok(await pg.evaluate("sessionStorage.getItem('pr_volta')") is None, "retorno é usado uma vez só")
        # visitante sem cadastro continua se inscrevendo
        c2 = await br.new_context(viewport={'width': 1000, 'height': 1000}, locale='pt-BR'); await c2.route(URL_SB + '/**', sb.tratar); v = await c2.new_page()
        await v.goto(B + '/participar.html?id=t1'); await v.wait_for_selector('#pa-nome')
        await v.fill('#pa-nome', 'Visitante Novo'); await v.fill('#pa-email', 'novo@t.com'); await v.fill('#pa-tel', '21977776666'); await v.fill('#pa-cep', '24900-000'); await v.click('#pa-segue')
        await v.check('input[name=pa-rest][value=vegetariano]'); await v.click('#pa-segue'); await v.check('input[name=pa-opcao]'); await v.check('#pa-ok'); await v.click('#pa-segue'); await v.wait_for_selector('.pa-res', timeout=8000)
        ok(psql("select count(*) from participacao_inscricoes where evento_id='t1'")[-1] == '2', "visitante sem cadastro também se inscreve")
        c3 = await br.new_context(viewport={'width': 1000, 'height': 1000}, locale='es'); await c3.route(URL_SB + '/**', sb.tratar); w = await c3.new_page()
        await w.goto(B + '/participar.html?id=t1&lang=es'); await w.wait_for_selector('#pa-nome'); await w.wait_for_timeout(800); tx = await w.inner_text('#pa-app')
        ok('Tus datos' in tx and 'Nombre completo' in tx and '¿Ya tienes registro' in tx, "formulário traduzido para espanhol")
        ok(not erros, "sem erros de página: " + str(erros)); await br.close()
    srv.terminate()
asyncio.run(main())
