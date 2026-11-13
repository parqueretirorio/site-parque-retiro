# Teste: Documentos e Calendários > Atas > "Ata a partir da transcrição" (Zoom .vtt e YouTube .srt/.vtt).
import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT = 8866
srv = subprocess.Popen(["python3", "-m", "http.server", str(PORT), "-d", SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
U = f"http://localhost:{PORT}/"
def ok(c, m):
    print(("OK  " if c else "FALHOU ") + m); assert c, m
ZOOM = 'WEBVTT\n\n1\n00:00:05.120 --> 00:00:08.300\nLeonidas Teste: Bom dia a todos, vamos começar a Frente de Ação.\n\n2\n00:00:08.400 --> 00:00:12.000\nLeonidas Teste: Primeiro ponto: o site.\n\n3\n00:01:10.000 --> 00:01:15.500\nCristina Souza: Proponho revisar o regulamento até dezembro.\n\n4\n01:02:00.000 --> 01:02:05.000\nAna Lima: Obrigada a todos.\n'
YT = '1\n00:00:01,000 --> 00:00:04,000\nolá pessoal bem-vindos\n\n2\n00:00:04,000 --> 00:00:06,000\nà reunião de escola\n'
async def main():
    os.makedirs('/tmp/trs', exist_ok=True)
    open('/tmp/trs/GMT20261120-001500_Recording.transcript.vtt', 'w').write(ZOOM); open('/tmp/trs/reuniao.srt', 'w').write(YT); open('/tmp/trs/vazio.txt', 'w').write('')
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 1280, 'height': 900})).new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto(U + "login.html#criar-conta")
        await pg.fill('#n', 'Leonidas Teste'); await pg.fill('#e', 'a@t.com'); await pg.fill('#s', 'senha12345'); await pg.fill('#s2', 'senha12345'); await pg.fill('#w', '21999990000'); await pg.check('#cc-lgpd-ok'); await pg.click('#f button.btn-large')
        await pg.wait_for_url("**/area-restrita.html")
        await pg.evaluate("document.querySelector('[data-tab=documentos]').click()"); await pg.wait_for_timeout(600)
        await pg.evaluate("document.querySelector('#tab [data-s=atas]').click()"); await pg.wait_for_timeout(300)
        ok(await pg.locator('label[for=d-trs]').count() == 1, "botão 'Ata a partir da transcrição' nas Atas")
        await pg.set_input_files('#d-trs', '/tmp/trs/vazio.txt'); await pg.wait_for_timeout(300)
        ok('Não encontrei texto' in await pg.inner_text('#tab'), "arquivo vazio: aviso claro")
        await pg.set_input_files('#d-trs', '/tmp/trs/GMT20261120-001500_Recording.transcript.vtt'); await pg.wait_for_timeout(300)
        await pg.wait_for_selector('#trs-box')
        box = await pg.inner_text('#trs-box')
        ok('Leonidas Teste, Cristina Souza, Ana Lima' in box, "mostra quem falou (Zoom)")
        ok(await pg.input_value('#tr-d') == '2026-11-19', "data tirada do nome do arquivo do Zoom (horário de Brasília)")
        ok('duração 1:02:05' in box and 'Proponho revisar o regulamento' in box, "duração e texto da transcrição")
        await pg.screenshot(path='/tmp/trs-conferir.png', full_page=True)
        await pg.fill('#tr-t', 'Frente de Ação CONecta Retiro'); await pg.fill('#tr-v', 'https://youtu.be/abc123')
        await pg.click('#tr-ok'); await pg.wait_for_selector('#fd')
        d = await pg.evaluate("PR_DADOS.db.get('docs',[]).find(d=>d.titulo==='Frente de Ação CONecta Retiro')")
        ok(d and d['data'] == '2026-11-19' and d['participantes'] == ['Leonidas Teste', 'Cristina Souza', 'Ana Lima'] and 'Cristina Souza: Proponho' in d['transcricao'] and d['videos'][0]['url'] == 'https://youtu.be/abc123', "ata criada com transcrição, participantes e vídeo")
        ok(await pg.input_value('#d-t') == 'Frente de Ação CONecta Retiro', "abre a edição para escrever resumo e encaminhamentos")
        await pg.fill('#d-s', 'Resumo: revisão do regulamento proposta.'); await pg.click('#fd button.btn-large'); await pg.wait_for_timeout(400)
        d = await pg.evaluate("PR_DADOS.db.get('docs',[]).find(d=>d.titulo==='Frente de Ação CONecta Retiro')")
        ok(d['descricao'].startswith('Resumo') and 'Proponho' in d['transcricao'], "salvar a edição mantém a transcrição")
        await pg.click('text=Ler a transcrição da reunião'); await pg.wait_for_timeout(200)
        async with pg.expect_download() as dl: await pg.click('[data-trb]')
        ok((await dl.value).suggested_filename == 'transcricao-2026-11-19.txt', "baixar a transcrição em .txt")
        await pg.screenshot(path='/tmp/trs-ata.png', full_page=True)
        # legenda do YouTube (.srt): sem nomes, data de hoje
        await pg.set_input_files('#d-trs', '/tmp/trs/reuniao.srt'); await pg.wait_for_selector('#trs-box')
        box = await pg.inner_text('#trs-box')
        ok('não traz os nomes' in box and 'olá pessoal bem-vindos à reunião de escola' in box, "legenda do YouTube (.srt) lida e juntada")
        await pg.click('#tr-x'); ok(await pg.locator('#trs-box').count() == 0, "cancelar não cria nada")
        ok(not errs, "sem erros de JavaScript " + str(errs[:3]))
        await b.close()
try: asyncio.run(main())
finally: srv.terminate()
