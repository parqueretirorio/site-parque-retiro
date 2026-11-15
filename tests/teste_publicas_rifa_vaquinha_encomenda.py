# Teste (15/11/2026): Rifa, Vaquinha e Encomendas nas páginas ABERTAS ligadas ao servidor (migração 0013),
# contra o PostgreSQL local (mesmas migrações do Supabase).
#  - a equipe cadastra; o site aberto mostra (vitrines sem dados pessoais);
#  - Rifa: o SERVIDOR sorteia os números na hora, sem repetir, e a consulta funciona pelo e-mail + celular;
#  - Vaquinha: barra de progresso em %; a contribuição vai para a caixa de entrada e pode ser consultada;
#  - Encomenda: vai para a caixa de entrada; a equipe recolhe e a fila não repete posição;
#  - a tela da equipe aberta antes da inscrição não perde a inscrição feita pelo site (junta pelo id).
import asyncio, subprocess, time, os, sys, json, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from supabase_falso import SupabaseFalso, preparar_banco, psql, ErroBanco
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8866
URL_SB = 'https://yhzsuokwglznehvbclwd.supabase.co'
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}"
IMG = SITE + '/tests/imagens/ok2.png'
d = datetime.date.today() + datetime.timedelta(days=10)
while d.weekday() != 2: d += datetime.timedelta(days=1)
SORTEIO = d.isoformat(); PRAZO = (datetime.date.today() + datetime.timedelta(days=30)).isoformat()
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
def banco(sql):
    r = psql(sql); return r[-1] if r else ''
SENS = ('email', 'celular', 'whatsapp', 'comprovante', 'preResp')

async def entrar(pg, e, s):
    await pg.goto(B + '/login.html?servidor=1'); await pg.wait_for_selector('#e')
    await pg.fill('#e', e); await pg.fill('#s', s); await pg.click('#f button.btn-large')
    await pg.wait_for_url('**/area-restrita.html*', timeout=15000); await pg.wait_for_timeout(2500)

async def inscrever_rifa(q, nome, cel, email, qtd):
    await q.goto(B + '/rifa-solidaria.html?servidor=1'); await q.wait_for_selector('.rifa-card')
    await q.click('[data-sel]'); await q.wait_for_selector('#rifa-form')
    await q.fill('#p-n', nome); await q.fill('#p-c', cel); await q.check('#p-mesmo'); await q.fill('#p-e', email); await q.fill('#p-q', str(qtd))
    await q.set_input_files('#p-f', IMG); await q.check('#p-ok'); await q.click('#rifa-form button.btn-large')
    await q.wait_for_selector('.rifa-ok', timeout=10000)
    return await q.inner_text('.rifa-ok')

async def main():
    preparar_banco(); sb = SupabaseFalso(URL_SB)
    sb.criar_conta('leonidasfrancaemedi@gmail.com', 'senhaLeo123', 'Leonidas França', nivel='administrador', status='aprovado', whatsapp='21999990000')
    async with async_playwright() as p:
        br = await p.chromium.launch(); erros = []
        eq = await br.new_context(viewport={'width': 1280, 'height': 900}, locale='pt-BR'); await eq.route(URL_SB + '/**', sb.tratar)
        pg = await eq.new_page(); pg.on('pageerror', lambda e: erros.append(str(e)))
        await entrar(pg, 'leonidasfrancaemedi@gmail.com', 'senhaLeo123')
        # 1) equipe cadastra rifa (20 números), vaquinha (meta 1.000, 250 confirmados) e um livro em pré-lançamento
        await pg.evaluate("""([S, P]) => { const db = PR_DADOS.db;
          db.set('rifas', [{ id: 'r1', titulo: 'Cesta orgânica', premio: 'Cesta da horta', foto: '', preco: 10, total: 20, digitos: 2, dataSorteio: S, moedas: ['PIX'], instrucoes: 'PIX do Instituto', ativa: true, por: 'Leonidas' }]);
          db.set('vaquinhas', [{ id: 'q1', titulo: 'Grama do Parque', objetivo: 'Corte e adubação', meta: 1000, prazo: P, moedas: ['PIX'], instrucoes: 'PIX do Instituto', ativa: true, por: 'Leonidas', criadoEm: '2026-11-15' }]);
          db.set('vaq_part', [{ id: 'c0', codigo: 'VZZZZ', vaquinha: 'q1', nome: 'Ana Maria Lima', celular: '21911112222', whatsapp: '21911112222', email: 'ana@x.com', valor: 250, moeda: 'PIX', comprovante: 'data:image/png;base64,AAAA', status: 'confirmado', origem: 'manual', criadoEm: '2026-11-14T10:00:00Z', conta: '' }]);
          db.set('livraria_itens', [{ id: 'L1', titulo: 'Humanizar a Terra', autor: 'Silo', pre: true, prePreco: 50, prePrazo: P, preResp: 'resp@x.com', preRespNome: 'Resp' }]);
        }""", [SORTEIO, PRAZO])
        await pg.wait_for_timeout(3000)
        for n in ('rifas', 'rifa_part', 'vaquinhas', 'vaq_part', 'livraria_itens'):
            v = banco(f"select dados::text from registros where colecao='pub_{n}' and id='_'")
            if v: ok(not any(s in v for s in SENS), f"vitrine pub_{n} sem e-mail, celular, WhatsApp, comprovante nem responsável")
        ok('"valor": 250' in banco("select dados::text from registros where colecao='pub_vaq_part'"), "vitrine da Vaquinha traz só o valor confirmado (para a barra)")

        # 2) visitante: Rifa com sorteio no servidor
        vi = await br.new_context(viewport={'width': 390, 'height': 844}, locale='pt-BR'); await vi.route(URL_SB + '/**', sb.tratar)
        q = await vi.new_page(); q.on('pageerror', lambda e: erros.append('visitante: ' + str(e)))
        t = await inscrever_rifa(q, 'Maria da Silva Souza', '(21) 99999-1111', 'maria@x.com', 3)
        ok(await q.evaluate("PR_DADOS.modo") == 'vitrine', "página da Rifa em modo vitrine (ligada ao servidor)")
        ok('Seu código' in t, "inscrição confirmada ao visitante com código e números")
        ok('demonstração' not in await q.inner_text('#rifas'), "Rifa sem o aviso de 'modo de demonstração'")
        partes = json.loads(banco("select dados::text from registros where colecao='rifa_part'"))
        ok(len(partes) == 1 and partes[0]['email'] == 'maria@x.com' and len(partes[0]['numeros']) == 3 and partes[0]['status'] == 'pendente' and partes[0]['comprovante'].startswith('data:image'),
           "inscrição gravada NO SERVIDOR, pendente, com comprovante e 3 números")
        nums1 = partes[0]['numeros']
        ok(all(('%02d' % n) in t for n in nums1), f"números mostrados ao visitante são os sorteados pelo servidor {nums1}")
        # outro visitante, outro aparelho
        vi2 = await br.new_context(locale='pt-BR'); await vi2.route(URL_SB + '/**', sb.tratar)
        q2 = await vi2.new_page(); q2.on('pageerror', lambda e: erros.append('visitante2: ' + str(e)))
        await inscrever_rifa(q2, 'João Pereira Santos', '21988887777', 'joao@x.com', 17)
        partes = json.loads(banco("select dados::text from registros where colecao='rifa_part'"))
        todos = [n for x in partes for n in x['numeros']]
        ok(len(partes) == 2 and len(todos) == 20 and len(set(todos)) == 20, "20 números de 20 reservados, nenhum repetido")
        vr = banco("select dados::text from registros where colecao='pub_rifa_part'")
        ok(vr and not any(s in vr for s in SENS) and 'Souza' not in vr and 'Maria S.' in vr, "vitrine dos números reservados só com primeiro nome + inicial, sem contato nem comprovante")
        await q2.goto(B + '/rifa-solidaria.html'); await q2.wait_for_selector('.rifa-card')
        ok(await q2.query_selector('[data-sel]') is None or '0 de 20' in await q2.inner_text('.rifa-card'), "site mostra que não há mais números livres")
        try:
            psql("""select pr_rifa_inscrever('{"rifa":"r1","nome":"Zé Silva","celular":"21977776666","whatsapp":"21977776666","email":"ze@x.com","qtd":1,"moeda":"PIX","comprovante":"data:image/png;base64,AA","consentimento":true}'::jsonb)""", papel='anon')
            ok(False, "não deveria aceitar com a rifa esgotada")
        except ErroBanco as e: ok('reservados' in str(e), "servidor recusa quando os números acabaram")
        # consulta "meus números"
        await q.goto(B + '/rifa-solidaria.html'); await q.wait_for_selector('#rifa-cons')
        await q.fill('#k-e', 'MARIA@x.com'); await q.fill('#k-c', '21 99999-1111'); await q.click('#rifa-cons button'); await q.wait_for_timeout(800)
        sec = "document.querySelector('#rifa-cons').closest('section').innerText"
        tc = await q.evaluate(sec)
        ok(all(('%02d' % n) in tc for n in nums1) and await q.locator('#rifa-cons ~ table, #rifa-cons + * table, section:has(#rifa-cons) table').count() > 0, "consulta pelo e-mail + celular mostra os números e a situação")
        await q.fill('#k-e', 'maria@x.com'); await q.fill('#k-c', '21000000000'); await q.click('#rifa-cons button'); await q.wait_for_timeout(800)
        ok(await q.locator('section:has(#rifa-cons) table').count() == 0, "celular errado não mostra nada")

        # 3) Vaquinha: barra em % e contribuição pela caixa de entrada
        await q.goto(B + '/vaquinha-coletiva.html'); await q.wait_for_selector('.vq-card')
        larg = await q.evaluate("document.querySelector('.vq-barra-enche').style.width")
        ok(larg in ('25%', '25.0%') and '25%' in await q.inner_text('.vq-pct'), f"barra de progresso da Vaquinha em 25% ({larg})")
        ok('demonstração' not in await q.evaluate('document.body.innerText'), "Vaquinha sem o aviso de 'modo de demonstração'")
        await q.click('[data-sel]'); await q.wait_for_selector('#vq-form')
        await q.fill('#q-n', 'Carla Mendes Rocha'); await q.fill('#q-c', '21977776666'); await q.check('#q-mesmo'); await q.fill('#q-e', 'carla@x.com'); await q.fill('#q-v', '100')
        await q.set_input_files('#q-f', IMG); await q.check('#q-ok'); await q.click('#vq-form button.btn-large'); await q.wait_for_selector('.rifa-ok'); await q.wait_for_timeout(800)
        ok(psql("select caixa from envios_publicos where caixa='vaq_part'") == ['vaq_part'], "contribuição da Vaquinha chegou à caixa de entrada do servidor")
        await q.goto(B + '/vaquinha-coletiva.html'); await q.wait_for_selector('#vq-cons')
        await q.fill('#k-e', 'carla@x.com'); await q.fill('#k-c', '21977776666'); await q.click('#vq-cons button'); await q.wait_for_timeout(800)
        tv = await q.evaluate("document.querySelector('#vq-cons').closest('section').innerText")
        ok('100' in tv and await q.locator('section:has(#vq-cons) table').count() > 0, "consulta da contribuição funciona antes mesmo de a equipe recolher")

        # 4) Encomenda: escolhe o livro e encomenda
        await q.goto(B + '/livraria.html'); await q.wait_for_selector('#prelanc-lista .card')
        ok('Humanizar a Terra' in await q.inner_text('#prelanc-lista'), "Livraria mostra o livro em pré-lançamento (vindo do servidor)")
        await q.click('#prelanc-lista a.btn-visit'); await q.wait_for_selector('#en-f')
        await q.fill('#en-n', 'Pedro Alves'); await q.fill('#en-e', 'pedro@x.com'); await q.fill('#en-q', '2'); await q.check('#en-c'); await q.click('#en-f button.btn-large'); await q.wait_for_timeout(1200)
        ok(psql("select caixa from envios_publicos where caixa='livraria_enc'") == ['livraria_enc'], "encomenda chegou à caixa de entrada do servidor")

        # 5) a tela da equipe (aberta ANTES das inscrições) grava a Rifa: junta pelo id, sem conflito e sem perder nada
        await pg.evaluate("""() => { const db = PR_DADOS.db, l = db.get('rifa_part', []); l.push({ id: 'm1', codigo: 'RMANU', rifa: 'r1', nome: 'Manual Teste', numeros: [], status: 'recusado', origem: 'manual' }); db.set('rifa_part', l); }""")
        await pg.wait_for_timeout(2500)
        partes = json.loads(banco("select dados::text from registros where colecao='rifa_part'"))
        ok(len([x for x in partes if x['origem'] == 'publica']) == 2 and len(partes) == 3, "gravação da equipe juntou com as inscrições do site (3 itens)")
        ok(await pg.evaluate("PR_DADOS.estadoSync().conflitos") == 0, "sem conflito de edição na tela da equipe")
        # 6) equipe abre a área: recolhe a caixa
        await pg.goto(B + '/area-restrita.html'); await pg.wait_for_timeout(4500)
        vp = await pg.evaluate("PR_DADOS.db.get('vaq_part',[])"); nova = [x for x in vp if x.get('origem') == 'publica']
        ok(len(nova) == 1 and nova[0]['status'] == 'pendente' and nova[0]['valor'] == 100 and nova[0]['comprovante'].startswith('data:'), "contribuição entrou na Vaquinha como pendente, com comprovante")
        en = await pg.evaluate("PR_DADOS.db.get('livraria_enc',[])")
        ok(len(en) == 1 and en[0]['nome'] == 'Pedro Alves' and en[0]['seq'] == 1 and en[0]['origem'] == 'publica', "encomenda entrou na fila do livro (posição 1)")
        ok(psql("select count(*) from envios_publicos")[-1] == '0', "caixa de entrada esvaziada depois de guardar")
        ok(not erros, "sem erros de JavaScript " + str(erros[:3]))
        await br.close()
try: asyncio.run(main())
finally: srv.terminate()
