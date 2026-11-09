# Gera as capturas de tela ilustradas da Central de Ajuda (ajuda/img/*.jpg) a partir da INTERFACE ATUAL do site.
# Cada captura destaca, com moldura vermelha numerada, os botões e campos citados no artigo.
# Rode de novo sempre que uma tela mudar, para as imagens acompanharem a versão atual da interface:
#     python3 tools/gerar_capturas_ajuda.py            (a partir da pasta do site; precisa de Python + Playwright)
# Saída: ajuda/img/<id>.jpg e ajuda/img/capturas.json ({ artigo: [ {src, legenda, alt} ] }).
# O arquivo capturas.json serve de referência: as imagens já estão ligadas aos artigos em ajuda-conteudo.js; para
# trocar uma imagem de artigo use a área restrita (Central de Ajuda > Artigos > Editar > Imagens) ou mantenha o mesmo nome de arquivo.
# Opcional: FA_LOCAL=/caminho/fontawesome-free para usar ícones locais quando não houver acesso ao CDN.
import asyncio, subprocess, time, os, sys, json
from playwright.async_api import async_playwright

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(SITE, 'ajuda', 'img'); os.makedirs(OUT, exist_ok=True)
PORT = 8811; U = f'http://localhost:{PORT}/'
FA = os.environ.get('FA_LOCAL')
ABA = lambda t: f"document.querySelector('[data-tab={t}]').click()"
SUB = lambda sel: f"document.querySelector('#tab {sel}').click()"

# id, artigo, página, ações (JS), alvos (CSS, numerados na ordem), área recortada (CSS ou None = janela), legenda
CAPTURAS = [
  ('menu-topo', 'menu-do-site', 'index.html', [], ['header nav', '.btn-entrar', '#pr-aj-botao'], 'header', '1. Menu do site · 2. Entrar na área restrita · 3. Ajuda desta tela.'),
  ('ajuda-dica', 'como-usar-a-ajuda', 'como-fazer.html', ["HOVER:#f-chegada"], [], None, 'Dica rápida: aparece ao parar o mouse sobre o campo. "Saiba mais" abre o artigo completo.'),
  ('ajuda-painel', 'como-usar-a-ajuda', 'como-fazer.html', ["document.querySelector('#pr-aj-botao').click()"], ['.pr-aj-nesta', '[data-modo]'], None, 'O botão ? Ajuda abre o painel: 1. ajuda desta tela · 2. ligar o modo ajuda.'),
  ('ajuda-modo', 'como-usar-a-ajuda', 'como-fazer.html', ["PR_AJUDA.modo(true)", "CLICK:#f-hosp"], ['#pr-aj-faixa'], None, 'Modo ajuda: os itens com explicação ficam contornados; clique em um deles para ler.'),
  ('reserva-formulario', 'pedir-reserva', 'como-fazer.html', ["document.querySelector('#f-chegada').scrollIntoView({block:'center'})"], ['#f-chegada', '#f-saida', '#f-hosp', '#f-detalhes'], 'form', '1–2. Datas de chegada e saída · 3. Cama no alojamento · 4. Detalhes e nomes do grupo.'),
  ('calendario', 'calendario-de-uso', 'calendario.html', [], ['#cal-anterior', '#cal-hoje', '#cal-proximo'], None, '1. Mês anterior · 2. Hoje · 3. Mês seguinte. Cada dia mostra se o Centro de Estudo está ocupado.'),
  ('fotos-envio', 'enviar-fotos-album', 'fotos.html', ["document.querySelector('#p-f').scrollIntoView({block:'center'})"], ['#p-f', '#p-e', '#p-m'], 'form', '1. Escolha até 10 fotos · 2. Atividade · 3. Mostrar ou não o seu nome.'),
  ('voluntario-form', 'ser-voluntario', 'voluntario.html', ["document.querySelector('#v-n').scrollIntoView({block:'start'})"], ['#v-n', '#v-c', '#va-0'], 'form', '1. Nome completo · 2. Celular/WhatsApp · 3. Formas de colaborar.'),
  ('pagar-online', 'doar-e-pagar-online', 'pagar.html', ["document.querySelector('#pg-t').scrollIntoView({block:'start'})"], ['#pg-t', '#pg-v', '#pg-b'], 'form', '1. O que pagar · 2. Valor · 3. Ir para o pagamento seguro (Asaas).'),
  ('newsletter', 'receber-comunicado', 'newsletter.html', [], ['#cad-e', '#cad-c'], 'form', '1. Seu e-mail · 2. Concordar em receber.'),
  ('login', 'criar-conta-e-entrar', 'login.html', ["sessionStorage.removeItem('pr_temp')"], ['[data-m=entrar]', '[data-m=cadastro]'], '#loginBox', '1. Entrar (conta aprovada) · 2. Criar conta (aguarda aprovação).'),
  ('painel', 'painel-conecta', 'area-restrita.html', [], ['[data-area=com] .area-titulo', '[data-area=adm] .area-titulo', '#pr-aj-botao'], None, '1. Comissões Parque Retiro · 2. Administração · 3. Ajuda desta tela.'),
  ('biblioteca-cadastro', 'biblioteca-gestao', 'area-restrita.html', [ABA('acervo'), SUB('[data-bs=gestao]')], ['#g-t', '#g-l', '#g-c'], '#tab', '1. Título · 2. Localização física (aparece para o público) · 3. Foto da capa.'),
  ('livraria', 'livraria-gestao', 'area-restrita.html', [ABA('acervo'), SUB('[data-bs=livraria]')], ['#tab [data-ls=est]', '#tab [data-ls=venda]', '#tab [data-ls=enc]'], '#tab', '1. Catálogo e estoque · 2. Registrar venda · 3. Pré-lançamento e encomendas.'),
  ('zoom', 'zoom-agendamento', 'area-restrita.html', [ABA('zoom')], ['#z-t', '#z-d', '#z-l'], '#tab', '1. Título · 2. Data e horário · 3. Link do Zoom.'),
  ('reservas-abas', 'reservas-alojamento', 'area-restrita.html', [ABA('reservas'), SUB('[data-s=novo]')], ['#tab [data-s=ped]', '#tab [data-s=ocup]', '#tab [data-s=novo]', '#tab [data-s=rel]'], '#tab', '1. Pedidos · 2. Ocupação (camas e ASSEFAZ) · 3. Registrar pedido · 4. Relatório e recebimentos.'),
  ('estela', 'estela-gestao', 'area-restrita.html', [ABA('estela')], ['#tab [data-et="1"]', '#tab [data-et="2"]', '#e-n'], '#tab', '1. Etapa 1: cadastro · 2. Etapa 2: publicação · 3. Nome completo.'),
  ('elemento', 'elementos-descricoes', 'area-restrita.html', [ABA('el_sala')], ['#el-d'], '#tab', 'Descrição do elemento (aqui, a Sala).'),
  ('album', 'album-gestao', 'area-restrita.html', [ABA('album')], ['#tab [data-s=minhas]', '#tab [data-s=cur]', '#a-f'], '#tab', '1. Enviar e minhas fotos · 2. Curadoria · 3. Escolher as fotos.'),
  ('documentos', 'documentos-calendarios', 'area-restrita.html', [ABA('documentos')], ['#tab [data-s=atas]', '#tab [data-s=semana]', '#d-novo', '#l-ab'], '#tab', '1. Atas · 2. Calendários · 3. Novo documento · 4. Só atas com encaminhamentos em aberto.'),
  ('atividades', 'atividades-gestao', 'area-restrita.html', [ABA('atividades')], ['#at-novo', '#at-fil'], '#tab', '1. Nova atividade · 2. Filtrar por tipo.'),
  ('multiuso', 'multiuso-gestao', 'area-restrita.html', [ABA('multiuso')], ['#tab [data-s=agenda]', '#m-d', '#m-s'], '#tab', '1. Agenda de uso · 2. Data · 3. Situação.'),
  ('jardinagem', 'jardinagem-gestao', 'area-restrita.html', [ABA('jardinagem')], ['#tab [data-s=jardinagem]', '#tab [data-s=reflorestamento]', '#tab [data-s=resumo]'], '#tab', '1. Jardinagem · 2. Reflorestamento · 3. Resumo.'),
  ('lojinha', 'lojinha-gestao', 'area-restrita.html', [ABA('lojinha')], ['#j-n', '#j-p', '#j-pub'], '#tab', '1. Nome do produto · 2. Preço · 3. Publicar no site.'),
  ('rifa', 'rifa-gestao', 'area-restrita.html', [ABA('rifa')], ['#r-n', '#r-dt', '#r-pub'], '#tab', '1. Quantidade de números · 2. Dia do sorteio · 3. Aberta no site.'),
  ('vaquinha', 'vaquinha-gestao', 'area-restrita.html', [ABA('vaquinha')], ['#v-m', '#v-i', '#v-pub'], '#tab', '1. Meta · 2. Instruções de pagamento · 3. Aberta no site.'),
  ('voluntarios', 'voluntarios-gestao', 'area-restrita.html', [ABA('vol_acoes')], ['#va-n', '#va-o', '#va-p'], '#tab', 'Ações de Voluntário: 1. Nome · 2. Objetivo · 3. Plano.'),
  ('comunicacao', 'comunicacao-visao-geral', 'area-restrita.html', [ABA('comunicacao')], ['#tab .tabs.sub'], '#tab', 'As 12 sub-abas da Comunicação.'),
  ('publicacoes', 'painel-publicacoes', 'area-restrita.html', [ABA('comunicacao'), SUB('[data-s=pub]')], ['#tab [data-pv=painel]', '#tab [data-pv=fila]', '#tab [data-pv=lista]', '#a-novo'], '#tab', '1. Painel · 2. Fila de publicação · 3. Lista · 4. Nova ação de comunicação.'),
  ('banners', 'banners-do-site', 'area-restrita.html', [ABA('comunicacao'), SUB('[data-s=site]')], ['#bn-zip', '#tab [data-a=abrir]'], '#tab', '1. Baixar pacote para publicar · 2. Configurar o banner de uma página.'),
  ('equipe', 'equipe-convidados', 'area-restrita.html', [ABA('comunicacao'), SUB('[data-s=equipe]')], ['#eq-an', '#eq-e', '#eq-a'], '#tab', '1. Quem criou não aprova · 2. E-mail do convidado · 3. Válido até.'),
  ('listas-email', 'listas-email', 'area-restrita.html', [ABA('contatos')], ['#tab [data-l=visitante]', '#ct-i'], '#tab', '1. Escolha a lista · 2. Importar vários contatos.'),
  ('contas', 'prestacao-contas', 'area-restrita.html', [ABA('contas')], ['#c-cc', '#c-t', '#c-v', '#c-m'], '#tab', '1. Centro de custo · 2. Tipo de operação · 3. Valor · 4. Forma de pagamento.'),
  ('compras', 'compras-orcamento', 'area-restrita.html', [ABA('compras')], ['#tab [data-s=ped]', '#tab [data-s=plano]', '#tab [data-s=cons]', '#pd-n'], '#tab', '1. Pedidos · 2. Planejamento anual · 3. Consolidado · 4. Novo pedido de compra.'),
  ('inventario-cadastro', 'inventario-gestao', 'area-restrita.html', [ABA('inventario'), SUB('[data-s=cad]')], ['#f-c', '#f-n', '#f-q'], '#tab', '1. Categoria · 2. Nome do item · 3. Quantidade. Mais abaixo: localização, estado, foto e a opção É patrimônio do Parque.'),
  ('inventario-importar', 'inventario-importar', 'area-restrita.html', [ABA('inventario'), SUB('[data-s=imp]')], ['#im-mod', '#im-f'], '#tab', '1. Baixar o modelo · 2. Escolher a planilha preenchida.'),
  ('patrimonio', 'patrimonio-gestao', 'area-restrita.html', [ABA('patrimonio')], ['#p-q', '#p-p'], '#tab', '1. Buscar · 2. Bens com dados em aberto.'),
  ('responsaveis', 'gestao-de-responsaveis', 'area-restrita.html', [ABA('users')], ['#u-v', '#tab fieldset.funcoes', '#u-s'], '#tab', '1. Nível de acesso · 2. Responsabilidades · 3. Senha provisória.'),
  ('mapa', 'mapa-de-contas', 'area-restrita.html', [ABA('mapa')], ['#m-p'], '#tab', 'Adicionar uma conta digital ao mapa.'),
  ('backup', 'backup-e-restauracao', 'area-restrita.html', [ABA('backup')], ['#bk-baixar', '#bk-arq'], '#tab', '1. Baixar backup completo · 2. Arquivo para restaurar.'),
  ('relatorios', 'relatorios-consolidados', 'area-restrita.html', [ABA('relatorios'), SUB('[data-ab=mod]')], ['#rc-m', '#rc-r', '#rc-g'], '#tab', '1. Módulo · 2. Relatório · 3. Agrupar por.'),
  ('central-admin', 'administrar-central-ajuda', 'area-restrita.html', [ABA('central_ajuda')], ['#tab .tabs.sub', '#ca-novo'], '#tab', '1. Artigos, Categorias, Explicações rápidas, Cobertura e Publicar · 2. Novo artigo.'),
  ('editar-dica', 'editar-explicacoes-rapidas', 'area-restrita.html', [ABA('zoom'), "PR_AJUDA.modo(true)", "CLICK:#z-l"], ['[data-edita]'], None, 'No modo ajuda, clique no item e use "Editar esta explicação".'),
  ('publicar', 'publicar-ajuda', 'area-restrita.html', [ABA('central_ajuda'), SUB('[data-ca=pub]')], ['#ca-pjs', '#ca-pjson'], '#tab', '1. Arquivo para a hospedagem do site · 2. JSON para o aplicativo.'),
]

MARCA = """(sels)=>{document.querySelectorAll('.pr-aj-marca').forEach(e=>e.remove());sels.forEach((s,i)=>{const el=document.querySelector(s);if(!el)return;
const r=el.getBoundingClientRect(),d=document.createElement('div');d.className='pr-aj-marca';
d.style.cssText=`position:absolute;left:${r.left+scrollX-5}px;top:${r.top+scrollY-5}px;width:${r.width+10}px;height:${r.height+10}px;border:3px solid #e53935;border-radius:8px;z-index:20000;pointer-events:none;box-shadow:0 0 0 3px rgba(229,57,53,.18)`;
const n=document.createElement('span');n.textContent=i+1;n.style.cssText='position:absolute;left:-14px;top:-14px;width:26px;height:26px;border-radius:50%;background:#e53935;color:#fff;font:700 14px/26px Arial;text-align:center';
d.appendChild(n);document.body.appendChild(d);});}"""

async def main():
    srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '-d', SITE], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
    res = {}
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            for cid, art, pag, acoes, alvos, area, leg in CAPTURAS:
                ctx = await b.new_context(viewport={'width': 1200, 'height': 820}, device_scale_factor=1)
                if FA:
                    async def fa(route):
                        u = route.request.url
                        if u.endswith('.css'): await route.fulfill(path=FA + '/css/all.min.css', content_type='text/css')
                        else: await route.fulfill(path=FA + '/webfonts/' + u.split('/')[-1].split('?')[0])
                    await ctx.route('https://cdnjs.cloudflare.com/**', fa)
                await ctx.add_init_script("try{if(!sessionStorage.getItem('pr_sem_temp'))sessionStorage.setItem('pr_temp','1');localStorage.setItem('pr_ajuda_dicas','on')}catch(e){}")
                pg = await ctx.new_page(); pg.on('dialog', lambda d: asyncio.ensure_future(d.dismiss()))
                await pg.goto(U + pag); await pg.wait_for_timeout(600)
                await pg.add_style_tag(content='.whatsapp-float{display:none!important}')
                for a in acoes:
                    if a.startswith('HOVER:'): await pg.hover(a[6:]); await pg.wait_for_timeout(900)
                    elif a.startswith('CLICK:'): await pg.click(a[6:]); await pg.wait_for_timeout(400)
                    else: await pg.evaluate(a); await pg.wait_for_timeout(350)
                await pg.evaluate(MARCA, alvos); await pg.wait_for_timeout(150)
                arq = os.path.join(OUT, cid + '.jpg'); clip = None
                if area:
                    bb = await pg.evaluate("s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,w:r.width,h:r.height}}", area)
                    if bb: clip = {'x': max(0, bb['x'] - 16), 'y': max(0, bb['y'] - 16), 'width': min(1200, bb['w'] + 32), 'height': min(1000, bb['h'] + 32)}
                if clip: await pg.screenshot(path=arq, clip=clip, full_page=True, type='jpeg', quality=72)
                else: await pg.screenshot(path=arq, type='jpeg', quality=72)
                res.setdefault(art, []).append({'src': 'ajuda/img/' + cid + '.jpg', 'legenda': leg, 'alt': 'Captura de tela: ' + leg})
                await ctx.close(); print('ok', cid)
            await b.close()
    finally:
        srv.terminate()
    json.dump(res, open(os.path.join(OUT, 'capturas.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(sum(len(v) for v in res.values()), 'capturas em', OUT)

asyncio.run(main())
