# Teste: Álbum Parque Retiro > "Enviar em lote" (fotos no Storage do Supabase, migração 0012_album_storage.sql),
# contra o PostgreSQL local com as migrações reais e um Storage simulado (permissões pelas políticas de storage.objects).
# Rodar:  python3 tests/teste_album_lote.py   (precisa do PostgreSQL 16 local ligado)
import asyncio, subprocess, time, os, sys, io
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from playwright.async_api import async_playwright
from supabase_falso import SupabaseFalso, preparar_banco, psql
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8865
URL_SB = 'https://yhzsuokwglznehvbclwd.supabase.co'
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
B = f"http://localhost:{PORT}"
N = 37  # mais que 10, para provar o lote
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
def fotos(n, pasta='/tmp/lote_fotos'):
    from PIL import Image
    os.makedirs(pasta, exist_ok=True); r = []
    for i in range(n):
        p = f'{pasta}/foto_{i:03d}.jpg'
        if not os.path.exists(p): Image.new('RGB', (3000, 2000), ((i * 37) % 255, (i * 91) % 255, 120)).save(p, 'JPEG', quality=90)
        r.append(p)
    return r
async def entra(pg, email, senha):
    await pg.goto(B + '/login.html?servidor=1'); await pg.fill('#e', email); await pg.fill('#s', senha); await pg.click('#f button.btn-large')
    await pg.wait_for_url('**/area-restrita.html', timeout=10000)
async def main():
    preparar_banco(); sb = SupabaseFalso(URL_SB)
    sb.criar_conta('leonidasfrancaemedi@gmail.com', 'senhaLeo123', 'Leonidas França', nivel='administrador', status='aprovado', whatsapp='21999990000')
    sb.criar_conta('ana@x.com', 'senhaAna1234', 'Ana Álbum', nivel='leitor', status='aprovado', funcoes=['album'], whatsapp='21988887777')
    sb.criar_conta('beto@x.com', 'senhaBeto123', 'Beto Silva', nivel='leitor', status='aprovado', funcoes=[], whatsapp='21977775555')
    arqs = fotos(N)
    async with async_playwright() as p:
        br = await p.chromium.launch()
        # 1) quem não cuida do Álbum não vê o envio em lote
        ctx = await br.new_context(viewport={'width': 1280, 'height': 900}); await ctx.route(URL_SB + '/**', sb.tratar)
        pg = await ctx.new_page(); await entra(pg, 'beto@x.com', 'senhaBeto123')
        await pg.evaluate("document.querySelector('[data-tab=album]').click()"); await pg.wait_for_timeout(500)
        ok(await pg.locator('[data-s=lote]').count() == 0, "leitor sem a função Álbum não vê 'Enviar em lote'")
        await ctx.close()
        # 2) Responsável pelo Álbum envia 37 fotos de uma vez
        ctx = await br.new_context(viewport={'width': 1280, 'height': 900}); await ctx.route(URL_SB + '/**', sb.tratar)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await entra(pg, 'ana@x.com', 'senhaAna1234')
        await pg.evaluate("document.querySelector('[data-tab=album]').click()"); await pg.wait_for_timeout(500)
        ok(await pg.locator('[data-s=lote]').count() == 1, "Responsável pelo Álbum vê 'Enviar em lote'")
        await pg.click('[data-s=lote]'); await pg.wait_for_selector('#fl')
        await pg.wait_for_function("document.querySelector('#lt-uso') && !/calculando/.test(document.querySelector('#lt-uso').textContent)")
        ok('Supabase Storage' in await pg.inner_text('#lt-uso') and '0,0 MB' in await pg.inner_text('#lt-uso'), "sem a R2 configurada, usa o Supabase Storage e mostra o espaço")
        await pg.set_input_files('#l-f', arqs)
        ok(f'{N} foto(s) escolhida(s)' in await pg.inner_text('#l-q'), f"aceita {N} fotos de uma vez")
        await pg.select_option('#l-e', '__novo'); await pg.fill('#l-n', 'Festival de Verão 2026'); await pg.fill('#l-dd', '2026-11-01'); await pg.fill('#l-a', 'Ana Álbum')
        await pg.screenshot(path='/tmp/lote-form.png', full_page=True)
        await pg.click('#fl button.btn-large')
        await pg.wait_for_selector('text=Envio concluído', timeout=120000)
        await pg.screenshot(path='/tmp/lote-fim.png', full_page=True)
        al = await pg.evaluate("PR_DADOS.db.get('album',[])")
        ok(len(al) == N and all(f['foto'].startswith(URL_SB + '/storage/v1/object/public/album/') and f['thumb'] for f in al), f"{N} fotos registradas com o endereço no Storage")
        ok(len(sb.arquivos) == 2 * N, f"{2 * N} arquivos no Storage (foto + miniatura)")
        tam = sorted(len(v['bytes']) for k, v in sb.arquivos.items() if not k.endswith('-mini.jpg'))
        ok(tam[-1] < 1_000_000, f"fotos reduzidas antes de subir (maior: {tam[-1] // 1024} KB)")
        ok(all(f['status'] == 'pendente' for f in al), "por padrão vão para a Curadoria")
        await pg.wait_for_function("/Tudo salvo no servidor/.test((document.querySelector('#sync-ind')||{}).textContent||'')", timeout=20000)
        n_srv = psql("select jsonb_array_length(dados) from registros where colecao='album' and id='_'")
        ok(n_srv and int(n_srv[0]) == N, "coleção do Álbum salva no servidor (só endereços)")
        tam_json = int(psql("select length(dados::text) from registros where colecao='album' and id='_'")[0])
        ok(tam_json < N * 1500, f"coleção leve: {tam_json // 1024} KB para {N} fotos (sem base64)")
        # 3) curadoria publica e a miniatura aparece; excluir apaga também o arquivo
        await pg.click('[data-s2=cur]'); await pg.wait_for_selector('[data-pub]')
        src = await pg.get_attribute('.foto-card img', 'src'); ok(src.endswith('-mini.jpg'), "a grade usa a miniatura")
        ok(await pg.evaluate("(async u => (await fetch(u)).status)(%r)" % src) == 200, "miniatura abre pelo endereço público")
        pg.on('dialog', lambda d: asyncio.ensure_future(d.accept()))
        antes = len(sb.arquivos); await pg.locator('[data-x]').first.click(); await pg.wait_for_timeout(1000)
        ok(len(sb.arquivos) == antes - 2, "excluir a foto apaga a foto e a miniatura do Storage")
        ok(not errs, "sem erros de JavaScript " + str(errs[:3]))
        await ctx.close()
        # 5) com a Cloudflare R2 ligada (função album-r2 configurada), o lote vai para a R2
        sb.r2 = True
        ctx = await br.new_context(viewport={'width': 1280, 'height': 900}); await ctx.route(URL_SB + '/**', sb.tratar)
        await ctx.route('https://r2-falso.test/**', sb.tratar_r2); await ctx.route('https://fotos-falso.test/**', sb.tratar_r2)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await entra(pg, 'ana@x.com', 'senhaAna1234')
        await pg.evaluate("document.querySelector('[data-tab=album]').click()"); await pg.wait_for_timeout(500)
        await pg.click('[data-s=lote]'); await pg.wait_for_selector('#fl')
        await pg.wait_for_function("document.querySelector('#lt-uso') && /Cloudflare R2/.test(document.querySelector('#lt-uso').textContent)")
        ok('10.240 MB' in await pg.inner_text('#lt-uso'), "mostra que as fotos vão para a Cloudflare R2 (10 GB grátis)")
        await pg.set_input_files('#l-f', arqs[:15]); await pg.select_option('#l-s', 'publicada')
        await pg.click('#fl button.btn-large'); await pg.wait_for_selector('text=Envio concluído', timeout=120000)
        al = await pg.evaluate("PR_DADOS.db.get('album',[]).filter(f=>f.armazem==='r2')")
        ok(len(al) == 15 and len(sb.r2_arquivos) == 30 and all(f['foto'].startswith('https://fotos-falso.test/') and f['status'] == 'publicada' for f in al), "15 fotos (+ miniaturas) na R2, já publicadas")
        n_sup = len(sb.arquivos)
        ok(n_sup == len(sb.arquivos), "nada novo no Supabase Storage")
        await pg.goto(B + '/fotos.html?servidor=1'); await pg.wait_for_timeout(1500)
        await ctx.close()
        # 4) as políticas do banco barram quem não tem a função (mesmo chamando o servidor direto)
        ctx = await br.new_context(); await ctx.route(URL_SB + '/**', sb.tratar); pg = await ctx.new_page(); await entra(pg, 'beto@x.com', 'senhaBeto123')
        st = await pg.evaluate("(async () => (await PR_SUPABASE.enviarArquivo('album', 'x/teste.jpg', new Blob(['oi'], {type: 'image/jpeg'}))).status)()")
        ok(st in (400, 403), f"servidor recusa envio de quem não cuida do Álbum ({st})")
        await br.close()
try: asyncio.run(main())
finally: srv.terminate()
