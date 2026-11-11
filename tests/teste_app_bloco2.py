# Teste do Bloco 2 do app CONecta Retiro (1.4.0): telas próprias de Alojamento, Inventário e Documentos e Calendários,
# contra o PostgreSQL local com as migrações do Supabase (os dados passam pelo servidor e voltam depois de recarregar).
# Rodar a partir da pasta do site:  python3 tests/teste_app_bloco2.py   (precisa do PostgreSQL 16 local ligado)
import asyncio, subprocess, time, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from supabase_falso import SupabaseFalso, preparar_banco

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8857
URL_SB = 'https://yhzsuokwglznehvbclwd.supabase.co'
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}"; OUT = os.environ.get('SHOTS', '/tmp')
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
def dia(n):
    return time.strftime('%Y-%m-%d', time.localtime(time.time() + n * 86400))

async def main():
    preparar_banco()
    sb = SupabaseFalso(URL_SB)
    sb.criar_conta('leonidasfrancaemedi@gmail.com', 'senhaLeo123', 'Leonidas França', nivel='administrador', status='aprovado', whatsapp='21999990000')
    sb.criar_conta('beto@x.com', 'senhaBeto123', 'Beto Silva', nivel='leitor', status='aprovado', funcoes=['jardinagem'], whatsapp='21988887777')
    sb.criar_conta('rita@x.com', 'senhaRita123', 'Rita Reis', nivel='leitor', status='aprovado', funcoes=['reservas'], whatsapp='21977775555')
    h, a3, a5, a10, ontem = dia(0), dia(3), dia(5), dia(10), dia(-1)
    async with async_playwright() as p:
        br = await p.chromium.launch()
        ctx = await br.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, locale='pt-BR')
        await ctx.route(URL_SB + '/**', sb.tratar)
        pg = await ctx.new_page(); erros = []; pg.on('pageerror', lambda e: erros.append(str(e)))
        await pg.goto(B + '/app/?servidor=1'); await pg.wait_for_selector('#fe')
        await pg.fill('#e', 'leonidasfrancaemedi@gmail.com'); await pg.fill('#s', 'senhaLeo123'); await pg.click('#be')
        await pg.wait_for_selector('.topo-ola', timeout=10000)
        # dados de exemplo gravados no servidor
        await pg.evaluate(f"""async ()=>{{const db=PR_DADOS.db;
          db.set('pedidos',[{{id:'p1',status:'pendente',nome:'Ana Souza',telefone:'21 98888-1111',email:'ana@x.com',chegada:'{a3}',saida:'{a5}',hora:'18:00',pessoas:2,hospedagem:true,camaBaixa:false,necessidades:'Uma pessoa com joelho operado',detalhes:'Retiro de estudo',camas:[],criado:'{h}',por:'site'}},
                            {{id:'p0',status:'confirmada',nome:'Grupo Rio',chegada:'{dia(2)}',saida:'{dia(4)}',pessoas:2,hospedagem:true,camas:[{{pessoa:'Caio',cama:1}},{{pessoa:'Duda',cama:2}}],criado:'{h}',por:'x'}}]);
          db.set('inv_itens',[{{id:'i1',codigo:'INV-0001',cat:'fer',nome:'Furadeira Bosch',marca:'Bosch',modelo:'GSB',serie:'S123',quantidade:1,unidade:'un',local:'Depósito',conserv:'Bom',status:'Emprestado',responsavel:'Leonidas França'}},
                              {{id:'i2',codigo:'INV-0002',cat:'mov',nome:'Mesa dobrável',quantidade:4,unidade:'un',local:'Sala',conserv:'Regular',status:'Disponível'}}]);
          db.set('inv_emp',[{{id:'e1',item:'i1',codigo:'INV-0001',nome:'Furadeira Bosch',qtd:1,pessoa:'Beto Silva',saida:'{dia(-10)}',prevista:'{ontem}',devolvido:''}}]);
          db.set('inv_mov',[{{id:'m1',item:'i1',codigo:'INV-0001',nome:'Furadeira Bosch',tipo:'Empréstimo',qtd:1,det:'Para Beto Silva',data:'{dia(-10)}',por:'Leonidas França'}}]);
          db.set('docs',[{{id:'d1',area:'atas',titulo:'Reunião de Escola de outubro',data:'{dia(-20)}',ano:2026,categoria:'Atas',enc:[{{id:'x1',texto:'Comprar lâmpadas para a Sala',resp:'Rita',data:'{ontem}',status:'Em aberto'}},{{id:'x2',texto:'Limpar a Fonte',resp:'Beto',data:'{a10}',status:'Em aberto'}},{{id:'x3',texto:'Já feito',status:'Feito'}}]}}]);
          await PR_DADOS.sincronizar();}}""")
        await pg.reload(); await pg.wait_for_selector('.topo-ola', timeout=10000)
        # Todas as áreas: Alojamento, Inventário e Documentos abrem as telas próprias do app
        await pg.goto(B + '/app/?servidor=1#areas'); await pg.wait_for_selector('.topo h1:has-text("Todas as áreas")')
        hs = await pg.eval_on_selector_all('.linha', 'l => l.map(a => a.getAttribute("href"))')
        ok('#alojamento' in hs and '#inventario' in hs and '#documentos' in hs, "Alojamento, Inventário e Documentos abrem telas próprias")

        # ---------- Alojamento ----------
        await pg.click('a.linha[href="#alojamento"]'); await pg.wait_for_selector('.cartao-b2[data-id="p1"]')
        t0 = await pg.inner_text('main')
        ok('Aguardando resposta (1)' in t0 and 'Ana Souza' in t0 and 'joelho operado' in t0, "pedido aguardando com necessidades em destaque")
        ok(await pg.locator('.cartao-b2[data-id="p1"] a[href^="tel:"]').count() == 1, "botão de ligar para quem pediu")
        ok('Grupo Rio' in t0, "hospedagem confirmada aparece nas próximas")
        await pg.click('.cartao-b2[data-id="p1"] [data-abre]'); await pg.wait_for_selector('[data-c="1"]')
        opts = await pg.eval_on_selector('[data-c="0"]', 's => [...s.options].map(o => o.value).filter(Boolean)'); ok(await pg.inner_text('.topo h1') == 'Alojamento', 'título da tela é o nome da ferramenta')
        ok('1' not in opts and '2' not in opts and '3' in opts, f"só aparecem camas livres no período ({opts})")
        await pg.click('[data-salva]'); ok('Escolha a cama de cada pessoa' in await pg.inner_text('.cartao-b2[data-id="p1"] .erro'), "pede a cama de cada pessoa")
        await pg.select_option('[data-c="0"]', '3'); await pg.select_option('[data-c="1"]', '3'); await pg.click('[data-salva]')
        ok('mesma cama' in await pg.inner_text('.cartao-b2[data-id="p1"] .erro'), "não deixa duas pessoas na mesma cama")
        await pg.fill('[data-p="1"]', 'Bia Souza'); await pg.select_option('[data-c="1"]', '5')
        await pg.screenshot(path=OUT + '/app-b2-1-camas.png', full_page=True)
        await pg.click('[data-salva]'); await pg.wait_for_selector('.faixa-ok')
        st = await pg.evaluate("PR_DADOS.db.get('pedidos').find(r=>r.id==='p1')")
        ok(st['status'] == 'confirmada' and [c['cama'] for c in st['camas']] == [3, 5] and st['camas'][1]['pessoa'] == 'Bia Souza', "pedido confirmado com as camas escolhidas")
        # ocupação no dia da chegada
        await pg.click('nav.sub a[href="#alojamento/ocupacao"]'); await pg.wait_for_selector('#o-d')
        await pg.fill('#o-d', a3); await pg.dispatch_event('#o-d', 'change'); await pg.wait_for_timeout(300)
        oc = await pg.eval_on_selector_all('.cama.ocupada b', 'l => l.map(x => x.textContent)')
        ok(oc == ['01', '02', '03', '05'], f"ocupação do dia mostra as 4 camas ocupadas ({oc})")
        await pg.screenshot(path=OUT + '/app-b2-2-ocupacao.png', full_page=True)
        # novo pedido
        await pg.click('nav.sub a[href="#alojamento/novo"]'); await pg.wait_for_selector('#fn')
        await pg.click('#fn button'); ok('nome, chegada e saída' in await pg.inner_text('#fn .erro'), "novo pedido: valida os campos obrigatórios")
        await pg.fill('#n-n', 'Carlos Lima'); await pg.fill('#n-c', a10); await pg.fill('#n-s', dia(8)); await pg.click('#fn button')
        ok('antes da chegada' in await pg.inner_text('#fn .erro'), "novo pedido: saída antes da chegada é recusada")
        await pg.fill('#n-s', dia(12)); await pg.fill('#n-p', '1'); await pg.check('#n-b'); await pg.click('#fn button')
        await pg.wait_for_selector('.faixa-ok'); novo = await pg.evaluate("PR_DADOS.db.get('pedidos').find(r=>r.nome==='Carlos Lima')")
        ok(novo and novo['status'] == 'pendente' and novo['camaBaixa'] and novo['por'] == 'Leonidas França', "novo pedido registrado como aguardando")
        ok(await pg.locator('.cartao-b2 [data-c="0"]').count() == 1, "depois de registrar, já abre para indicar a cama")
        opts = await pg.eval_on_selector('[data-c="0"]', 's => [...s.options].map(o => +o.value).filter(Boolean)')
        ok(all(o % 2 == 1 for o in opts), "quem precisa de cama de baixo só vê camas ímpares")
        await pg.fill('[data-motivo]', 'Sem vaga nesse fim de semana'); await pg.click('[data-recusa]'); await pg.wait_for_selector('.faixa-ok')
        rec = await pg.evaluate("PR_DADOS.db.get('pedidos').find(r=>r.nome==='Carlos Lima')")
        ok(rec['status'] == 'recusada' and 'Sem vaga' in rec['motivo'], "pedido recusado com motivo")

        # ---------- Inventário ----------
        await pg.goto(B + '/app/?servidor=1#inventario'); await pg.wait_for_selector('#ib')
        t1 = await pg.inner_text('main'); ok('Emprestados agora (1)' in t1 and 'Beto Silva' in t1 and 'atrasado' in t1, "inventário mostra o que está emprestado e o atraso")
        await pg.fill('#ib', 'mesa'); await pg.wait_for_timeout(200)
        ok(await pg.locator('.item-b2').count() == 1 and 'INV-0002' in await pg.inner_text('#ires'), "busca encontra o item pelo nome")
        await pg.fill('#ib', 'S123'); await pg.wait_for_timeout(200); await pg.click('.item-b2')
        await pg.wait_for_selector('.ficha'); t2 = await pg.inner_text('main')
        ok('Furadeira Bosch' in t2 and 'Depósito' in t2 and 'Empréstimo' in t2 and 'Beto Silva' in t2, "ficha do item com local, empréstimo e movimentações")
        ok(await pg.locator('a.bt-principal[href*="area-restrita.html?app=1#t=inventario"]').count() == 1, "movimentar abre a ferramenta completa")
        await pg.screenshot(path=OUT + '/app-b2-3-ficha.png', full_page=True)

        # ---------- Documentos e Calendários ----------
        await pg.goto(B + '/app/?servidor=1#documentos'); await pg.wait_for_selector('[data-st]')
        t3 = await pg.inner_text('main')
        ok('Encaminhamentos em aberto (2)' in t3 and 'Em atraso' in t3 and 'Já feito' not in t3, "encaminhamentos em aberto, com o atrasado em destaque")
        await pg.click('[data-st="d1|x1|Feito"]'); await pg.wait_for_selector('.faixa-ok')
        e = await pg.evaluate("PR_DADOS.db.get('docs')[0].enc.find(x=>x.id==='x1').status")
        ok(e == 'Feito' and 'Encaminhamentos em aberto (1)' in await pg.inner_text('main'), "marcar como feito grava na ata")
        await pg.click('nav.sub a[href="#documentos/nova"]'); await pg.wait_for_selector('#fa')
        await pg.click('#fa button'); ok('título e a data' in await pg.inner_text('#fa .erro'), "nova atividade: valida título e data")
        await pg.fill('#a-t', 'Mutirão na Fonte'); await pg.fill('#a-d', a5); await pg.select_option('#a-c', 'Mutirão / Manutenção'); await pg.fill('#a-l', 'Fonte'); await pg.click('#fa button')
        await pg.wait_for_selector('.faixa-ok')
        await pg.goto(B + '/app/?servidor=1#agenda'); await pg.wait_for_selector('.topo h1:has-text("Avisos e agenda")')
        ok('Mutirão na Fonte' in await pg.inner_text('main'), "nova atividade aparece em Avisos e agenda")
        await pg.screenshot(path=OUT + '/app-b2-4-agenda.png', full_page=True)

        # tudo ficou no servidor: outra sessão (Rita, responsável de reservas) vê as mesmas reservas
        await pg.evaluate("PR_DADOS.sincronizar()"); await pg.wait_for_timeout(500)
        await pg.goto(B + '/app/?servidor=1#inicio'); await pg.wait_for_selector('#sair'); await pg.click('#sair'); await pg.wait_for_selector('#fe', timeout=10000)
        await pg.fill('#e', 'rita@x.com'); await pg.fill('#s', 'senhaRita123'); await pg.click('#be'); await pg.wait_for_selector('.topo-ola', timeout=10000)
        ok(await pg.locator('.linha[href="#alojamento"]').count() == 1, "Rita (Responsável de Reservas) vê o Alojamento em Minhas responsabilidades")
        await pg.goto(B + '/app/?servidor=1&lang=es#alojamento'); await pg.wait_for_selector('nav.sub')
        t4 = await pg.inner_text('main')
        ok('Alojamiento' in await pg.inner_text('.topo h1') and 'Pedidos' in t4 and 'Ocupación' in t4 and 'Ana Souza' in t4 and 'Cuarto Paz' in t4 and 'de abajo' in t4, "Alojamento em espanhol, com os dados vindos do servidor")
        await pg.screenshot(path=OUT + '/app-b2-5-es.png', full_page=True)
        await pg.goto(B + '/app/?servidor=1&lang=pt#inventario'); await pg.wait_for_selector('.topo-ola, .topo h1')
        pode = await pg.evaluate("PR_AREA.abasDe(PR_DADOS.db.get('users').find(u=>u.email==='rita@x.com')).some(t=>t[0]==='inventario')")
        ok((await pg.locator('#ib').count() == 1) == pode, "o app segue a mesma regra do site para abrir o Inventário")
        await pg.goto(B + '/app/?servidor=1&lang=pt#documentos'); await pg.wait_for_selector('nav.sub')
        ok(await pg.locator('[data-st]').count() == 0 and await pg.locator('nav.sub a[href="#documentos/nova"]').count() == 0 and 'Limpar a Fonte' in await pg.inner_text('main'),
           "quem não é Responsável pelos Documentos só consulta os encaminhamentos (como no site)")
        # Beto (só Jardinagem) não vê Alojamento
        await pg.goto(B + '/app/?servidor=1#inicio'); await pg.wait_for_selector('#sair'); await pg.click('#sair'); await pg.wait_for_selector('#fe', timeout=10000)
        await pg.fill('#e', 'beto@x.com'); await pg.fill('#s', 'senhaBeto123'); await pg.click('#be'); await pg.wait_for_selector('.topo-ola', timeout=10000)
        await pg.goto(B + '/app/?servidor=1#alojamento'); await pg.wait_for_timeout(600)
        ok(await pg.locator('nav.sub').count() == 0, "Beto (Jardinagem) não abre o Alojamento")
        ok(not erros, f"sem erros de JavaScript {erros}")
        await br.close()
try: asyncio.run(main())
finally: srv.terminate()
