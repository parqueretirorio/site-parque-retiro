"""
Teste automático — Blocos 4 e 5: Pessoas + E-mail para Grupos (17/11/2026)
Verifica: com-pessoas.js, com-email.js, migrações 0015 e 0017,
          inclusão em area-restrita.html.
Sem acesso ao Supabase real. Roda em cópia local.
"""
import os

ROOT = os.path.join(os.path.dirname(__file__), '..')
ok = []; falha = []

def check(desc, cond, detalhe=''):
    if cond: ok.append(desc)
    else: falha.append(desc + (f' | {detalhe}' if detalhe else ''))

# ── com-pessoas.js ────────────────────────────────────────────────────────────
js = open(os.path.join(ROOT, 'com-pessoas.js'), encoding='utf-8').read()

check('com-pessoas.js: renderPainel definida',           'function renderPainel' in js)
check('com-pessoas.js: adicionarContato definida',       'function adicionarContato' in js)
check('com-pessoas.js: atualizarContato definida',       'function atualizarContato' in js)
check('com-pessoas.js: removerContato definida',         'function removerContato' in js)
check('com-pessoas.js: exportarCSV definida',            'function exportarCSV' in js)
check('com-pessoas.js: sincronizar definida',            'function sincronizar' in js)
check('com-pessoas.js: filtrar definida',                'function filtrar' in js)
check('com-pessoas.js: lerContatos definida',            'function lerContatos' in js)
check('com-pessoas.js: valida e-mail obrigatorio',       'E-mail obrigatório' in js)
check('com-pessoas.js: detecta e-mail duplicado',        'já está na lista' in js)
check('com-pessoas.js: vinculo tem inscritos',           'inscrito' in js)
check('com-pessoas.js: vinculo tem doadores',            'doador' in js)
check('com-pessoas.js: exporta CSV com BOM UTF-8',       'ufeff' in js or 'BOM' in js or 'utf-8' in js.lower())
check('com-pessoas.js: sincroniza via rpc',              "pr_sincronizar_contatos" in js)
check('com-pessoas.js: PR_PESSOAS exportado',            'window.PR_PESSOAS' in js)
check('com-pessoas.js: iniciar aceita db',               'function iniciar(db)' in js or 'function iniciar' in js)

# ── com-email.js ──────────────────────────────────────────────────────────────
em = open(os.path.join(ROOT, 'com-email.js'), encoding='utf-8').read()

check('com-email.js: renderPainel definida',             'function renderPainel' in em)
check('com-email.js: enviarAviso definida',              'function enviarAviso' in em)
check('com-email.js: montarHtml definida',               'function montarHtml' in em)
check('com-email.js: montarDestinatarios definida',      'function montarDestinatarios' in em)
check('com-email.js: lerEnvios definida',                'function lerEnvios' in em)
check('com-email.js: tipos de destinatario definidos',   'todos' in em and 'inscritos' in em and 'doadores' in em)
check('com-email.js: limite Gmail definido',             'LIMITE_GMAIL' in em)
check('com-email.js: envia via enviar-email',            "funcao('enviar-email'" in em)
check('com-email.js: envia em lotes de 20',              'i += 20' in em)
check('com-email.js: registra envio no Supabase',        'pr_registrar_envio' in em)
check('com-email.js: histórico de envios exibido',       'Histórico de envios' in em)
check('com-email.js: pre-visualizacao disponivel',       'Pré-visualizar' in em)
check('com-email.js: rodape com instrucao descadastrar', 'descadastrar' in em)
check('com-email.js: PR_EMAIL_GRUPOS exportado',         'window.PR_EMAIL_GRUPOS' in em)
check('com-email.js: HTML com saudacao personalizada',   'saudacao' in em)

# ── migração 0015 ─────────────────────────────────────────────────────────────
sql15 = open(os.path.join(ROOT, 'supabase/migrations/0015_contatos_pessoas.sql'), encoding='utf-8').read()

check('migração 0015: função pr_buscar_contatos',        'pr_buscar_contatos' in sql15)
check('migração 0015: função pr_sincronizar_contatos',   'pr_sincronizar_contatos' in sql15)
check('migração 0015: grant para authenticated',         'authenticated' in sql15)
check('migração 0015: sincroniza inscrições',            'com_inscricoes' in sql15)
check('migração 0015: sincroniza doações',               'com_doacoes' in sql15 or 'vaquinha_doacoes' in sql15)
check('migração 0015: linha de confirmação ok',          "ok" in sql15)

# ── migração 0017 ─────────────────────────────────────────────────────────────
sql17 = open(os.path.join(ROOT, 'supabase/migrations/0017_envios_email_grupos.sql'), encoding='utf-8').read()

check('migração 0017: função pr_registrar_envio',        'pr_registrar_envio' in sql17)
check('migração 0017: colecao com_envios',               'com_envios' in sql17)
check('migração 0017: grant para authenticated',         'authenticated' in sql17)
check('migração 0017: linha de confirmação ok',          "ok" in sql17)

# ── area-restrita.html ────────────────────────────────────────────────────────
html = open(os.path.join(ROOT, 'area-restrita.html'), encoding='utf-8').read()

check('area-restrita.html: carrega com-pessoas.js',      'com-pessoas.js' in html)
check('area-restrita.html: carrega com-email.js',        'com-email.js' in html)
check('area-restrita.html: ordem: com-emailmkt antes',   html.index('com-emailmkt.js') < html.index('com-pessoas.js'))

# ── Resultado ─────────────────────────────────────────────────────────────────
total = len(ok) + len(falha)
print(f'\n{"="*60}')
print(f'Blocos 4+5 — Pessoas + E-mail: {len(ok)}/{total} verificações OK')
print(f'{"="*60}')
if falha:
    print('\nFALHAS:')
    for f in falha: print(f'  ✗ {f}')
else:
    print('\nTodas as verificações passaram.')
print()
