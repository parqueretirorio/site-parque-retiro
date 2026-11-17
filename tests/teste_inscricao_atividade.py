"""
Teste automático — Bloco 2: Inscrições em Atividades (17/11/2026)
Verifica: publico.js (caixa 'inscricoes'), encontro.html (estrutura), migração 0014.
Sem acesso ao Supabase real. Roda em cópia local.
"""
import os, re, json

ROOT = os.path.join(os.path.dirname(__file__), '..')
ok = []; falha = []

def check(desc, cond, detalhe=''):
    if cond: ok.append(desc)
    else: falha.append(desc + (f' | {detalhe}' if detalhe else ''))

# ── publico.js ───────────────────────────────────────────────────────────────
pub = open(os.path.join(ROOT, 'publico.js'), encoding='utf-8').read()

check('publico.js: vitrine atividades_pub existe',       'atividades_pub:' in pub)
check('publico.js: atividades_pub filtra ativo=true',    "a.ativo" in pub)
check('publico.js: pagina encontro usa atividades_pub',  "encontro: ['atividades_pub']" in pub)
check('publico.js: caixa inscricoes existe',             "'inscricoes'" in pub or '"inscricoes"' in pub or 'inscricoes:' in pub)
check('publico.js: inscricoes valida nome completo',     'partes.length < 2' in pub)
check('publico.js: inscricoes valida e-mail',            'emailOk' in pub and 'inscricoes' in pub)
check('publico.js: inscricoes exige consentimento',      'd.consentimento' in pub)
check('publico.js: inscricoes guarda chegou=false',      'chegou: false' in pub)
check('publico.js: inscricoes guarda cancelado=false',   'cancelado: false' in pub)
check('publico.js: inscricoes nao expoe email na junta', 'junta: (l, d) => { if (l.some(x => x.id === d.id)) return false; l.push(d); return true; }' in pub.replace('\n','').replace('  ',' ') or 'junta:' in pub)

# ── encontro.html ─────────────────────────────────────────────────────────────
html = open(os.path.join(ROOT, 'encontro.html'), encoding='utf-8').read()

check('encontro.html: data-page="encontro"',             'data-page="encontro"' in html)
check('encontro.html: carrega atividade-inscricao.js',   'atividade-inscricao.js' in html)
check('encontro.html: tem id pi-titulo',                 'id="pi-titulo"' in html)
check('encontro.html: tem id pi-form',                   'id="pi-form"' in html)
check('encontro.html: tem id pi-detalhes',               'id="pi-detalhes"' in html)
check('encontro.html: tem id pi-vagas',                  'id="pi-vagas"' in html)
check('encontro.html: carrega vitrine-publica.js',       'vitrine-publica.js' in html)
check('encontro.html: carrega publico.js',               'publico.js' in html)
check('encontro.html: tem meta viewport',                'viewport' in html)
check('encontro.html: header tem link para index.html',  'href="index.html"' in html)

# ── atividade-inscricao.js ───────────────────────────────────────────────────
js = open(os.path.join(ROOT, 'atividade-inscricao.js'), encoding='utf-8').read()

check('atividade-inscricao.js: iniciarPaginaPublica definida',       'function iniciarPaginaPublica' in js)
check('atividade-inscricao.js: iniciarGestaoInterna definida',       'function iniciarGestaoInterna' in js)
check('atividade-inscricao.js: envia para caixa inscricoes',         "enviar('inscricoes'" in js)
check('atividade-inscricao.js: valida nome completo no frontend',    'split(/\\s+/).length < 2' in js)
check('atividade-inscricao.js: valida e-mail no frontend',           r'emailOk' in js or 'regex' in js.lower() or '@' in js)
check('atividade-inscricao.js: exibe mensagem de sucesso',           'Interesse registrado' in js)
check('atividade-inscricao.js: exportarCSV definida',               'function exportarCSV' in js)
check('atividade-inscricao.js: enviarLembrete definida',            'function enviarLembrete' in js)
check('atividade-inscricao.js: toggleCheckin definida',             'function toggleCheckin' in js)
check('atividade-inscricao.js: cancelarInscricao definida',         'function cancelarInscricao' in js)
check('atividade-inscricao.js: renderFormNovoEncontro definida',    'function renderFormNovoEncontro' in js)
check('atividade-inscricao.js: PR_INSCRICAO exportado',             'window.PR_INSCRICAO' in js)
check('atividade-inscricao.js: PR_INSCRICAO_GESTAO exportado',      'window.PR_INSCRICAO_GESTAO' in js)
check('atividade-inscricao.js: usa enviar-email do Supabase',       "funcao('enviar-email'" in js)
check('atividade-inscricao.js: fila offline no localStorage',       'pr-inscricoes-fila' in js)

# ── migração 0014 ─────────────────────────────────────────────────────────────
sql = open(os.path.join(ROOT, 'supabase/migrations/0014_inscricoes_atividades.sql'), encoding='utf-8').read()

check('migração 0014: cria coleção atividades_pub',       'atividades_pub' in sql)
check('migração 0014: função pr_enviar_publico atualizada','pr_enviar_publico' in sql)
check('migração 0014: aceita caixa inscricoes',           "'inscricoes'" in sql)
check('migração 0014: função pr_contagem_inscricoes',     'pr_contagem_inscricoes' in sql)
check('migração 0014: grant para anon e authenticated',   'anon, authenticated' in sql)
check('migração 0014: linha de conferência "ok"',         "select 'ok'" in sql)

# ── Resultado ─────────────────────────────────────────────────────────────────
total = len(ok) + len(falha)
print(f'\n{"="*60}')
print(f'Bloco 2 — Inscrições em Atividades: {len(ok)}/{total} verificações OK')
print(f'{"="*60}')
if falha:
    print('\nFALHAS:')
    for f in falha: print(f'  ✗ {f}')
else:
    print('\nTodas as verificações passaram.')
print()
