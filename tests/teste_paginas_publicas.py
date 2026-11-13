# Teste (13/11/2026): páginas ABERTAS do site ligadas ao servidor (migração 0011), contra o PostgreSQL local.
#  - a equipe gera as vitrines (só o publicado, sem dados pessoais);
#  - quem visita o site lê as vitrines e não lê mais nada;
#  - Comunicado, descadastro, voluntário e fotos vão para a caixa de entrada;
#  - a equipe, ao abrir a área restrita, recolhe a caixa para as coleções.
import asyncio, subprocess, time, os, sys, json, base64
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from supabase_falso import SupabaseFalso, preparar_banco, psql, ErroBanco
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8859
URL_SB = 'https://yhzsuokwglznehvbclwd.supabase.co'
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}"
PNG = '/tmp/foto_teste.png'
open(PNG, 'wb').write(base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADq0bDNBYAAAAAElFTkSuQmCC'))
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
def banco(sql):
    return psql(sql)[-1] if psql(sql) else ''

async def entrar(pg, e, s):
    await pg.goto(B + '/login.html?servidor=1'); await pg.wait_for_selector('#e')
    await pg.fill('#e', e); await pg.fill('#s', s); await pg.click('#f button.btn-large')
    await pg.wait_for_url('**/area-restrita.html*', timeout=15000); await pg.wait_for_timeout(2500)

async def main():
    preparar_banco(); sb = SupabaseFalso(URL_SB)
    sb.criar_conta('leonidasfrancaemedi@gmail.com', 'senhaLeo123', 'Leonidas França', nivel='administrador', status='aprovado', whatsapp='21999990000')
    async with async_playwright() as p:
        br = await p.chromium.launch()
        eq = await br.new_context(viewport={'width': 1280, 'height': 900}, locale='pt-BR'); await eq.route(URL_SB + '/**', sb.tratar)
        pg = await eq.new_page(); erros = []; pg.on('pageerror', lambda e: erros.append(str(e)))
        # 1) equipe: atividade publicada e rascunho, foto publicada (com e-mail) e pendente, nomes da Estela
        await entrar(pg, 'leonidasfrancaemedi@gmail.com', 'senhaLeo123')
        await pg.evaluate("""()=>{const db=PR_DADOS.db;
          db.set('atividades',[{id:'a1',titulo:'Encontro de Verão',categoria:'evento',status:'publicada',lide:'L',texto:'T',dataAtiv:'2026-12-20',respEmail:'beto@x.com',criadoPorEmail:'beto@x.com',autor:'Beto'},{id:'a2',titulo:'Rascunho secreto',status:'rascunho',respEmail:'x@x.com'}]);
          db.set('album',[{id:'f1',foto:'data:image/png;base64,AAAA',status:'publicada',email:'foto@x.com',autor:'Ana',mostrarAutor:false,evento:'',data:'2026-11-10'},{id:'f2',foto:'data:image/png;base64,BBBB',status:'pendente',email:'',autor:'Zé'}]);
          db.set('estela',[{id:'e1',nome:'Silo',pub:true},{id:'e2',nome:'Nome escondido',pub:false}]);
          db.set('contatos',[{id:'c0',lista:'aderente',email:'velho@x.com',nome:'Velho',ativo:true}]);}""")
        await pg.wait_for_timeout(2500)
        v = json.loads(banco("select dados::text from registros where colecao='pub_atividades' and id='_'"))
        ok([a['id'] for a in v] == ['a1'] and 'respEmail' not in v[0] and 'criadoPorEmail' not in v[0], "vitrine de atividades: só a publicada, sem e-mails")
        v = json.loads(banco("select dados::text from registros where colecao='pub_album' and id='_'"))
        ok([f['id'] for f in v] == ['f1'] and 'email' not in v[0] and 'autor' not in v[0], "vitrine de fotos: só a publicada, sem e-mail e sem autor que não quis aparecer")
        v = json.loads(banco("select dados::text from registros where colecao='pub_estela' and id='_'"))
        ok(v == [{'id': 'e1', 'nome': 'Silo'}], "vitrine da Estela: só os nomes liberados")
        # 2) visitante sem login: só lê vitrines
        vi = await br.new_context(viewport={'width': 390, 'height': 844}, locale='pt-BR'); await vi.route(URL_SB + '/**', sb.tratar)
        q = await vi.new_page(); q.on('pageerror', lambda e: erros.append('visitante: ' + str(e)))
        await q.goto(B + '/atividades.html?servidor=1'); await q.wait_for_timeout(800)
        t = await q.inner_text('main') if await q.locator('main').count() else await q.inner_text('body')
        ok('Encontro de Verão' in t and 'Rascunho secreto' not in t, "site aberto mostra a atividade publicada (vinda do servidor)")
        ok(await q.evaluate("PR_DADOS.modo") == 'vitrine', "site aberto em modo vitrine")
        await q.goto(B + '/estela-virtual.html'); await q.wait_for_timeout(600)
        t = await q.inner_text('#nomes'); ok('Silo' in t and 'escondido' not in t, "Estela mostra só os nomes liberados")
        try:
            psql("select pr_ler_publico(array['atividades','contatos'])", papel='anon'); r = psql("select pr_ler_publico(array['atividades','contatos'])::text", papel='anon')[-1]
            ok(r == '{}', "visitante não lê coleções da equipe, só vitrines")
        except ErroBanco as e: ok(False, str(e))
        for sql, nome in [("select count(*) from envios_publicos", "ler a caixa"), ("select pr_pegar_envios()", "recolher a caixa"), ("select pr_ler_colecoes()", "ler as coleções")]:
            try: psql(sql, papel='anon'); ok(False, "visitante não deveria " + nome)
            except ErroBanco: ok(True, "visitante não consegue " + nome)
        # 3) visitante envia: Comunicado, voluntário, fotos e descadastro
        await q.goto(B + '/newsletter.html'); await q.wait_for_selector('#cad-f')
        await q.fill('#cad-n', 'Maria Nova'); await q.fill('#cad-e', 'Maria.Nova@x.com'); await q.check('#cad-c'); await q.click('#cad-f button'); await q.wait_for_timeout(800)
        ok('Cadastro feito' in await q.inner_text('#cad-m'), "cadastro no Comunicado confirmado ao visitante")
        await q.goto(B + '/voluntario.html'); await q.wait_for_selector('#vl-form')
        ok('demonstração' not in await q.inner_text('#voluntario-form'), "voluntário sem o aviso de 'modo de demonstração'")
        await q.fill('#v-n', 'João da Silva'); await q.fill('#v-c', '21988887777'); await q.check('[name=va] >> nth=0'); await q.check('#v-ok'); await q.click('#vl-form button.btn-large'); await q.wait_for_timeout(800)
        await q.goto(B + '/fotos.html'); await q.wait_for_selector('#fenvio')
        ok(await q.locator('#galeria img').count() == 1, "galeria mostra a foto publicada")
        await q.set_input_files('#p-f', PNG); await q.fill('#p-a', 'Carla'); await q.click('#fenvio button[type=submit], #fenvio button.btn-large'); await q.wait_for_timeout(1500)
        await q.goto(B + '/descadastro.html?e=velho@x.com'); await q.wait_for_selector('#sai-f'); await q.click('#sai-f button'); await q.wait_for_timeout(800)
        ok('deixou de receber' in await q.inner_text('#sai-m'), "descadastro confirmado ao visitante")
        caixas = psql("select caixa from envios_publicos order by id")
        ok(caixas == ['contatos', 'voluntarios', 'album', 'contatos'], f"4 envios na caixa de entrada ({caixas})")
        try: psql("select pr_enviar_publico('contas', '{\"valor\":1}'::jsonb)", papel='anon'); ok(False, "não deveria aceitar 'contas'")
        except ErroBanco: ok(True, "caixa recusa coleções que não são de envio público (ex.: contas)")
        # 4) equipe abre a área restrita: envios entram nas coleções e saem da caixa
        await pg.goto(B + '/area-restrita.html'); await pg.wait_for_timeout(4500)
        cs = await pg.evaluate("PR_DADOS.db.get('contatos',[])")
        ok(any(c['email'] == 'maria.nova@x.com' and c['lista'] == 'aderente' for c in cs), "cadastro do Comunicado entrou na lista Aderentes")
        ok(any(c['email'] == 'velho@x.com' and c.get('ativo') is False for c in cs), "descadastro aplicado")
        vs = await pg.evaluate("PR_DADOS.db.get('voluntarios',[])"); ok(len(vs) == 1 and vs[0]['nome'] == 'João da Silva' and vs[0]['origem'] == 'publica', "inscrição de voluntário chegou")
        al = await pg.evaluate("PR_DADOS.db.get('album',[])"); nova = [f for f in al if f.get('origem') == 'publica']
        ok(len(nova) == 1 and nova[0]['status'] == 'pendente' and nova[0]['autor'] == 'Carla', "foto enviada chegou como pendente para a curadoria")
        ok(psql("select count(*) from envios_publicos")[-1] == '0', "caixa de entrada esvaziada depois de guardar")
        v = json.loads(banco("select dados::text from registros where colecao='pub_album' and id='_'"))
        ok([f['id'] for f in v] == ['f1'], "foto pendente não aparece no site até a curadoria publicar")
        ok(not erros, "sem erros de JavaScript " + str(erros[:3]))
        await br.close()
try: asyncio.run(main())
finally: srv.terminate()
