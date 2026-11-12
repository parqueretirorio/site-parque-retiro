# Teste (12/11/2026): aprovar cadastro já marcando as responsabilidades; Atividades abertas a todos,
# cada um cuida das suas e o Administrador das Atividades corrige qualquer uma. Contra o PostgreSQL local (Supabase falso).
import asyncio, subprocess, time, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from supabase_falso import SupabaseFalso, preparar_banco
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8858
URL_SB = 'https://yhzsuokwglznehvbclwd.supabase.co'
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}"
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m

async def entrar(pg, e, s):
    await pg.goto(B + '/login.html?servidor=1'); await pg.wait_for_selector('#e')
    await pg.fill('#e', e); await pg.fill('#s', s); await pg.click('#f button.btn-large')
    await pg.wait_for_url('**/area-restrita.html*', timeout=15000); await pg.wait_for_timeout(800)
async def sair(pg):
    await pg.evaluate("PR_DADOS.sincronizar && PR_DADOS.sincronizar()"); await pg.wait_for_timeout(400)
    await pg.evaluate("localStorage.removeItem('pr-sb-sessao'); sessionStorage.clear()")
async def aba(pg, t):
    await pg.evaluate(f"location.hash='#t={t}'"); await pg.wait_for_timeout(300)
    await pg.evaluate(f"document.querySelector('[data-tab=\"{t}\"]').click()"); await pg.wait_for_timeout(500)

async def main():
    preparar_banco(); sb = SupabaseFalso(URL_SB)
    sb.criar_conta('leonidasfrancaemedi@gmail.com', 'senhaLeo123', 'Leonidas França', nivel='administrador', status='aprovado', whatsapp='21999990000')
    sb.criar_conta('maria@x.com', 'senhaMaria123', 'Maria Conceição Ribeiro', nivel='leitor', status='pendente', whatsapp='21977776666')
    sb.criar_conta('beto@x.com', 'senhaBeto123', 'Beto Silva', nivel='leitor', status='aprovado', whatsapp='21988887777')
    async with async_playwright() as p:
        br = await p.chromium.launch(); ctx = await br.new_context(viewport={'width': 1280, 'height': 900}, locale='pt-BR')
        await ctx.route(URL_SB + '/**', sb.tratar)
        pg = await ctx.new_page(); erros = []; pg.on('pageerror', lambda e: erros.append(str(e))); pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
        # 1) administrador aprova a Maria já com responsabilidades
        await entrar(pg, 'leonidasfrancaemedi@gmail.com', 'senhaLeo123'); await aba(pg, 'users')
        await pg.wait_for_selector('.aprova-card[data-card="maria@x.com"]')
        ok(await pg.locator('.aprova-card [data-fnp="atividades"]').count() == 1, "aprovação mostra as responsabilidades para marcar")
        ok('Administrador das Atividades' in await pg.inner_text('.aprova-card'), "função 'Administrador das Atividades' aparece na lista")
        await pg.check('.aprova-card[data-card="maria@x.com"] [data-fnp="atividades"]'); await pg.check('.aprova-card[data-card="maria@x.com"] [data-fnp="reservas"]')
        await pg.screenshot(path='/tmp/aprova.png', full_page=False)
        await pg.click('[data-ap="maria@x.com"]'); await pg.wait_for_timeout(1500)
        u = await pg.evaluate("PR_DADOS.db.get('users').find(u=>u.email==='maria@x.com')")
        ok(u['status'] == 'aprovado' and set(u['funcoes']) == {'atividades', 'reservas'}, f"Maria aprovada com Atividades e Reservas ({u.get('funcoes')})")
        await sair(pg)
        # 2) Beto (sem função) cria uma atividade e é o responsável
        await entrar(pg, 'beto@x.com', 'senhaBeto123'); await aba(pg, 'atividades')
        ok(await pg.locator('#at-novo').count() == 1, "qualquer pessoa da equipe vê 'Nova atividade'")
        await pg.click('#at-novo'); await pg.wait_for_selector('#at-form')
        ok(await pg.locator('#at-dest').count() == 0, "banner do Início fica só para o Administrador das Atividades")
        ok(await pg.eval_on_selector('#at-r', 's => s.value') == 'beto@x.com', "quem cria já vem como responsável")
        await pg.fill('#at-t', 'Mutirão na Fonte'); await pg.fill('#at-li', 'Limpeza da Fonte.'); await pg.fill('#at-x', 'Vamos limpar a Fonte juntos.')
        await pg.select_option('#at-s', 'publicada'); await pg.click('#at-form button.btn-large'); await pg.wait_for_timeout(800)
        a = await pg.evaluate("PR_DADOS.db.get('atividades').find(a=>a.titulo==='Mutirão na Fonte')")
        ok(a and a['respEmail'] == 'beto@x.com' and a['status'] == 'publicada', "atividade criada, publicada e com Beto como responsável")
        # atividade de outra pessoa: Beto não edita
        await pg.evaluate("(()=>{const l=PR_DADOS.db.get('atividades',[]);l.push({id:'x1',titulo:'Encontro de Primavera',categoria:'evento',origem:'parque',dataAtiv:'2026-12-01',lide:'a',texto:'b',autor:'Ana',status:'publicada',respEmail:'ana@x.com',respNome:'Ana'});PR_DADOS.db.set('atividades',l)})()")
        await aba(pg, 'atividades')
        ok(await pg.locator('[data-ed="x1"]').count() == 0 and await pg.locator(f'[data-ed="{a["id"]}"]').count() == 1, "Beto edita a atividade dele e não a dos outros")
        await sair(pg)
        # 3) Maria (Administradora das Atividades) corrige a do Beto e transfere
        await entrar(pg, 'maria@x.com', 'senhaMaria123'); await aba(pg, 'atividades')
        ok('Administrador das Atividades' in await pg.inner_text('#app'), "Maria vê que é Administradora das Atividades")
        ok(await pg.locator('[data-ed="x1"]').count() == 1 and await pg.locator(f'[data-ed="{a["id"]}"]').count() == 1, "Administradora edita qualquer atividade")
        await pg.click(f'[data-ed="{a["id"]}"]'); await pg.wait_for_selector('#at-form')
        ok(await pg.locator('#at-dest').count() == 1, "Administradora pode destacar no banner")
        await pg.fill('#at-t', 'Mutirão na Fonte (corrigido)'); await pg.select_option('#at-r', 'maria@x.com'); await pg.click('#at-form button.btn-large'); await pg.wait_for_timeout(800)
        a2 = await pg.evaluate(f"PR_DADOS.db.get('atividades').find(a=>a.id==='{a['id']}')")
        ok(a2['titulo'].endswith('(corrigido)') and a2['respEmail'] == 'maria@x.com' and a2['criadoPorEmail'] == 'beto@x.com', "correção e transferência gravadas, sem perder quem criou")
        ok(not erros, f"sem erros de JavaScript {erros}")
        await br.close()
try: asyncio.run(main())
finally: srv.terminate()
